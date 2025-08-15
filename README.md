<img src="https://assets.seitrace.com/seitrace-mcp.gif?v=10" width="1280"></img>

# Seitrace Insights MCP Server 🚀

A Model Context Protocol (MCP) server that exposes the Seitrace Insights API as model-friendly tools. It now advertises five focused tools that implement a resource-based interface so LLMs can discover resources, list actions, fetch schemas, invoke them, and generate code snippets. 

## Highlights ✨

What MCP provides to end users and assistants:

- Natural‑language access to Seitrace insights. The assistant performs API calls on your behalf.
- Self‑describing tool flow: enumerate actions, retrieve the input schema, then invoke.
- Input validation and clear error messages using per‑action JSON Schemas.
- Concise discovery: minimal list output; detailed payloads only when invoking actions.
- Integration with MCP‑enabled VS Code extensions (e.g., Continue, Cline).
- Simple, secure API key handling via environment variables (sent as `x-api-key`).
- Quick start via npx: `npx -y @seitrace/mcp`.
## Getting started

Make sure you obtain an API Key for free [here](https://seitrace.com/insights)

## Use with VSCode variants, Claude Desktop / Cursor 💻

See [mcp](./mcp/)

## Using with an MCP Client 🤝

Configure your MCP client to launch the compiled server binary:

- Command: `npx`
- Args:`["-y", "@seitrace/mcp"]`
- Env: `SECRET_APIKEY`, `API_BASE_URL` (optional) 

Once connected, the client will call `tools/list`, which returns exactly five tools representing the resource interface.

## Available tools 🧰

Primary entrypoint: five tools that form the resource-based interface:

- `list_resources` — list available resources
- `list_resource_actions` — list actions for a resource
- `get_resource_action_schema` — get the JSON Schema for an action
- `invoke_resource_action` — invoke an action with payload
- `get_resource_action_snippet` — generate a code snippet to perform a resource action in the specified language, for example, a javascript snippet to call the action with the required parameters

**Flow: list resources -> list actions for a resource -> get action schema -> invoke action or generate a code snippet.**

Common resources include:

- `insights_address` — address detail, transactions, and token transfers.
- `insights_erc20` — ERC‑20 token information, balances, transfers, and holders.
- `insights_erc721` — ERC‑721 token information, transfers, and holders.
- `insights_erc1155` — ERC‑1155 token information, instances, and holders.
- `insights_cw20` — CW20 token information, balances, transfers, and holders.
- `insights_cw721` — CW721 token information, transfers, and holders.
- `insights_ics20` — ICS‑20 (IBC fungible) transfer information.
- `insights_native` — native token information and statistics.
- `insights_smart_contract` — smart contract detail.

## Typical Flow 🔁

Using the MCP SDK, drive the resource-based flow via the five tools:

```js
// 1) Discover available resources
const resources = await client.callTool({ name: 'list_resouces', arguments: {} });
// -> { resources: ['erc20', 'erc721', 'native', ...] }

// 2) List actions for a resource
const actions = await client.callTool({ name: 'list_resouce_actions', arguments: { resource: 'insights_erc20' } });
// -> { resource: 'erc20', actions: [{ name, description }, ...] }

// 3) Get the JSON Schema for a specific action
const schema = await client.callTool({ name: 'get_resource_action_schema', arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info' } });
// -> { resource: 'erc20', action: 'get_erc20_token_info', schema }

// 4) Invoke the action with its payload
const res = await client.callTool({ name: 'invoke_resource_action', arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info', payload: { chain_id: 'pacific-1', contract_address: '0x...' } } });
// res.content[0].text -> "API Response (Status: 200):\n{ ... }"

// 5) Optionally, generate a code snippet for an action
const snippet = await client.callTool({ name: 'get_resource_action_snippet', arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info', language: 'node' } });
// -> { resource, action, language, snippet }
```

The server validates `payload` against the action’s schema and returns a pretty-printed JSON body when applicable.

## Requirements 🔧

- Node.js 20+
- A Seitrace Insights API key (optional for discovery, required for most live calls), obtain it [here](https://seitrace.com/insights?chain=pacific-1)

## Install 📦

```bash
npm install
```

## Configure 🔐

Copy `.env.example` to `.env` and set your values as needed.

Environment variables:

- `API_BASE_URL` (optional) — defaults to `https://seitrace.com/insights`
- `SECRET_APIKEY` — Seitrace API key; used to set header `x-api-key`

## Build and Run 🏃

```bash
# Type-check and compile to build/
npm run build

# Run the MCP server over stdio (used by MCP clients)
npm start
```

This server is designed to be launched by an MCP-compatible client (e.g., via a command/args configuration). It communicates over stdio.

## End-to-End Test ✅

Run the E2E to verify the root resource flow and (optionally) a live positive-call:

```bash
# Optionally provide your API key so the positive path runs
SEITRACE_API_KEY=your_key_here npm run test:e2e
```

## Troubleshooting 🛠️

- Validation errors: If `invokeResourceAction` returns “Invalid arguments…”, call `getResourceActionSchema` and ensure your `payload` follows the schema.
- Unknown action: You’ll get an error that includes the available actions. Use `listResourceActions` to discover the right name.
- 401/403 responses: Set `SECRET_APIKEY` with a valid Seitrace key.
- Network issues: Ensure `API_BASE_URL` is reachable from your environment.
- Node version: Use Node 20+ as required in `package.json`.

## Contributing 🤝

- Keep `tools/list` output compact. Do not embed per-action details there—fetch them via `getResourceActionSchema`.
- New endpoints should appear under the correct resource; root tool methods should provide discovery and invocation consistently.
- Prefer small, focused modules in `src/lib/` for shared logic.

## License 📄

See [LICENSE](./LICENSE)

## Support 📨

Please shoot emails to dev@cavies.xyz
