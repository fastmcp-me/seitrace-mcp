# Developer Guide 🛠️

Welcome to the Seitrace Insights MCP server codebase. This guide explains the architecture, how to add new functionality, and the development workflow.

## Project overview 🧭

- Language: TypeScript (Node 20+)
- Build output: `build/`
- Entry point: `src/index.ts` (compiled to `build/index.js`)
- MCP SDK: `@modelcontextprotocol/sdk`
- HTTP client: `axios`
- Validation: JSON Schema -> Zod runtime validation

Key domains:

- Handlers (`src/handlers/`): MCP tool request handlers. They delegate to "topics" based on the resource name.
- Topics (`src/topics/`): Feature areas grouped under a topic key (e.g., `insights`). Each topic implements the `ITopic` interface and exposes resource/action maps.
- Utils/Auth (`src/utils.ts`, `src/auth.ts`): Helpers for schema conversion, snippet generation, security, and response formatting.
- OpenAPI adapters (`src/topics/**/resources/`): Definitions and security schemes.

## Tools exposed to MCP clients 🧰

Exactly five tools are advertised (see `src/handlers/tools_list.ts`):

- `list_resources` — list available resources across all topics.
- `list_resource_actions` — list actions for a resource.
- `list_resource_action_schema` — get the JSON Schema for a specific action.
- `invoke_resource_action` — invoke an action with payload validation.
- `get_resource_action_snippet` — generate code snippets for an action.

Handlers are wired in `src/handlers/index.ts` and rely on topic routing (see below).

## Topic model 🧩

A topic groups related resources and actions. Topic resource names are prefixed with the topic key, e.g. `insights_erc20`.

Contract: implement `ITopic` (see `src/topics/base.ts`). Required shape:

- `TOPIC_KEY: string` — unique topic prefix used in resource names.
- `getResources(): Promise<ResourceMap> | ResourceMap` — returns `Map<string, McpGroupedToolDefinition>` keyed by full resource name (e.g., `insights_erc20`).
- `hasResourceAction(resource, action): Promise<boolean> | boolean` — guard used by handlers to validate existence.
- `listResource()` — returns `{ resources }` for this topic only.
- `listResourceActions(toolArgs)` — returns `{ resource, actions: [{ name, description }] }`.
- `getResourceActionSchema(toolArgs)` — returns `{ resource, action, schema }`.
- `getResourceActionSnippet(toolArgs)` — validates `language` and returns `{ resource, action, language, snippet }`.
- `invokeResourceAction(toolArgs)` — validates `payload` against the action schema and executes the HTTP call.

Utilities provided by `src/topics/base.ts`:

- `findResource(resources, resourceName)` — throws with a helpful message if missing.
- `findAction(resources, resourceName, actionName)` — throws if the action is missing.

Reference implementation: `src/topics/insights/index.ts` (class `InsightsTopic`).

## Wiring topics 🔌

All topics must be declared and exported in `src/topics/index.ts`.

- Ensure the topic class implements the `ITopic` interface.
- Instantiate your topic and add it to both:
  - `AVAILABLE_TOPICS: ITopic[]` — used by `list_resources` to aggregate resources across topics.
  - `TOPIC_KEY_MAP: Record<string, ITopic>` — maps `topicKey` to topic instance for routing.

Example (`src/topics/index.ts`):

```ts
import { ITopic } from './base.js';
import { InsightsTopic } from './insights/index.js';

const insights = new InsightsTopic();

export const AVAILABLE_TOPICS: ITopic[] = [insights];

export const TOPIC_KEY_MAP: Record<string, ITopic> = {
  [insights.TOPIC_KEY]: insights,
};
```

Routing behavior in handlers:

- `list_resources` flattens all keys from every topic via `AVAILABLE_TOPICS`.
- Other tools derive `topicKey` from the resource, e.g. `const topicKey = resource.split('_')[0];` and look up `TOPIC_KEY_MAP[topicKey]`.

When adding a new topic:

1. Create `src/topics/<your_topic>/index.ts` that implements `ITopic`.
2. Choose a unique `TOPIC_KEY` (lowercase, no spaces) and prefix all resource names with it when building your resource map.
3. Add the instance to both `AVAILABLE_TOPICS` and `TOPIC_KEY_MAP` in `src/topics/index.ts`.
4. Ensure resource names and actions are predictable and documented in your topic.

## Adding resources/actions to a topic ➕

- Build a `Map<string, McpGroupedToolDefinition>` where each entry represents a resource and contains an `actions` object.
- Each action definition must include:
  - `method`, `pathTemplate`
  - `inputSchema` (JSON Schema)
  - `executionParameters` (path/query/header params)
  - optional `requestBodyContentType`, `securityRequirements`
- Validation is derived from `inputSchema` via `getZodSchemaFromJsonSchema`.
- Security application is handled by `applySecurity` with `securitySchemes` from your OpenAPI definition.

## Build, test, and run 🏗️

- Install: `npm install`
- Type check: `npm run typecheck`
- Build: `npm run build`
- E2E: `npm run test:e2e` (optionally set `SEITRACE_API_KEY`)
- Run server: `npm start`

The `test:e2e` validates that exactly five tools are advertised and that the resource flow works ✅.

## Coding standards ✨

- Modules are ESM (`type: module`). Use `.js` extensions in imports within TypeScript.
- Keep handler output compact; avoid embedding full schemas in `tools/list`. Use dedicated tools for details.
- Prefer small, focused modules. Share logic through `src/utils.ts`.

## Environment variables 🔐

- `API_BASE_URL` (optional, defaults to Insights API base)
- `SECRET_APIKEY` (for authenticated endpoints, applied as `x-api-key`)

## Release process 🚢

- Bump version in `package.json`.
- Build locally and run `npm publish`.
- Tag the release in git.
