# Seitrace MCP Installation Guide

This guide covers all installation methods for the Seitrace MCP server across different environments and AI assistants.

## Prerequisites

- **API Key**: Get your free Seitrace API key from [seitrace.com/insights](https://seitrace.com/insights)
- **Node.js**: Version 20+ (for local installations)

## Installation Methods

### 1. Remote MCP Endpoints (Easiest)

Use our hosted MCP endpoints - no local installation required.

#### StreamableHTTP Endpoint
```
https://mcp.seitrace.com/<your-api-key>
```

#### Server-Sent Events (SSE) Endpoint
```
https://mcp.seitrace.com/sse/<your-api-key>
```

**Supported by**: Claude Web, Custom MCP clients, API integrations

---

### 2. Claude Desktop

**Option A**: Use the provided configuration file:
```bash
# Copy our pre-configured file to Claude Desktop location

# macOS
cp mcp/claude.mcp.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows  
copy mcp\claude.mcp.json %APPDATA%\Claude\claude_desktop_config.json

# Edit the copied file to add your API key
```

**Option B**: Manual configuration:

#### macOS
```bash
# Edit configuration
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

#### Windows
```bash
# Edit configuration
notepad %APPDATA%\Claude\claude_desktop_config.json
```

#### Configuration
```json
{
  "mcpServers": {
    "seitrace": {
      "command": "npx",
      "args": ["-y", "@seitrace/mcp"],
      "env": {
        "SECRET_APIKEY": "your-seitrace-api-key-here"
      }
    }
  }
}
```

**Restart Claude Desktop** after saving the configuration.

---

### 3. VS Code Extensions

#### Using Pre-configured Files

We provide ready-to-use configuration files in the [`mcp/`](./mcp/) directory:

- **VS Code**: Copy [`vscode.mcp.json`](./mcp/vscode.mcp.json) to your VS Code settings
- **Claude Desktop**: Copy [`claude.mcp.json`](./mcp/claude.mcp.json) to your Claude config

#### Continue Extension

1. Install the [Continue extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue)
2. **Option A**: Copy the provided configuration:
   ```bash
   # Copy our pre-configured file
   cp mcp/vscode.mcp.json ~/.continue/config.json
   ```

3. **Option B**: Manual configuration - Open VS Code settings (Cmd/Ctrl + ,) and search for "Continue":
   ```json
   {
     "continue.mcp": {
       "servers": {
         "seitrace": {
           "command": "npx",
           "args": ["-y", "@seitrace/mcp"],
           "env": {
             "SECRET_APIKEY": "your-seitrace-api-key-here"
           }
         }
       }
     }
   }
   ```

#### Cline Extension

1. Install the [Cline extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)
2. **Option A**: Use the provided configuration:
   ```bash
   # Reference our pre-configured file (adapt path as needed)
   # The vscode.mcp.json works for most VS Code MCP extensions
   ```

3. **Option B**: Manual configuration - Add to Cline settings:
   ```json
   {
     "mcpServers": {
       "seitrace": {
         "command": "npx",
         "args": ["-y", "@seitrace/mcp"],
         "env": {
           "SECRET_APIKEY": "your-seitrace-api-key-here"
         }
       }
     }
   }
   ```

---

### 4. Cursor IDE

1. **Option A**: Use the provided configuration:
   ```bash
   # The vscode.mcp.json can be adapted for Cursor
   # Copy and modify as needed for Cursor's MCP settings location
   ```

2. **Option B**: Manual configuration - Open Cursor Settings (Cmd/Ctrl + ,) and navigate to Extensions → MCP:
   ```json
   {
     "mcpServers": {
       "seitrace": {
         "command": "npx",
         "args": ["-y", "@seitrace/mcp"],
         "env": {
           "SECRET_APIKEY": "your-seitrace-api-key-here"
         }
       }
     }
   }
   ```

---

### 5. Local Development Setup

For development or custom integrations:

#### Clone and Install
```bash
git clone https://github.com/Seitrace/seitrace-mcp.git
cd seitrace-mcp
npm install
```

#### Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your API key
echo "SECRET_APIKEY=your-seitrace-api-key-here" >> .env
```

#### Build and Run
```bash
# Build the project
npm run build

# Run the MCP server
npm start
```

#### Run as Standalone Server
```bash
# HTTP Stream server (port 3000)
npm run start:httpstream

# SSE server (port 3000)
npm run start:sse
```

---

### 6. Custom MCP Client Integration

If you're building a custom MCP client:

#### Using the MCP SDK
```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client(
  { name: 'my-client', version: '1.0.0' },
  { capabilities: {} }
);

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@seitrace/mcp'],
  env: { SECRET_APIKEY: 'your-api-key' }
});

await client.connect(transport);

// Use the client...
const resources = await client.callTool({
  name: 'list_resources',
  arguments: {}
});
```

#### Using Remote Endpoints
```javascript
// For StreamableHTTP
const response = await fetch('https://mcp.seitrace.com/your-api-key', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'list_resources',
      arguments: {}
    }
  })
});

// For SSE
const eventSource = new EventSource('https://mcp.seitrace.com/sse/your-api-key');
eventSource.onmessage = (event) => {
  console.log('MCP Event:', JSON.parse(event.data));
};
```

---

## Verification

Test your installation with these commands:

### Basic Resource Discovery
```bash
# List all available resources
echo '{"method": "tools/call", "params": {"name": "list_resources", "arguments": {}}}' | npx -y @seitrace/mcp
```

### Test Transaction Details
```bash
# Get schema for transaction details
echo '{"method": "tools/call", "params": {"name": "get_resource_action_schema", "arguments": {"resource": "insights_transactions", "action": "get_transaction_details"}}}' | npx -y @seitrace/mcp
```

### E2E Test
```bash
# Run comprehensive tests (requires API key)
git clone https://github.com/Seitrace/seitrace-mcp.git
cd seitrace-mcp
npm install
SECRET_APIKEY=your-api-key npm run test:e2e
```

---

## Available Resources

After installation, you'll have access to these resources:

**General**
- `general_faucet` - Request test tokens
- `general_rpc_lcd` - Execute RPC/LCD calls
- `general_associations` - Query EVM ↔ Native associations

**Insights**
- `insights_address` - Address details and transactions
- `insights_erc20` - ERC-20 token data
- `insights_erc721` - NFT data
- `insights_native` - Native Sei tokens
- `insights_assets` - Asset search and details
- `insights_transactions` - Transaction details by hash
- `insights_earnings` - Staking pool information

**Smart Contracts**
- `smart_contract` - Contract state queries and ABI downloads

---

## Troubleshooting

### Common Issues

1. **"Command not found: npx"**
   - Install Node.js 20+ from [nodejs.org](https://nodejs.org/)

2. **"API key invalid"**
   - Verify your API key at [seitrace.com/insights](https://seitrace.com/insights)
   - Ensure no extra spaces in the environment variable

3. **"Connection failed"**
   - Check your internet connection
   - For remote endpoints, verify the URL format

4. **VS Code/Cursor not detecting MCP**
   - Restart the IDE after configuration changes
   - Check the extension logs for error messages

### Debug Mode

Enable debug logging:

```bash
# Local development
DEBUG=seitrace:* npm start

# E2E tests with debug output
E2E_DEBUG=1 npm run test:e2e
```

### Getting Help

- **Documentation**: [GitHub Repository](https://github.com/Seitrace/seitrace-mcp)
- **Issues**: [GitHub Issues](https://github.com/Seitrace/seitrace-mcp/issues)
- **Support**: dev@cavies.xyz

---

## Next Steps

1. **Explore Resources**: Start with `list_resources` to see what's available
2. **Follow the Flow**: Always use `get_resource_action_schema` before invoking actions
3. **Generate Snippets**: Use `get_resource_action_snippet` for code examples
4. **Read the Guide**: Check [README.md](./README.md) for usage patterns

Happy querying! 🚀
