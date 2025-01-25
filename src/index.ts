#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { systemTools } from './tools/system.js';
import { networkTools } from './tools/network.js';
import { geoTools } from './tools/geo.js';
import { generatorTools } from './tools/generator.js';
import { dateTimeTools } from './tools/datetime.js';
import { securityTools } from './tools/security.js';

// Combine all tools
import { ToolKit } from './types.js';

const allTools: ToolKit = {
  ...systemTools,
  ...networkTools,
  ...geoTools,
  ...generatorTools,
  ...dateTimeTools,
  ...securityTools
};

class ToolkitServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'toolkit-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
    
    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.entries(allTools).map(([name, tool]) => ({
          name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = allTools[request.params.name as keyof typeof allTools];
      
      if (!tool) {
        throw new Error(`Tool not found: ${request.params.name}`);
      }

      return tool.handler(request.params.arguments);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Toolkit MCP server running on stdio');

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
}

// Start the server
const server = new ToolkitServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});