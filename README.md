<table width="100%">
  <tr>
    <td align="center" bgcolor="#0b1120" style="padding:42px 28px;border-radius:22px;border:1px solid #1e293b;">
      <h1 style="color:#7dd3fc;font-size:48px;margin-bottom:14px;">Third Eye MCP</h1>
      <p style="color:#c7d2fe;font-size:18px;margin:0 auto 24px;max-width:780px;line-height:1.6;">
        Local-first model context protocol server that grants AI agents inner perception—understanding intent, orchestrating multi-provider routing, and validating every deliverable before humans ever see it.
      </p>
      <p style="margin-bottom:0;">
        <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2563eb?style=for-the-badge" alt="MIT License"></a>
        <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-2dd4bf?style=for-the-badge" alt="TypeScript 5.9"></a>
        <a href="https://bun.sh/"><img src="https://img.shields.io/badge/Bun-1.0%2B-38bdf8?style=for-the-badge" alt="Bun 1.0+"></a>
        <!-- npm badge placeholder: add registry badge once published -->
      </p>
    </td>
  </tr>
</table>

<div align="center" style="margin:20px 0 36px;">
  <img src="docs/badges/coverage.svg" alt="Coverage badge" />
</div>

<h2 style="color:#38bdf8;margin-bottom:12px;">Navigation</h2>
<table width="100%" style="border-collapse:separate;border-spacing:14px;margin-bottom:28px;">
  <tr>
    <td valign="top" width="33%" style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:16px 18px;">
      <ul style="list-style:none;padding-left:0;margin:0;line-height:1.7;">
        <li><a href="#installation" style="color:#7dd3fc;">Installation</a></li>
        <li><a href="#overview" style="color:#a5b4fc;">Overview</a></li>
        <li><a href="#problem--vision" style="color:#38bdf8;">Problem &amp; Vision</a></li>
        <li><a href="#how-third-eye-mcp-works" style="color:#34d399;">How It Works</a></li>
        <li><a href="#guided-example" style="color:#fbbf24;">Guided Example</a></li>
        <li><a href="#eyes-at-a-glance" style="color:#f472b6;">Eyes at a Glance</a></li>
      </ul>
    </td>
    <td valign="top" width="33%" style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:16px 18px;">
      <ul style="list-style:none;padding-left:0;margin:0;line-height:1.7;">
        <li><a href="#architecture-highlights" style="color:#7dd3fc;">Architecture Highlights</a></li>
        <li><a href="#customization--extensibility" style="color:#a5b4fc;">Customization</a></li>
        <li><a href="#observability--quality-signals" style="color:#38bdf8;">Observability</a></li>
        <li><a href="#build-anything-playbooks" style="color:#34d399;">Playbooks</a></li>
        <li><a href="#quick-start" style="color:#fbbf24;">Quick Start</a></li>
        <li><a href="#cli-quick-start" style="color:#f472b6;">CLI Quick Start</a></li>
      </ul>
    </td>
    <td valign="top" width="34%" style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:16px 18px;">
      <ul style="list-style:none;padding-left:0;margin:0;line-height:1.7;">
        <li><a href="#client-integrations" style="color:#7dd3fc;">Client Integrations</a></li>
        <li><a href="#documentation-hub" style="color:#a5b4fc;">Documentation Hub</a></li>
        <li><a href="#monorepo-layout" style="color:#38bdf8;">Monorepo Layout</a></li>
        <li><a href="#development--testing" style="color:#34d399;">Development &amp; Testing</a></li>
        <li><a href="#support" style="color:#fbbf24;">Support</a></li>
        <li><a href="#team--gratitude" style="color:#f472b6;">Team &amp; Gratitude</a></li>
        <li><a href="#license" style="color:#7dd3fc;">License</a></li>
      </ul>
    </td>
  </tr>
</table>

---

## Installation

- **npm Registry** – _Add published package link here once available_
- **Zero-install sandbox** – `bunx third-eye-mcp up`
- **Global CLI** – `npm install -g third-eye-mcp` then `third-eye-mcp up`
- **From source** – clone this repository and follow [Quick Start](#quick-start)

---

## Overview

Third Eye MCP is a Bun-powered MCP server that orchestrates eight specialised "Eyes" across Groq, OpenRouter, Ollama, and LM Studio providers. It executes dynamic, two-phase validation for every agent interaction—guiding the agent before content is created and validating once the draft exists. The entire system is local-first: credentials, telemetry, and generated content stay on your machine while a rich dashboard reveals the agent's inner reasoning in real time.

### Why Developers Choose Third Eye

- **BYOK, forever local** – Bring your own API keys or run Ollama/LM Studio locally. Nothing leaves your machine, and you decide which Eyes can reach which providers.
- **Dynamic orchestration** – The Overseer Eye builds unique pipelines per task, blending guidance + validation with deterministic fallbacks so agents never stall.
- **Composable architecture** – Swap in custom Eyes, override personas per project, and stitch together bespoke workflows without touching core code.
- **Observable from day zero** – Dashboards, duel mode, and strict telemetry let you replay every session, compare models, and prove quality to stakeholders.
- **Production-ready ergonomics** – A single CLI handles service lifecycle, migrations, seeding, and release automation so teams can ship with confidence.

---

## Problem & Vision

<table width="100%" style="border-collapse:separate;border-spacing:18px;margin:12px 0 18px;">
  <tr>
    <td valign="top" style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:20px 22px;">
      <h3 style="color:#fbbf24;margin-top:0;">The Gap</h3>
      <p style="color:#e5e7eb;line-height:1.7;">
        AI agents routinely miss human intent. They start creating before requirements are clarified, misinterpret ambiguous prompts, and deliver unchecked claims or code. Traditional guardrails bolt on rigid rules or after-the-fact rejection, leaving humans to debug AI behaviour.
      </p>
    </td>
    <td valign="top" style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:20px 24px;">
      <h3 style="color:#34d399;margin-top:0;">The Third Eye Approach</h3>
      <p style="color:#c7d2fe;font-style:italic;border-left:3px solid #34d399;padding-left:14px;">
        "Give AI agents a third eye so they can see what humans really mean before they create, and verify the result after."
      </p>
      <ul style="color:#e5e7eb;line-height:1.7;padding-left:18px;">
        <li><strong style="color:#7dd3fc;">Invisible empowerment</strong> – Humans simply experience smarter conversations. Agents silently consult Third Eye for guidance and validation.</li>
        <li><strong style="color:#7dd3fc;">LLM intelligence over hardcoded rules</strong> – The Overseer LLM analyses each request and decides which Eyes to activate, building a bespoke pipeline on the fly.</li>
        <li><strong style="color:#7dd3fc;">Guidance + validation</strong> – Every session runs in two phases. Eyes first shape the work, then audit the deliverable so the agent can iterate with confidence.</li>
        <li><strong style="color:#7dd3fc;">Complete observability</strong> – Developers watch the dialogue between Eyes, agent, and human in a live dashboard, with structured telemetry and replayable sessions.</li>
      </ul>
    </td>
  </tr>
</table>

---

## How Third Eye MCP Works

<table width="100%" style="border-collapse:separate;border-spacing:14px;margin:12px 0 18px;">
  <tr>
    <td width="18%" align="center" style="background:#1e3a8a;color:#bfdbfe;font-weight:600;border-radius:14px;padding:18px 12px;">STEP&nbsp;01<br><span style="font-size:14px;color:#e0f2fe;">Overseer intelligence</span></td>
    <td style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:18px 22px;color:#e5e7eb;">
      Analyses every task, classifies request type (new, review, validation-only), recognises domains (code, text, plan, mixed), estimates complexity, and designs a bespoke pipeline.
    </td>
  </tr>
  <tr>
    <td align="center" style="background:#0f766e;color:#d1fae5;font-weight:600;border-radius:14px;padding:18px 12px;">STEP&nbsp;02<br><span style="font-size:14px;color:#bbf7d0;">Guidance Eyes</span></td>
    <td style="background:#042f2e;border:1px solid #134e4a;border-radius:14px;padding:18px 22px;color:#ccfbf1;">
      Sharingan, Prompt Helper, Jogan, and Rinnegan interrogate ambiguity, structure the brief, confirm intent, and stress-test plans before any content is produced.
    </td>
  </tr>
  <tr>
    <td align="center" style="background:#7c2d12;color:#fee2c3;font-weight:600;border-radius:14px;padding:18px 12px;">STEP&nbsp;03<br><span style="font-size:14px;color:#ffedd5;">Validation Eyes</span></td>
    <td style="background:#111827;border:1px solid #1f2937;border-radius:14px;padding:18px 22px;color:#e5e7eb;">
      Mangekyo, Tenseigan, and Byakugan review code, verify claims, and enforce acceptance criteria. Sharingan can return for a clarity pass to ensure the final draft stays sharp.
    </td>
  </tr>
  <tr>
    <td align="center" style="background:#1f2937;color:#cbd5f5;font-weight:600;border-radius:14px;padding:18px 12px;">STEP&nbsp;04<br><span style="font-size:14px;color:#e0e7ff;">AutoRouter</span></td>
    <td style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:18px 22px;color:#cbd5f5;">
      Manages provider failover across Groq, OpenRouter, and local runtimes, enforces persona versioning, and validates envelopes deterministically.
    </td>
  </tr>
  <tr>
    <td align="center" style="background:#312e81;color:#c7d2fe;font-weight:600;border-radius:14px;padding:18px 12px;">STEP&nbsp;05<br><span style="font-size:14px;color:#ede9fe;">Telemetry</span></td>
    <td style="background:#111827;border:1px solid #1f2937;border-radius:14px;padding:18px 22px;color:#d1d5db;">
      Emits rich WebSocket events (`eye_started`, `eye_complete`, `agent_message`, `session_status`) so the dashboard mirrors the agent's inner monologue in real time.
    </td>
  </tr>
</table>

---

## Guided Example

<table width="100%" style="border-collapse:separate;border-spacing:14px;margin:12px 0 18px;">
  <tr>
    <td colspan="2" style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:18px 24px;color:#e5e7eb;">
      Scenario: a user requests “Create a palm care report.” Third Eye MCP silently orchestrates the conversation and validation cycle.
    </td>
  </tr>
  <tr>
    <td width="18%" align="center" style="background:#1e3a8a;color:#bfdbfe;font-weight:600;border-radius:14px;padding:16px 12px;">Phase&nbsp;01</td>
    <td style="background:#0b1120;border:1px solid #1e293b;border-radius:14px;padding:16px 22px;color:#dbeafe;">
      <strong>Overseer</strong> tags the request as a complex new text task and selects the route: Sharingan → Prompt Helper → Jogan → Tenseigan → Byakugan.
    </td>
  </tr>
  <tr>
    <td align="center" style="background:#0f766e;color:#bbf7d0;font-weight:600;border-radius:14px;padding:16px 12px;">Phase&nbsp;02</td>
    <td style="background:#042f2e;border:1px solid #134e4a;border-radius:14px;padding:16px 22px;color:#ccfbf1;">
      <strong>Sharingan</strong> scores ambiguity at 75/100 and collects four clarifications (species, audience, length, region). The agent relays them to the human.
    </td>
  </tr>
  <tr>
    <td align="center" style="background:#1f2937;color:#e5e7eb;font-weight:600;border-radius:14px;padding:16px 12px;">Phase&nbsp;03</td>
    <td style="background:#111827;border:1px solid #1f2937;border-radius:14px;padding:16px 22px;color:#e5e7eb;">
      <strong>Prompt Helper</strong> converts the answers into a production brief (500-word beginner guide, Saudi indoor palms, watering schedule, light requirements). <strong>Jogan</strong> confirms the intent with the user.
    </td>
  </tr>
  <tr>
    <td align="center" style="background:#7c2d12;color:#fed7aa;font-weight:600;border-radius:14px;padding:16px 12px;">Phase&nbsp;04</td>
    <td style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:16px 22px;color:#f1f5f9;">
      The agent drafts the guide using the structured criteria. <strong>Tenseigan</strong> validates factual claims and <strong>Byakugan</strong> performs the final holistic assessment with actionable feedback.
    </td>
  </tr>
  <tr>
    <td align="center" style="background:#312e81;color:#c7d2fe;font-weight:600;border-radius:14px;padding:16px 12px;">Phase&nbsp;05</td>
    <td style="background:#111827;border:1px solid #1f2937;border-radius:14px;padding:16px 22px;color:#d1d5db;">
      The dashboard streams colour-coded log entries for every Eye, so developers can replay the reasoning trail, export evidence, and reuse the pipeline.
    </td>
  </tr>
</table>

The human simply experiences a thoughtful agent that asked smart questions and delivered an accurate report on the first try.

---

## Eyes at a Glance

<table width="100%" style="border-collapse:separate;border-spacing:0;margin:16px 0;">
  <tr style="background:#1e3a8a;color:#e0f2fe;">
    <th style="padding:12px 16px;text-align:left;border-top-left-radius:12px;">Eye</th>
    <th style="padding:12px 16px;text-align:left;">Core Focus</th>
    <th style="padding:12px 16px;text-align:left;">Guidance Phase</th>
    <th style="padding:12px 16px;text-align:left;border-top-right-radius:12px;">Validation Phase</th>
  </tr>
  <tr style="background:#0f172a;color:#e5e7eb;">
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Overseer</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Intelligent routing</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Analyses task type, domain, complexity, and selects optimal Eye sequence</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">N/A – orchestration happens upfront</td>
  </tr>
  <tr style="background:#111827;color:#e5e7eb;">
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Sharingan</td>
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Clarity detection</td>
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Scores ambiguity, surfaces missing context, generates clarifying questions</td>
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Rechecks drafts for vague language, undefined references, or fuzzy requirements</td>
  </tr>
  <tr style="background:#0f172a;color:#e5e7eb;">
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Prompt Helper</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Structured briefing</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Converts clarified inputs into format, length, key elements, and quality criteria</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Ensures final output aligns with the agreed structure and constraints</td>
  </tr>
  <tr style="background:#111827;color:#e5e7eb;">
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Jogan</td>
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Intent confirmation</td>
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Classifies desired outcome (create, transform, plan) and ensures stakeholder alignment</td>
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Confirms the deliverable fulfils the stated intent and scope</td>
  </tr>
  <tr style="background:#0f172a;color:#e5e7eb;">
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Rinnegan</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Plan resilience</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Stress-tests architectures and plans against risks, dependencies, and sequencing</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Audits proposed plans for completeness and feasibility</td>
  </tr>
  <tr style="background:#111827;color:#e5e7eb;">
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Mangekyo</td>
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Code review</td>
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Guides agents on implementation strategies, edge cases, and test scaffolding</td>
    <td style="padding:12px 16px;border-top:1px solid #1f2937;">Performs deep code review with static analysis cues and actionable fixes</td>
  </tr>
  <tr style="background:#0f172a;color:#e5e7eb;">
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Tenseigan</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Fact verification</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Prepares fact-check criteria and source expectations</td>
    <td style="padding:12px 16px;border-top:1px solid #1e293b;">Validates claims, citations, and data integrity</td>
  </tr>
  <tr style="background:#111827;color:#e5e7eb;">
    <td style="padding:12px 16px;border:1px solid #1f2937;border-bottom-left-radius:12px;">Byakugan</td>
    <td style="padding:12px 16px;border:1px solid #1f2937;">Final assurance</td>
    <td style="padding:12px 16px;border:1px solid #1f2937;">Defines acceptance thresholds and holistic success metrics</td>
    <td style="padding:12px 16px;border:1px solid #1f2937;border-bottom-right-radius:12px;">Aggregates Eye feedback into one approval verdict with go/no-go reasoning</td>
  </tr>
</table>

Each Eye responds with machine-parsable data plus a human-friendly <code>ui</code> payload (title, summary, details, colour) so telemetry stays legible for your teammates.

---

## Architecture Highlights

- **Local-first deployment** – Runs entirely on your machine with Bun; SQLite state stored at `~/.third-eye-mcp/mcp.db`.
- **Provider abstraction** – Integrates Groq, OpenRouter, Ollama, and LM Studio with per-Eye routing, quota awareness, and automatic fallbacks.
- **Persona versioning** – Every Eye persona is versioned and validated against strict schemas to prevent prompt drift.
- **Strict envelopes** – Responses are validated at runtime to guarantee `ok`, `code`, `data`, and `ui` contracts across Eyes.
- **Dashboard + playground** – Next.js UI offers monitor view, duel mode for model comparisons, and playground forms for Overseer pipelines or single-Eye tests.
- **Model duel mode** – Compare up to four model/provider combos with latency, usage, and verdict telemetry to inform routing decisions.

---

## Customization & Extensibility

<table width="100%" style="border-collapse:separate;border-spacing:16px;margin:12px 0 18px;">
  <tr>
    <td valign="top" style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:18px 20px;color:#e5e7eb;">
      <h4 style="color:#7dd3fc;margin-top:0;">Custom Eyes &amp; Personas</h4>
      Persist bespoke Eyes in <code>eyes_custom</code>, version their personas, and route them alongside the built-ins—perfect for industry-specific QA or house style checkers.
    </td>
    <td valign="top" style="background:#042f2e;border:1px solid #134e4a;border-radius:16px;padding:18px 20px;color:#ccfbf1;">
      <h4 style="color:#34d399;margin-top:0;">Pipeline Designer</h4>
      Store reusable flows in <code>pipelines_custom</code> or inject <code>customSteps</code> on demand. Build domain playbooks without touching core orchestrator code.
    </td>
    <td valign="top" style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:18px 20px;color:#e5e7eb;">
      <h4 style="color:#a5b4fc;margin-top:0;">Persona Versioning</h4>
      Ship alternative playbooks per customer or environment; strict envelope validation keeps responses schema-safe even as prompts evolve.
    </td>
  </tr>
  <tr>
    <td valign="top" style="background:#1e3a8a;border:1px solid #1e40af;border-radius:16px;padding:18px 20px;color:#dbeafe;">
      <h4 style="color:#c7d2fe;margin-top:0;">Strictness Profiles</h4>
      Tune 0–100 thresholds for clarity, factuality, latency, and safety. Bundle presets like <code>enterprise</code>, <code>security</code>, or any custom guardrail mix.
    </td>
    <td valign="top" style="background:#7c2d12;border:1px solid #9a3412;border-radius:16px;padding:18px 20px;color:#ffedd5;">
      <h4 style="color:#fed7aa;margin-top:0;">Provider Mix &amp; Fallbacks</h4>
      Map Eyes to Groq/OpenRouter/Ollama/LM Studio with weighted priorities, quotas, and offline-first fallbacks. Your infrastructure, your rules.
    </td>
    <td valign="top" style="background:#312e81;border:1px solid #3730a3;border-radius:16px;padding:18px 20px;color:#ede9fe;">
      <h4 style="color:#c4b5fd;margin-top:0;">Session Intelligence</h4>
      Deterministic IDs plus full telemetry make it easy to replay pipelines, export evidence, and integrate with external dashboards or ticketing systems.
    </td>
  </tr>
  <tr>
    <td colspan="3" style="background:#0b1120;border:1px solid #1e293b;border-radius:16px;padding:18px 22px;color:#e5e7eb;">
      <strong style="color:#7dd3fc;">Config-first philosophy</strong> – Everything lives in user-editable JSON, seeds, or the dashboard. Fork the repo only when you want to invent new capabilities, not to tweak behaviour.
    </td>
  </tr>
</table>

---

## Observability & Quality Signals

- **WebSocket events** – Fine-grained telemetry (`eye_started`, `eye_analyzing`, `eye_complete`, `agent_message`, `session_status`, `pipeline_event`) keeps the dashboard and monitor perfectly in sync.
- **Conversation log** – Chat-style timeline with colour-coded speakers, collapsible technical details, and replayable history for audits.
- **Automated testing** – Vitest coverage suites (`pnpm test:coverage`) plus Playwright E2E flows (`pnpm test:e2e`) guard MCP tool discovery, strictness propagation, duel scoring, and UI smoke paths.
- **Manual validation** – Playground, duel mode, and monitor exercises confirm session synchronisation, persona alignment, provider overrides, and graceful error surfacing.

---

## Build-Anything Playbooks

<table width="100%" style="border-collapse:separate;border-spacing:16px;margin:12px 0 6px;">
  <tr>
    <td valign="top" style="background:#1e3a8a;border:1px solid #1d4ed8;border-radius:16px;padding:18px 22px;color:#dbeafe;">
      <h4 style="color:#c7d2fe;margin-top:0;">Agent Copilots with Taste</h4>
      Bolt Third Eye onto existing agents to add clarifying questions, domain personas, and final QA before responses reach end users.
    </td>
    <td valign="top" style="background:#0f766e;border:1px solid #0d9488;border-radius:16px;padding:18px 22px;color:#d1fae5;">
      <h4 style="color:#bbf7d0;margin-top:0;">Enterprise Reviewer Desks</h4>
      Combine custom Eyes with policy checklists for finance, legal, security, or compliance—emit audit-ready transcripts every time.
    </td>
  </tr>
  <tr>
    <td valign="top" style="background:#7c2d12;border:1px solid #9a3412;border-radius:16px;padding:18px 22px;color:#ffedd5;">
      <h4 style="color:#fed7aa;margin-top:0;">Productivity Suites</h4>
      Embed MCP routing inside internal portals so teams get curated model access, duel comparisons, and governance without juggling provider dashboards.
    </td>
    <td valign="top" style="background:#312e81;border:1px solid #3730a3;border-radius:16px;padding:18px 22px;color:#ede9fe;">
      <h4 style="color:#c4b5fd;margin-top:0;">Learning &amp; Research Labs</h4>
      Mix local open-weight models with premium APIs, iterate in duel mode, and spawn new Eyes as research assistants or QA partners.
    </td>
  </tr>
  <tr>
    <td colspan="2" style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:18px 22px;color:#e5e7eb;">
      <strong style="color:#7dd3fc;">Future Experiments</strong> – With pluggable Eyes, pipelines, providers, and dashboards, you can prototype entirely new validation philosophies (safety, bias, regional compliance). The roadmap is intentionally open-ended—any workflow that benefits from guidance before work and validation after fits inside Third Eye MCP.
    </td>
  </tr>
</table>

---

## Quick Start

> **Requirement:** Install Bun 1.0+ (`bun --version`).

```bash
# Launch without installing globally
bunx third-eye-mcp up

# MCP stdio endpoint → stdio (spawned process)
# Local HTTP dashboard → http://127.0.0.1:3300
# MCP HTTP bridge (optional) → http://127.0.0.1:7070/mcp
```

First launch will:
- Seed SQLite database at `~/.third-eye-mcp/mcp.db`
- Activate all eight Eyes with default personas and strictness profiles
- Start the Next.js dashboard with live telemetry, duel mode, and playground
- Prepare intelligent routing tables, provider fallbacks, and persona metadata

Need the CLI on your PATH? Install globally after Bun is available:

```bash
npm install -g third-eye-mcp       # or pnpm add -g / bun add -g
third-eye-mcp up
```

---

## CLI Quick Start

The Third Eye CLI ships with the package (usable via `bunx third-eye-mcp …` or the globally installed `third-eye-mcp`). Commands run the same regardless of whether you invoke them through Bunx or a global install.

- **Launch the orchestrator**
  ```bash
  bunx third-eye-mcp up              # Starts MCP server + dashboard in the background
  bunx third-eye-mcp up --foreground # Keep processes attached (ideal for dev shells)
  bunx third-eye-mcp up --no-ui      # Run only the stdio server, skip the dashboard
  ```
  Use `--port` / `--ui-port` to override the default `7070` / `3300` bindings. API keys for Groq/OpenRouter are supplied via the environment (BYOK); local Ollama/LM Studio work out-of-the-box.

- **Inspect and manage background services**
  ```bash
  third-eye-mcp status               # Show running processes, ports, and strictness profile
  third-eye-mcp logs --tail          # Stream combined MCP + dashboard logs
  third-eye-mcp stop                 # Stop all tracked services
  third-eye-mcp restart              # Stop + start in one step
  ```

- **Development utilities**
  ```bash
  third-eye-mcp server               # Run stdio-only server for MCP clients
  third-eye-mcp db open              # Launch SQLite inspector on ~/.third-eye-mcp/mcp.db
  third-eye-mcp reset                # Wipe local state (confirm before proceeding)
  ```

- **Release helpers (maintainers)**
  ```bash
  third-eye-mcp release              # Interactive version + changelog assistant
  third-eye-mcp release:ship         # Automated clean → gate → publish pipeline
  ```

See [`docs/cli.md`](docs/cli.md) for the full command matrix, environment overrides, and troubleshooting guidance.

---

## Client Integrations

Third Eye MCP speaks standard MCP stdio. The dashboard exposes an optional HTTP bridge at `http://127.0.0.1:7070/mcp` for clients that prefer HTTP transport. Use the guides below to connect from popular tools.

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

Pasting the following configuration into your Cursor `~/.cursor/mcp.json` file is the recommended approach. You may also install in a specific project by creating `.cursor/mcp.json` in your project folder. See [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol) for more info.

> Since Cursor 1.0, you can click the install button below for instant one-click installation.

#### Cursor Remote Server Connection

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=third-eye-mcp&config=eyJjb21tYW5kIjoiYnVueCIsImFyZ3MiOlsidGhpcmQtZXllLW1jcCIsInNlcnZlciJdfQ%3D%3D)

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

#### Cursor Local Server Connection

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=third-eye-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsInRoaXJkLWV5ZS1tY3AiLCJzZXJ2ZXIiXX0%3D)

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command. See [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp) for more info.

#### Claude Code Bunx Launch

```sh
claude mcp add third-eye-mcp -- bunx third-eye-mcp server
```

#### Claude Code npx Alternative

```sh
claude mcp add third-eye-mcp -- npx -y third-eye-mcp server
```

</details>

<details>
<summary><b>Install in Amp</b></summary>

Run this command in your terminal. See [Amp MCP docs](https://ampcode.com/manual#mcp) for more info.

#### Bunx (Recommended)

```sh
amp mcp add third-eye-mcp bunx third-eye-mcp server
```

#### npx Alternative

```sh
amp mcp add third-eye-mcp npx -y third-eye-mcp server
```

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file. See [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp) for more info.

#### Windsurf Bunx Launch

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

#### Windsurf Local Server Connection

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

Prefer `npx`? Swap the command accordingly.

</details>

<details>
<summary><b>Install in VS Code</b></summary>

[<img alt="Install in VS Code (npx)" src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20Third%20Eye%20MCP&color=0098FF">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22third-eye-mcp%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22third-eye-mcp%22%2C%22server%22%5D%7D)
[<img alt="Install in VS Code Insiders (npx)" src="https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Install%20Third%20Eye%20MCP&color=24bfa5">](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%7B%22name%22%3A%22third-eye-mcp%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22third-eye-mcp%22%2C%22server%22%5D%7D)

Add this to your VS Code MCP config file. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

#### VS Code Bunx Launch

```json
"mcp": {
  "servers": {
    "third-eye-mcp": {
      "type": "stdio",
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

#### VS Code Local Server Connection

```json
"mcp": {
  "servers": {
    "third-eye-mcp": {
      "type": "stdio",
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

</details>

<details>
<summary>
<b>Install in Cline</b>
</summary>

You can easily install Third Eye MCP through the [Cline MCP Server Marketplace](https://cline.bot/mcp-marketplace) by following these instructions:

1. Open **Cline**.
2. Click the hamburger menu icon (☰) to enter the **MCP Servers** section.
3. Use the search bar within the **Marketplace** tab to find _Third Eye MCP_.
4. Click the **Install** button.

Or you can directly edit MCP servers configuration:

1. Open **Cline**.
2. Click the hamburger menu icon (☰) to enter the **MCP Servers** section.
3. Choose **Remote Servers** tab.
4. Click the **Edit Configuration** button.
5. Add third-eye-mcp to `mcpServers`:

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"],
      "type": "stdio"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zed</b></summary>

It can be installed via [Zed Extensions](https://zed.dev/extensions?query=Third%20Eye%20MCP) or you can add this to your Zed `settings.json`. See [Zed Context Server docs](https://zed.dev/docs/assistant/context-servers) for more info.

```json
{
  "context_servers": {
    "Third Eye MCP": {
      "source": "custom",
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Augment Code</b></summary>

To configure Third Eye MCP in Augment Code, you can use either the graphical interface or manual configuration.

### **A. Using the Augment Code UI**

1. Click the hamburger menu.
2. Select **Settings**.
3. Navigate to the **Tools** section.
4. Click the **+ Add MCP** button.
5. Enter the following command:

   ```
   bunx third-eye-mcp server
   ```

6. Name the MCP: **Third Eye MCP**.
7. Click the **Add** button.

Once the MCP server is added, you can start using Third Eye MCP's orchestration features directly within Augment Code.

---

### **B. Manual Configuration**

1. Press Cmd/Ctrl Shift P or go to the hamburger menu in the Augment panel
2. Select Edit Settings
3. Under Advanced, click Edit in settings.json
4. Add the server configuration to the `mcpServers` array in the `augment.advanced` object

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "third-eye-mcp",
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  ]
}
```

Once the MCP server is added, restart your editor. If you receive any errors, check the syntax to make sure closing brackets or commas are not missing.

</details>

<details>
<summary><b>Install in Roo Code</b></summary>

Add this to your Roo Code MCP configuration file. See [Roo Code MCP docs](https://docs.roocode.com/features/mcp/using-mcp-in-roo) for more info.

#### Roo Code Bunx Launch

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "type": "stdio",
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Gemini CLI</b></summary>

See [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html) for details.

1.  Open the Gemini CLI settings file. The location is `~/.gemini/settings.json` (where `~` is your home directory).
2.  Add the following to the `mcpServers` object in your `settings.json` file:

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

Or, if you prefer `npx`:

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

If the `mcpServers` object does not exist, create it.

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

#### Bunx Server Connection

Open Claude Desktop and navigate to Settings > Connectors > Add Custom Connector. Choose the **Command** option and configure it to launch `bunx third-eye-mcp server`.

Or edit your `claude_desktop_config.json` file directly. See [Claude Desktop MCP docs](https://modelcontextprotocol.io/quickstart/user) for more info.

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Opencode</b></summary>

Add this to your Opencode configuration file. See [Opencode MCP docs](https://opencode.ai/docs/mcp-servers) for more info.

#### Opencode Bunx Launch

```json
{
  "mcp": {
    "third-eye-mcp": {
      "type": "local",
      "command": ["bunx", "third-eye-mcp", "server"],
      "enabled": true
    }
  }
}
```

</details>

<details>
<summary><b>Install in OpenAI Codex</b></summary>

See [OpenAI Codex](https://github.com/openai/codex) for more information.

Add the following configuration to your OpenAI Codex MCP server settings:

```toml
[mcp_servers.third-eye-mcp]
command = "bunx"
args = ["third-eye-mcp", "server"]
```

Prefer to stay in the Node toolchain? Swap to `npx`:

```toml
[mcp_servers.third-eye-mcp]
command = "npx"
args = ["-y", "third-eye-mcp", "server"]
```

⚠️ Windows Notes (for `npx` users)

If the default `npx` invocation times out on Windows, target the Node binary directly:

```toml
[mcp_servers.third-eye-mcp]
command = "C:\\Program Files\\nodejs\\node.exe"
args = [
  "C:\\Users\\yourname\\AppData\\Roaming\\npm\\node_modules\\third-eye-mcp\\dist\\index.js",
  "server"
]
```

Or wrap `npx` via `cmd`:

```toml
[mcp_servers.third-eye-mcp]
command = "cmd"
args = [
    "/c",
    "npx",
    "-y",
    "third-eye-mcp",
    "server"
]
env = { SystemRoot="C:\\Windows" }
startup_timeout_ms = 20_000
```

⚠️ macOS Notes (for `npx` users)

If you see timeouts on macOS with `npx`, point directly to Node:

```toml
[mcp_servers.third-eye-mcp]
command = "/Users/yourname/.nvm/versions/node/v22.14.0/bin/node"  # Node.js full path
args = ["/Users/yourname/.nvm/versions/node/v22.14.0/lib/node_modules/third-eye-mcp/dist/index.js",
  "server"
]
```

</details>

<details>
<summary><b>Install in JetBrains AI Assistant</b></summary>

See [JetBrains AI Assistant Documentation](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) for more details.

1. In JetBrains IDEs, go to `Settings` -> `Tools` -> `AI Assistant` -> `Model Context Protocol (MCP)`
2. Click `+ Add`.
3. Click on `Command` in the top-left corner of the dialog and select the As JSON option from the list
4. Add this configuration and click `OK`

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

Prefer `npx`? Swap the command to `npx` and add `"-y"` as the first argument.

5. Click `Apply` to save changes.
6. The same way Third Eye MCP could be added for JetBrains Junie in `Settings` -> `Tools` -> `Junie` -> `MCP Settings`

</details>

<details>
  
<summary><b>Install in Kiro</b></summary>

See [Kiro Model Context Protocol Documentation](https://kiro.dev/docs/mcp/configuration/) for details.

1. Navigate `Kiro` > `MCP Servers`
2. Add a new MCP server by clicking the `+ Add` button.
3. Paste the configuration given below:

```json
{
  "mcpServers": {
    "Third Eye": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Prefer `npx`? Switch the command to `npx` and add `"-y"` as the first argument in the array.

4. Click `Save` to apply the changes.

</details>

<details>
<summary><b>Install in Trae</b></summary>

Use the Add manually feature and fill in the JSON configuration information for that MCP server.
For more details, visit the [Trae documentation](https://docs.trae.ai/ide/model-context-protocol?_lang=en).

#### Trae Bunx Launch

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

</details>

<details>
<summary><b>Using Bun or Deno</b></summary>

Use these alternatives to run the local Third Eye MCP server with other runtimes. These examples work for any client that supports launching a local MCP server via command + args.

#### Bun

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "bunx",
      "args": ["third-eye-mcp", "server"]
    }
  }
}
```

#### Deno

```json
{
  "mcpServers": {
    "third-eye-mcp": {
      "command": "deno",
      "args": [
        "run",
        "--allow-env=GROQ_API_KEY,OPENROUTER_API_KEY",
        "--allow-net",
        "npm:third-eye-mcp",
        "server"
      ]
    }
  }
}
```

</details>

---

## Documentation Hub

| Topic | Docs |
| ----- | ---- |
| Getting started | [docs/getting-started.md](docs/getting-started.md) – prerequisites, installation, first run checklist |
| Daily operations | [docs/usage.md](docs/usage.md) – connecting agents, workflows, troubleshooting |
| CLI reference | [docs/cli.md](docs/cli.md) – commands, options, background process model |
| Configuration | [docs/configuration.md](docs/configuration.md) – env vars, strictness profiles, security |
| Providers | [docs/PROVIDERS.md](docs/PROVIDERS.md) – Groq/OpenRouter/Ollama/LM Studio setup |
| API surface | [docs/API_REFERENCE.md](docs/API_REFERENCE.md) & [docs/MCP_API.md](docs/MCP_API.md) |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – system design & components |
| Database | [docs/DATABASE.md](docs/DATABASE.md) – schema diagrams, migrations, backups |
| Integrations | [docs/integrations/README.md](docs/integrations/README.md) – Claude, Cursor, Cline, Warp, Continue.dev |
| Workflows | [docs/workflows/README.md](docs/workflows/README.md) – reusable pipeline templates |
| Publishing | [docs/publishing.md](docs/publishing.md) – release workflow & npm publishing checklist |
| Troubleshooting | [docs/FAQ.md](docs/FAQ.md) – quick fixes & FAQs |

---

## Monorepo Layout

```
apps/            Next.js dashboard + Bun server entrypoints
packages/        Core orchestrator, providers, database, utilities
cli/             TypeScript CLI source (bundled via Bun)
dist/            Bundled CLI executables (generated)
docs/            Documentation hub (this README links here)
scripts/         Operational scripts (setup, seed, health checks)
__tests__/       Unit and E2E test suites
examples/        Sample configs and scenario playbooks
```

---

## Development & Testing

```bash
bun install                # install workspace dependencies
bun run build              # build packages, server, UI, CLI (release pipeline)

pnpm lint                  # type-check the monorepo
pnpm test:coverage         # Vitest with coverage instrumentation
pnpm test:e2e              # Playwright end-to-end tests

third-eye-mcp reset        # wipe ~/.third-eye-mcp (destructive)
third-eye-mcp logs --tail  # follow combined logs
```

Key scripts:
- `bun run health:full` – comprehensive diagnostics
- `bun run ws:check` – WebSocket reconnect simulation
- `bun run scripts/seed-database.ts` – reseed personas and routing tables

---

## Support

- Dashboard: [http://127.0.0.1:3300](http://127.0.0.1:3300)
- MCP HTTP bridge: [http://127.0.0.1:7070/mcp](http://127.0.0.1:7070/mcp)
- Health check: `bun run health:full`
- Logs: `third-eye-mcp logs --tail`
- Issues & features: [github.com/HishamBS/third-eye-mcp/issues](https://github.com/HishamBS/third-eye-mcp/issues)

---

## Team & Gratitude

We built Third Eye MCP as part of the Tuwaiq Academy Machine Learning Bootcamp, and we are grateful for the mentorship and community that made it possible.

- **Core Team**
  - [Maymonah](https://github.com/iMaymoonah)
  - [Ziyad](https://github.com/ZiyadALharbi)
  - [Hisham](https://github.com/HishamBS)
- **Instructors & Mentors**
  - [Rakan](https://github.com/RakanTuwaiqHub)
  - [Mohammed](https://github.com/mdsri)
- **Special thanks** to Tuwaiq Academy for their unwavering support, resources, and vision in empowering Saudi talent to push the boundaries of AI orchestration.

---

## License

Released under the [MIT License](LICENSE).

Commercial support or enterprise features? Open an issue or start a discussion—community contributions are always welcome.
