<img src="https://assets.seitrace.com/seitrace-mcp.gif?v=10" width="1280"></img>

# Seitrace MCP

The essential MCP (Model Context Protocol) server for the Sei blockchain.

## Available tools 🧰

**Five tools that form the resource-based interface (use in order 1→2→3→4):**

- `list_resources` — list available resources (start here)
- `list_resource_actions` — list actions for a resource  
- `get_resource_action_schema` — **REQUIRED** get the JSON Schema for an action before invoking
- `invoke_resource_action` — invoke an action with payload matching the schema
- `get_resource_action_snippet` — (optional) generate a code snippet to perform a resource action in the specified language

**Supported resources**

**General**

- `general_faucet` - enable requesting faucet for developers
- `general_rpc_lcd` - enable general rpc/lcd inquiries for the agents, and execute the rpc/lcd requests based on the demands
- `general_associations` — query hybrid associations (EOA/assets/txs) across EVM and native Sei. Returns simplified pointer/pointee fields when applicable.

**Insights**

- `insights_address` — Query address data: details, transactions, token transfers.
- `insights_erc20` — Query ERC-20 tokens: info, balances, transfers, holders.
- `insights_cw20` — Query CW20 tokens: info, balances, transfers, holders.
- `insights_native` — Query native tokens: info, transfers, balances, holders.
- `insights_ics20` — Query ICS20 tokens: info, transfers, balances, holders.
- `insights_erc721` — Query ERC-721 tokens: info, holders, instances, balances, transfers.
- `insights_erc1155` — Query ERC-1155 tokens: info, holders, instances, balances, transfers.
- `insights_cw721` — Query CW721 tokens: info, instances, balances, holders, transfers.
- `insights_smart_contract` — Query smart contract details.
- `insights_assets` — Search official assets by name/symbol/identifier and get asset details by identifier. Uses Sei gateway endpoints; search is performed offline over the fetched assets list.
- `insights_earnings` — Search/list earnings pools (APR/APY) for pacific-1 and fetch a pool by address. Returns simplified fields: name, address, url, image, provider, tvl, apr, apy.

**Smart Contract**

- `smart_contract` — Query smart contract state via Multicall3, search verified contracts, or download smart contract ABI from Seitrace (pacific-1, atlantic-2, arctic-1).

## Getting started

Make sure you obtain an API Key for free [here](https://seitrace.com/insights)

## Use with general AI Models (streamablehttp, sse)

Make sure you are using the correct endpoints

StreamableHTTP

```shell
https://mcp-http.seitrace.com/<api-key>
```

SSE
```shell
https://mcp-sse.seitrace.com/sse/<api-key>
```

## Use with VSCode variants, Claude Desktop / Cursor 💻

See [mcp](./mcp/)

## Using with an MCP Client 🤝

Configure your MCP client to launch the compiled server binary:

- Command: `npx`
- Args:`["-y", "@seitrace/mcp"]`
- Env: `SECRET_APIKEY`, `API_BASE_URL` (optional) 

Once connected, the client will call `tools/list`, which returns exactly five tools representing the resource interface.

## Highlights ✨

What MCP provides to end users and assistants:

- Natural‑language access to Seitrace insights. The assistant performs API calls on your behalf.
- Self‑describing tool flow: enumerate actions, retrieve the input schema, then invoke.
- Input validation and clear error messages using per‑action JSON Schemas.
- Concise discovery: minimal list output; detailed payloads only when invoking actions.
- Integration with MCP‑enabled VS Code extensions (e.g., Continue, Cline).
- Simple, secure API key handling via environment variables (sent as `x-api-key`).
- Quick start via npx: `npx -y @seitrace/mcp`.

## Typical Flow 🔁

Using the MCP SDK, drive the resource-based flow via the five tools. **Important:** Always follow this sequence, especially step 3:

```js
// 1) Discover available resources
const resources = await client.callTool({ name: 'list_resouces', arguments: {} });
// -> { resources: ['erc20', 'erc721', 'native', ...] }

// 2) List actions for a resource
const actions = await client.callTool({ name: 'list_resouce_actions', arguments: { resource: 'insights_erc20' } });
// -> { resource: 'erc20', actions: [{ name, description }, ...] }

// 3) **REQUIRED** Get the JSON Schema for a specific action
// This step is critical - parameter names in descriptions may differ from actual schema
const schema = await client.callTool({ name: 'get_resource_action_schema', arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info' } });
// -> { resource: 'insights_erc20', action: 'get_erc20_token_info', schema }
// The schema reveals exact parameter names like "q" instead of "query", "chain" instead of "chain_id", etc.

// 4) Invoke the action with payload matching the schema structure
const res = await client.callTool({ name: 'invoke_resource_action', arguments: { resource: 'insights_erc20', action: 'get_erc20_token_info', payload: { chain: 'pacific-1', contract_address: '0x...' } } });
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

Make sure you run our e2e test to see the common errors we covered.

- E2E: `npm run test:e2e` (optional `E2E_DEBUG=1` for `[E2E]` logs).
- Node: Use v20+.

## Contributing 🤝

- Keep `tools/list` output compact. Do not embed per-action details there—fetch them via `getResourceActionSchema`.
- New endpoints should appear under the correct resource; root tool methods should provide discovery and invocation consistently.
- Prefer small, focused modules in `src/lib/` for shared logic.

## License 📄

See [LICENSE](./LICENSE)

## Support 📨

Please shoot emails to dev@cavies.xyz
