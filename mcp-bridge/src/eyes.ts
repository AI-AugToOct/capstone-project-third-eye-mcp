import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fetch from "node-fetch";
import { launchPortal } from "./portal.js";
import { sessionManager, type SessionContext as SessionManagerContext } from "./session-manager.js";

const API_URL = process.env.API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";
const RESERVED_WRAPPER_KEYS = new Set(["signal", "_meta", "requestId", "progressToken", "arguments"]);

function generateTraceId(): string {
  return `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateConnectionId(): string {
  return `conn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type SessionContext = {
  session_id: string;
  user_id: string | null;
  lang: "auto" | "en" | "ar";
  budget_tokens: number;
  tenant?: string | null;
};

// Connection ID will be generated per actual MCP connection
let currentConnectionId: string | null = null;

function getConnectionId(): string {
  if (!currentConnectionId) {
    currentConnectionId = generateConnectionId();
    console.info(`[Third Eye MCP] New Connection ID: ${currentConnectionId}`);
  }
  return currentConnectionId;
}

const contextSchema = {
  type: "object",
  properties: {
    session_id: { type: "string" },
    user_id: { type: ["string", "null"] },
    tenant: { type: ["string", "null"] },
    lang: { enum: ["auto", "en", "ar"] },
    budget_tokens: { type: "number", minimum: 0 },
  },
  required: ["session_id", "lang", "budget_tokens"],
  additionalProperties: false,
} as const;

const API_KEY = process.env.THIRD_EYE_API_KEY ?? "";
if (!API_KEY) {
  console.warn(
    "[Third Eye MCP] THIRD_EYE_API_KEY is not set; API calls will be rejected with 401 until you configure it.",
  );
}

function extractEnvelope(raw: Record<string, unknown>): Record<string, unknown> {
  console.info(`[extractEnvelope] Input keys: ${Object.keys(raw).join(', ')}`);

  let envelope: Record<string, unknown> = raw;

  if (raw && typeof raw.arguments === "object" && raw.arguments !== null) {
    console.info(`[extractEnvelope] Found 'arguments' wrapper, unwrapping...`);
    envelope = raw.arguments as Record<string, unknown>;
    console.info(`[extractEnvelope] After unwrap, keys: ${Object.keys(envelope).join(', ')}`);
  } else {
    console.info(`[extractEnvelope] No 'arguments' wrapper found, using raw input`);
  }

  const cleaned: Record<string, unknown> = {};
  const filteredKeys: string[] = [];

  for (const [key, value] of Object.entries(envelope)) {
    if (RESERVED_WRAPPER_KEYS.has(key)) {
      filteredKeys.push(key);
      continue;
    }
    cleaned[key] = value;
  }

  if (filteredKeys.length > 0) {
    console.info(`[extractEnvelope] Filtered out reserved keys: ${filteredKeys.join(', ')}`);
  }
  console.info(`[extractEnvelope] Final cleaned keys: ${Object.keys(cleaned).join(', ')}`);

  return cleaned;
}

function ensureContext(): SessionContext {
  const connectionId = getConnectionId();
  const session = sessionManager.getOrCreate(connectionId);
  return {
    session_id: session.session_id,
    user_id: session.user_id,
    lang: session.lang,
    budget_tokens: session.budget_tokens,
    tenant: session.tenant,
  };
}

function coalesceContext(input: unknown): SessionContext {
  const base = ensureContext();
  if (!input || typeof input !== "object") {
    return base;
  }
  const raw = input as Record<string, unknown>;

  // Build updates object
  const updates: Partial<SessionManagerContext> = {};
  let hasUpdates = false;

  if (typeof raw.session_id === "string" && raw.session_id.trim()) {
    base.session_id = raw.session_id.trim();
    updates.session_id = raw.session_id.trim();
    hasUpdates = true;
  }
  if (typeof raw.user_id === "string" && raw.user_id.trim()) {
    base.user_id = raw.user_id.trim();
    updates.user_id = raw.user_id.trim();
    hasUpdates = true;
  } else if (raw.user_id === null) {
    base.user_id = null;
    updates.user_id = null;
    hasUpdates = true;
  }
  if (raw.lang === "en" || raw.lang === "ar" || raw.lang === "auto") {
    base.lang = raw.lang;
    updates.lang = raw.lang;
    hasUpdates = true;
  }
  const numericBudget = Number(raw.budget_tokens);
  if (Number.isFinite(numericBudget) && numericBudget >= 0) {
    base.budget_tokens = numericBudget;
    updates.budget_tokens = numericBudget;
    hasUpdates = true;
  }
  if (typeof raw.tenant === "string" && raw.tenant.trim()) {
    base.tenant = raw.tenant.trim();
    updates.tenant = raw.tenant.trim();
    hasUpdates = true;
  } else if (raw.tenant === null) {
    base.tenant = null;
    updates.tenant = null;
    hasUpdates = true;
  }

  // Update session manager if we have changes
  if (hasUpdates) {
    const connectionId = getConnectionId();
    sessionManager.update(connectionId, updates);
  }

  return base;
}

async function callEye(path: string, body: Record<string, unknown>) {
  const traceId = generateTraceId();

  console.info(`\n========== MCP TOOL CALL START [${traceId}] ==========`);
  console.info(`[${traceId}] [1. MCP-INPUT] Path: ${path}`);
  console.info(`[${traceId}] [1. MCP-INPUT] Raw body from MCP SDK:`, JSON.stringify(body, null, 2));
  console.info(`[${traceId}] [1. MCP-INPUT] Body type: ${typeof body}, is object: ${body !== null && typeof body === 'object'}`);
  console.info(`[${traceId}] [1. MCP-INPUT] Has 'arguments' key: ${body.hasOwnProperty('arguments')}`);
  console.info(`[${traceId}] [1. MCP-INPUT] Top-level keys: ${Object.keys(body).join(', ')}`);

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "X-Trace-Id": traceId,
  };
  if (API_KEY) {
    headers["X-API-Key"] = API_KEY;
  }

  const envelope = extractEnvelope(body);
  console.info(`[${traceId}] [2. EXTRACTED] Envelope after extraction:`, JSON.stringify(envelope, null, 2));
  console.info(`[${traceId}] [2. EXTRACTED] Envelope keys: ${Object.keys(envelope).join(', ')}`);
  console.info(`[${traceId}] [2. EXTRACTED] Has context: ${envelope.hasOwnProperty('context')}`);
  console.info(`[${traceId}] [2. EXTRACTED] Has payload: ${envelope.hasOwnProperty('payload')}`);

  const mergedContext = coalesceContext(envelope.context);
  console.info(`[${traceId}] [3. CONTEXT] Merged context:`, JSON.stringify(mergedContext, null, 2));

  envelope.context = mergedContext;
  if (!envelope.payload || typeof envelope.payload !== "object") {
    console.warn(`[${traceId}] [3. CONTEXT] Payload missing or invalid, setting to empty object`);
    envelope.payload = {};
  }

  const finalPayload = {
    context: envelope.context,
    payload: envelope.payload,
    reasoning_md: envelope.reasoning_md || null
  };

  console.info(`[${traceId}] [4. TO-SERVER] Final payload being sent to Python:`, JSON.stringify(finalPayload, null, 2));
  console.info(`[${traceId}] [4. TO-SERVER] Target URL: ${API_URL}${path}`);

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(finalPayload),
  });

  console.info(`[${traceId}] [5. SERVER-RESPONSE] Status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const text = await response.text();
    console.error(`[${traceId}] [5. SERVER-RESPONSE] Error response body:`, text);
    console.info(`========== MCP TOOL CALL FAILED [${traceId}] ==========\n`);
    throw new Error(`Eye request failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  console.info(`[${traceId}] [5. SERVER-RESPONSE] Success response:`, JSON.stringify(payload, null, 2));
  console.info(`========== MCP TOOL CALL SUCCESS [${traceId}] ==========\n`);

  if (path === "/eyes/overseer/navigator") {
    const sessionId = envelope.context?.session_id;
    if (sessionId) {
      launchPortal(sessionId, true);
      console.info(`[Third Eye MCP] Session established: ${sessionId}`);
    }
  }
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  };
}

export function buildEyes(server: McpServer) {
  // Reset connection ID for new server instance
  currentConnectionId = null;

  // Single entry point - The Third Eye Overseer
  server.tool(
    "third-eye/oversee",
    {
      description: "🧿 STRICT VALIDATION OVERSEER - Submit work for mandatory quality gates. Third Eye enforces standards and only approves work that meets all validation criteria. Incomplete submissions will be rejected.",
      inputSchema: {
        type: "object",
        properties: {
          context: {
            anyOf: [contextSchema, { type: "null" }],
            description: "Session context (auto-managed by MCP bridge)"
          },
          payload: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                description: "REQUIRED: Clear statement of what validation is needed. Be specific about the type of oversight required.",
                minLength: 5,
                pattern: "^.{5,}$",
                examples: [
                  "Validate this Python API implementation against best practices and security standards",
                  "Review this software architecture plan for scalability and maintainability issues",
                  "Fact-check this technical article for accuracy and verify all claims",
                  "Analyze these requirements for ambiguity and completeness before implementation"
                ]
              },
              work: {
                type: "object",
                description: "REQUIRED: The actual work product to be validated. Must contain substantive content for review.",
                properties: {
                  code: {
                    type: "string",
                    description: "Source code implementation to validate"
                  },
                  plan: {
                    type: "string",
                    description: "Architecture/design plan in markdown format"
                  },
                  draft: {
                    type: "string",
                    description: "Text content requiring fact-checking"
                  },
                  requirements: {
                    type: "string",
                    description: "Specifications needing clarification"
                  },
                  tests: {
                    type: "string",
                    description: "Test cases and coverage information"
                  },
                  docs: {
                    type: "string",
                    description: "Documentation to review"
                  }
                },
                minProperties: 1,
                additionalProperties: true
              },
              context_info: {
                type: "object",
                description: "REQUIRED: Project context and constraints that affect validation criteria",
                properties: {
                  project_type: { type: "string" },
                  language: { type: "string" },
                  target_audience: { type: "string" },
                  compliance_requirements: { type: "array", items: { type: "string" } },
                  performance_criteria: { type: "string" },
                  security_level: { type: "string", enum: ["low", "medium", "high", "critical"] }
                },
                minProperties: 1,
                additionalProperties: true
              }
            },
            required: ["intent", "work", "context_info"],
            additionalProperties: false,
          },
          reasoning_md: {
            type: "string",
            minLength: 10,
            description: "REQUIRED: Your detailed reasoning, design decisions, and justification for the submitted work. Third Eye demands accountability."
          },
        },
        required: ["payload", "reasoning_md"],
        additionalProperties: false,
      },
    },
    async (args) => callEye("/eyes/overseer/orchestrate", args as Record<string, unknown>),
  );

  // All individual eyes are now hidden behind the intelligent orchestrator
  // The Overseer decides which eyes to invoke based on LLM analysis
}
