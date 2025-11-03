/**
 * MCP (Model Context Protocol) HTTP Server for OpenAI Agent Builder
 *
 * This Edge route implements a minimal MCP server that:
 * - Exposes ACM research tools via JSON-RPC over HTTP
 * - Forwards tool calls to an HTTP webhook
 * - Handles session initialization, tool listing, and tool execution
 *
 * Runtime: Vercel Edge (HTTP-based, no WebSockets)
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  {
    name: 'monitor_literature',
    description: 'Scan scientific literature for ACM targets',
    inputSchema: {
      type: 'object',
      properties: {
        terms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Search terms for literature monitoring'
        },
        window: {
          type: 'string',
          description: 'Time window (e.g., "24h", "7d", "30d")'
        }
      },
      required: ['terms']
    }
  },
  {
    name: 'patent_surveillance',
    description: 'Monitor patents by assignee & technology area',
    inputSchema: {
      type: 'object',
      properties: {
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Patent assignees to monitor'
        },
        window: {
          type: 'string',
          description: 'Time window for patent search'
        }
      },
      required: ['assignees']
    }
  },
  {
    name: 'query_experiments',
    description: 'Search ACM experiments/knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'update_knowledge_graph',
    description: 'Insert/update a knowledge graph entry',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Main category (e.g., "Drug Discovery", "Clinical Development")'
        },
        subcategory: {
          type: 'string',
          description: 'Subcategory within the main category'
        },
        title: {
          type: 'string',
          description: 'Title of the knowledge entry'
        },
        content: {
          type: 'string',
          description: 'Content or description'
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata as key-value pairs'
        },
        importance_score: {
          type: 'number',
          description: 'Importance score (0-100)'
        }
      },
      required: ['category', 'title', 'content']
    }
  },
  {
    name: 'analyze_formulation',
    description: 'Store/compute probability & recommendations for a formulation hypothesis',
    inputSchema: {
      type: 'object',
      properties: {
        submitted_by: {
          type: 'string',
          description: 'User or researcher submitting the hypothesis'
        },
        formulation_hypothesis: {
          type: 'string',
          description: 'The formulation hypothesis to analyze'
        },
        model_outputs: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of LLM model outputs and predictions'
        },
        estimated_cost_savings_usd: {
          type: 'number',
          description: 'Estimated cost savings in USD'
        }
      },
      required: ['formulation_hypothesis']
    }
  }
];

// ============================================================================
// TYPES
// ============================================================================

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Log diagnostics (only in development)
 */
function log(...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[MCP]', ...args);
  }
}

/**
 * Create a successful JSON-RPC response
 */
function createSuccessResponse(id: string | number | undefined, result: any): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result
  };
}

/**
 * Create an error JSON-RPC response
 */
function createErrorResponse(
  id: string | number | undefined,
  code: number,
  message: string,
  data?: any
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message, data }
  };
}

/**
 * Forward a tool call to the configured webhook
 */
async function forwardToWebhook(toolName: string, args: any): Promise<{
  content: Array<{ type: string; text: string }>;
  isError: boolean;
  status: number;
}> {
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      content: [{
        type: 'text',
        text: 'Error: WEBHOOK_URL not configured'
      }],
      isError: true,
      status: 500
    };
  }

  try {
    // Prepare webhook request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add bearer token if configured
    if (process.env.WEBHOOK_BEARER) {
      headers['Authorization'] = `Bearer ${process.env.WEBHOOK_BEARER}`;
    }

    const body = {
      action: toolName,
      data: args
    };

    log('Forwarding to webhook:', webhookUrl, body);

    // Make the webhook call
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const status = response.status;
    const responseText = await response.text();

    log('Webhook response:', status, responseText);

    // Try to parse as JSON, fallback to text
    let resultText: string;
    try {
      const json = JSON.parse(responseText);
      resultText = JSON.stringify(json, null, 2);
    } catch {
      resultText = responseText;
    }

    return {
      content: [{ type: 'text', text: resultText }],
      isError: status >= 400,
      status
    };

  } catch (error: any) {
    log('Webhook error:', error);
    return {
      content: [{
        type: 'text',
        text: `Webhook error: ${error.message || 'Unknown error'}`
      }],
      isError: true,
      status: 500
    };
  }
}

/**
 * Handle tools/list method
 */
function handleToolsList(id: string | number | undefined): JsonRpcResponse {
  log('Handling tools/list');

  return createSuccessResponse(id, {
    tools: TOOLS
  });
}

/**
 * Handle tools/call method
 */
async function handleToolsCall(
  id: string | number | undefined,
  params: any
): Promise<JsonRpcResponse> {
  log('Handling tools/call:', params);

  // Validate params
  if (!params || typeof params !== 'object') {
    return createErrorResponse(id, -32602, 'Invalid params: expected object');
  }

  const { name, arguments: args } = params;

  if (!name || typeof name !== 'string') {
    return createErrorResponse(id, -32602, 'Invalid params: missing or invalid "name"');
  }

  // Check if tool exists
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) {
    return createErrorResponse(
      id,
      -32601,
      `Unknown tool: ${name}`,
      { availableTools: TOOLS.map(t => t.name) }
    );
  }

  // Forward to webhook
  const result = await forwardToWebhook(name, args || {});

  return createSuccessResponse(id, result);
}

/**
 * Handle session/initialize or initialize method
 */
function handleInitialize(id: string | number | undefined): JsonRpcResponse {
  log('Handling initialize');

  return createSuccessResponse(id, {
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: 'acm-mcp',
      version: '0.2.0'
    },
    capabilities: {
      tools: {}
    }
  });
}

/**
 * Handle ping method
 */
function handlePing(id: string | number | undefined): JsonRpcResponse {
  log('Handling ping');
  return createSuccessResponse(id, {});
}

/**
 * Handle incoming JSON-RPC message
 */
async function handleMessage(message: string): Promise<string> {
  let request: JsonRpcRequest;

  // Parse JSON-RPC request
  try {
    request = JSON.parse(message);
  } catch (error) {
    return JSON.stringify(
      createErrorResponse(undefined, -32700, 'Parse error: Invalid JSON')
    );
  }

  // Validate JSON-RPC structure
  if (!request || request.jsonrpc !== '2.0' || !request.method) {
    return JSON.stringify(
      createErrorResponse(request?.id, -32600, 'Invalid Request: missing jsonrpc or method')
    );
  }

  const { method, params, id } = request;

  log('Received method:', method);

  // Route to appropriate handler
  let response: JsonRpcResponse;

  try {
    switch (method) {
      case 'initialize':
      case 'session/initialize':
        response = handleInitialize(id);
        break;

      case 'tools/list':
        response = handleToolsList(id);
        break;

      case 'tools/call':
        response = await handleToolsCall(id, params);
        break;

      case 'ping':
        response = handlePing(id);
        break;

      default:
        response = createErrorResponse(id, -32601, `Method not found: ${method}`);
    }
  } catch (error: any) {
    log('Handler error:', error);
    response = createErrorResponse(
      id,
      -32603,
      'Internal error',
      { message: error.message }
    );
  }

  return JSON.stringify(response);
}

// ============================================================================
// WEBSOCKET HANDLER
// ============================================================================

// ============================================================================

/**
 * GET handler - Returns server info and available methods
 */
export async function GET(request: NextRequest) {
  // Check authorization
  const serverToken = process.env.MCP_SERVER_TOKEN;
  if (serverToken) {
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${serverToken}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'WWW-Authenticate': 'Bearer' }
        }
      );
    }
  }

  // Return server info
  return NextResponse.json({
    name: 'ACM MCP Server',
    version: '0.2.0',
    protocol: 'MCP over HTTP (JSON-RPC 2.0)',
    transport: 'HTTP POST',
    documentation: 'https://modelcontextprotocol.io',
    endpoints: {
      rpc: '/api/mcp (POST)',
      health: '/api/mcp (GET)'
    },
    methods: [
      'initialize',
      'session/initialize',
      'tools/list',
      'tools/call',
      'ping'
    ],
    tools: TOOLS.map(t => ({
      name: t.name,
      description: t.description
    }))
  });
}

/**
 * POST handler - Processes JSON-RPC requests
 */
export async function POST(request: NextRequest) {
  // Check authorization
  const serverToken = process.env.MCP_SERVER_TOKEN;
  if (serverToken) {
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${serverToken}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        createErrorResponse(undefined, -32001, 'Unauthorized'),
        {
          status: 401,
          headers: { 'WWW-Authenticate': 'Bearer' }
        }
      );
    }
  }

  // Parse request body
  let body: string;
  try {
    body = await request.text();
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(undefined, -32700, 'Parse error: Could not read request body')
    );
  }

  // Handle the JSON-RPC message
  const responseJson = await handleMessage(body);

  // Return JSON-RPC response
  return new NextResponse(responseJson, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

/**
 * OPTIONS handler - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
