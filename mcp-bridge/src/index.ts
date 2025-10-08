import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildEyes } from "./eyes.js";
import { getDynamicInstructions } from "./dynamic-instructions.js";

const server = new McpServer(
  { name: "third-eye-mcp", version: "1.0.0" },
  {
    capabilities: { tools: {} },
    instructions: getDynamicInstructions(),
  }
);

buildEyes(server);
const transport = new StdioServerTransport();
server.connect(transport);
