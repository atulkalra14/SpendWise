# Agent readiness (Joule and AI agents)

Goal: design every service so that AI agents, for example SAP Joule, can use it later without a rewrite. Nothing agentic is built or installed now. Read before writing a spec that adds or changes an action or service. `CLAUDE.md` holds the summary; this file holds the rules and the adoption path.

Status markers: **[verified]** = checked against capire; **[verify at adoption]** = not yet confirmed, check when the first agent feature is planned; **[convention]** = our own choice.

## What CAP offers [verified]

Source: capire "Native AI" guides.

- The `@cap-js/mcp` plugin exposes a CAP service through the Model Context Protocol (MCP). Annotating a service with `@mcp` creates one MCP server for it, with three generic tools: `describe` (service metadata), `query` (read an entity) and `call` (run an action).
- To CAP, MCP is just another protocol next to OData and REST. The existing service definitions are reused; nothing is duplicated.
- The tools are meant for AI agents and are not a stable API. The stable API stays OData (or REST).
- CAP services can also be turned into custom agents, which other agents call through the Agent-to-Agent (A2A) protocol (capire's XTravels sample).
- Integration with SAP Joule Work and Joule Studio is described in capire's Joule guide, which is marked "Under Construction". Treat Joule details as **[verify at adoption]**.
- `@cap-js/mcp` is a runtime plugin of the application. It is not the `@cap-js/mcp-server` that we use in `.mcp.json` for development help; do not confuse the two.

## Rules that apply now

These cost almost nothing and make the later step small.

1. **Name actions after business intent.** `approveOrder`, `cancelBooking`, not `updateStatus`. An agent chooses a tool by its name and description, so the name must say what happens in business terms.
2. **Describe every action in English.** The doc comment required by `docs/code-comments.md` states what the action does, its inputs, its effect and when not to use it. Agents read it as the tool description. **[verify at adoption]** that the `describe` tool serves doc comments.
3. **Keep agent-facing services separate.** One service per use case and user group (`docs/code-organisation.md`). If an agent needs access, it gets its own narrow service (`srv/<context>-agent-service.cds`) with projections that expose only the fields and actions needed. Never point an agent at an admin service. **[convention]**
4. **Authorization is never relaxed for agents.** Every action and entity keeps `@requires` / `@restrict`. An agent acts as the signed-in user or as a technical user with the smallest role set. No privileged contexts, no tenant bypass. An ADR decides which identity an agent uses, before the first agent feature.
5. **A human confirms risky actions.** An action that is hard to reverse (approve, release, delete, send, pay) is modelled in two steps, propose then confirm, or runs on a draft. An agent never completes it in one call. **[convention]**
6. **Make actions safe to repeat.** An agent may retry. An action called twice with the same input gives the same result, or rejects the second call with a clear message key (`409`). **[convention]**
7. **Validate and answer clearly.** Validate inputs declaratively (`@mandatory`, `@assert.*`) as in `docs/conventions.md`. Errors are message keys with `target`, so an agent can tell what to fix. Return small, typed results, not free text.
8. **Expose the minimum data.** No personal data, secrets or internal fields in an agent-facing projection without an ADR that says why.
9. **Make agent calls traceable.** Log the action name, the entity ID and the tenant ID, never content (`docs/conventions.md`). A later ADR decides how to mark a call as agent-initiated. **[verify at adoption]**
10. **SAP API Policy.** `@mcp` is only for our own custom application services. Never annotate a service that proxies or re-exposes SAP application APIs (for example an S/4HANA consumption view in `srv/external/`), because the SAP API Policy does not allow that route. **[verified]** Read the policy section in the capire guide before any exception.

## Adoption path (later, not now)

Each step needs the previous one, and the first needs an ADR.

1. **ADR**: which use cases, which identity the agent uses, which services are exposed, what a human must confirm, and what it would add or duplicate (`Tooling` in `CLAUDE.md`).
2. **Pilot**: add the `@cap-js/mcp` plugin and annotate one narrow, read-only agent service with `@mcp`. Test `describe`, `query` and `call` with the auth matrix and a tenant-isolation test.
3. **Write actions**: add actions behind the confirm step (rule 5), with tests for authorization, idempotency and message keys.
4. **Joule**: connect the MCP service to Joule Work or Joule Studio. **[verify at adoption]** Joule Studio custom agents with MCP and A2A support were announced by SAP in late 2025 (see the SAP news item below). Confirm current availability and the exact setup in SAP's release notes and capire's Joule guide.
5. **Custom agents**: only if the generic agent is not enough, build a CAP-level agent that other agents call through A2A. SAP's reference architecture describes low-code agents in Joule Studio and pro-code agents using the SAP Cloud SDK for AI. **[verify at adoption]**

## Tests to add when an agent service exists

- Auth matrix on the agent service: each role x each tool, including denied cases.
- Cross-tenant isolation through the MCP tools.
- Confirm step cannot be skipped; repeated calls are safe.
- Message keys and `target` for every validation failure.

## Sources

- capire: Native AI, MCP Adapter, XTravels sample, Integration to Joule (https://cap.cloud.sap/docs/guides/ai/)
- SAP News: new agentic capabilities in SAP BTP (https://news.sap.com/2025/11/new-agentic-capabilities-sap-btp-supercharge-developers/)
- SAP Architecture Center: Integrating AI Agents with Joule (https://architecture.learning.sap.com/docs/ref-arch/ae6821)
