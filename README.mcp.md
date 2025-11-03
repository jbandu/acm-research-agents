# MCP WebSocket Server for OpenAI Agent Builder

This document explains how to set up and use the MCP (Model Context Protocol) WebSocket server that exposes ACM research tools to OpenAI Agent Builder.

## Overview

The MCP server is a WebSocket endpoint that implements the Model Context Protocol, allowing OpenAI's Agent Builder to discover and invoke ACM research tools. All tool calls are forwarded to a configurable HTTP webhook.

**Endpoint:** `wss://<your-domain>/api/mcp`
**Runtime:** Vercel Edge (WebSocket support)
**Protocol:** JSON-RPC 2.0

## Architecture

```
OpenAI Agent Builder
         ↓ WebSocket (JSON-RPC)
    MCP Server (/api/mcp)
         ↓ HTTP POST
    Webhook Endpoint (/api/agent-webhook)
         ↓
    Your Application Logic
```

## Available Tools

The MCP server exposes 5 research tools:

1. **monitor_literature** - Scan scientific literature for ACM targets
2. **patent_surveillance** - Monitor patents by assignee & technology area
3. **query_experiments** - Search ACM experiments/knowledge base
4. **update_knowledge_graph** - Insert/update knowledge graph entries
5. **analyze_formulation** - Analyze formulation hypotheses with LLM models

## Setup

### 1. Environment Variables

Create or update `.env.local` with:

```bash
# Required: Authentication token for MCP WebSocket connections
MCP_SERVER_TOKEN=your-secure-random-token-here

# Required: Webhook URL where tool calls are forwarded
WEBHOOK_URL=https://acm-pi-three.vercel.app/api/agent-webhook

# Optional: Bearer token for webhook authentication
WEBHOOK_BEARER=your-webhook-bearer-token
```

**Generate a secure token:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### 2. Deploy to Vercel

```bash
# Set environment variables in Vercel
vercel env add MCP_SERVER_TOKEN
vercel env add WEBHOOK_URL
vercel env add WEBHOOK_BEARER  # Optional

# Deploy
vercel --prod
```

### 3. Test Locally

**Start the development server:**
```bash
npm run dev
```

**Test with wscat:**
```bash
# Install wscat
npm install -g wscat

# Connect to local MCP server
wscat -c "ws://localhost:3000/api/mcp" \
  -H "Authorization: Bearer your-token-here"
```

## OpenAI Agent Builder Configuration

### Add MCP Server

1. Go to **OpenAI Agent Builder** → **Tools** → **Add MCP Server**

2. Configure the connection:
   - **Server URL:** `wss://your-domain.vercel.app/api/mcp`
   - **Authentication:** Custom Header
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer your-mcp-server-token`

3. Click **Test Connection** - should show "Connected" and list 5 tools

4. Save the configuration

### Using Tools in Agents

Once connected, the agent can call tools like:

```
"Monitor recent mRNA research publications from the last 7 days"
→ Uses monitor_literature tool

"Check recent patent filings by Moderna and BioNTech"
→ Uses patent_surveillance tool

"Search our experiments for lipid nanoparticle formulations"
→ Uses query_experiments tool
```

## JSON-RPC Examples

### 1. Initialize Session

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": {
      "name": "acm-mcp",
      "version": "0.1.0"
    },
    "capabilities": {
      "tools": {}
    }
  }
}
```

### 2. List Available Tools

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "monitor_literature",
        "description": "Scan scientific literature for ACM targets",
        "inputSchema": {
          "type": "object",
          "properties": {
            "terms": { "type": "array", "items": { "type": "string" } },
            "window": { "type": "string" }
          },
          "required": ["terms"]
        }
      }
      // ... other tools
    ]
  }
}
```

### 3. Call a Tool: monitor_literature

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "monitor_literature",
    "arguments": {
      "terms": ["mRNA", "nanoparticles", "lipid delivery"],
      "window": "24h"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"results\": [...], \"count\": 15}"
      }
    ],
    "isError": false,
    "status": 200
  }
}
```

### 4. Call a Tool: update_knowledge_graph

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "update_knowledge_graph",
    "arguments": {
      "category": "Drug Delivery",
      "subcategory": "Lipid Nanoparticles",
      "title": "Novel ionizable lipid synthesis",
      "content": "New synthesis pathway for ionizable lipids...",
      "importance_score": 85
    }
  }
}
```

### 5. Ping (Keep-Alive)

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "ping",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {}
}
```

## Webhook Integration

### Webhook Request Format

When a tool is called, the MCP server forwards it to `WEBHOOK_URL` as:

```http
POST /api/agent-webhook HTTP/1.1
Host: acm-pi-three.vercel.app
Content-Type: application/json
Authorization: Bearer <WEBHOOK_BEARER>  # If configured

{
  "action": "monitor_literature",
  "data": {
    "terms": ["mRNA", "nanoparticles"],
    "window": "24h"
  }
}
```

### Webhook Response Format

Your webhook should return:

```json
{
  "success": true,
  "results": [...],
  "count": 15
}
```

The MCP server wraps this as:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"success\":true,\"results\":[...],\"count\":15}"
    }
  ],
  "isError": false,
  "status": 200
}
```

### Error Handling

If webhook returns 400+:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":\"Invalid parameters\"}"
    }
  ],
  "isError": true,
  "status": 400
}
```

## Testing

### Manual Testing with wscat

```bash
# Connect
wscat -c "ws://localhost:3000/api/mcp" \
  -H "Authorization: Bearer your-token"

# Send initialize
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}

# List tools
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}

# Call monitor_literature
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"monitor_literature","arguments":{"terms":["mRNA"],"window":"24h"}}}
```

### Automated Tests

Create `tests/mcp.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('MCP server requires authentication', async ({ request }) => {
  const response = await request.get('/api/mcp');
  expect(response.status()).toBe(401);
});

test('MCP server upgrades with valid auth', async ({ request }) => {
  const response = await request.get('/api/mcp', {
    headers: {
      'Authorization': `Bearer ${process.env.MCP_SERVER_TOKEN}`,
      'Upgrade': 'websocket'
    }
  });
  expect(response.status()).toBe(101);
});
```

## Troubleshooting

### Connection Issues

**Problem:** 401 Unauthorized

**Solution:** Verify `Authorization: Bearer <token>` header matches `MCP_SERVER_TOKEN`

**Problem:** 500 Server Error

**Solution:** Check that `MCP_SERVER_TOKEN` is set in environment variables

### Tool Call Issues

**Problem:** "WEBHOOK_URL not configured"

**Solution:** Set `WEBHOOK_URL` in environment variables

**Problem:** Webhook timeout

**Solution:** Check webhook endpoint is accessible and responding within 30s

### OpenAI Agent Builder Issues

**Problem:** Can't connect to MCP server

**Solution:**
- Verify wss:// (not ws://) for production
- Check header format: `Authorization: Bearer <token>`
- Ensure server is deployed and accessible

**Problem:** Tools not appearing

**Solution:**
- Test `tools/list` manually with wscat
- Check server logs for errors
- Verify JSON-RPC response format

## Logging

### Development

Logs are enabled automatically in development:

```
[MCP] Auth successful, upgrading to WebSocket
[MCP] WebSocket connection established
[MCP] Received method: tools/list
[MCP] Handling tools/list
```

### Production

Logs are disabled in production for performance. To enable:

```typescript
// In route.ts, remove the NODE_ENV check:
function log(...args: any[]) {
  console.log('[MCP]', ...args);
}
```

## Security

### Authentication

- **WebSocket:** Requires `Authorization: Bearer` header with `MCP_SERVER_TOKEN`
- **Webhook:** Optional `WEBHOOK_BEARER` token for webhook calls

### Best Practices

1. **Use strong random tokens** (32+ bytes)
2. **Rotate tokens** periodically
3. **Use HTTPS/WSS** in production
4. **Validate webhook responses** before returning to agent
5. **Rate limit** webhook calls if needed
6. **Monitor** for unusual tool usage patterns

## Advanced Usage

### Custom Tool Schema Validation

Add validation in `handleToolsCall`:

```typescript
// Validate required fields
const tool = TOOLS.find(t => t.name === name);
const required = tool.inputSchema.required || [];

for (const field of required) {
  if (!args[field]) {
    return createErrorResponse(id, -32602, `Missing required field: ${field}`);
  }
}
```

### Tool Usage Metrics

Track tool calls:

```typescript
// Add to handleToolsCall
await logToolUsage(name, args);
```

### Response Transformation

Transform webhook responses:

```typescript
// In forwardToWebhook
const transformed = transformResponse(json, toolName);
return {
  content: [{ type: 'text', text: JSON.stringify(transformed) }],
  isError: false,
  status
};
```

## Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [OpenAI Agent Builder Docs](https://platform.openai.com/docs/agents)
- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions)
- [WebSocket on Edge](https://vercel.com/docs/functions/edge-functions/websockets)

## Support

For issues or questions:
1. Check GitHub Issues
2. Review Vercel deployment logs
3. Test webhook endpoint directly
4. Verify environment variables are set correctly
