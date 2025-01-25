import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createConnection } from 'node:net';
import os from 'node:os';
import { NetworkConnectivityResult } from '../types.js';

const execAsync = promisify(exec);

export const networkTools = {
  getNetworkInterfaces: {
    name: 'getNetworkInterfaces',
    description: 'Get network interface information',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const interfaces = os.networkInterfaces();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(interfaces, null, 2)
        }]
      };
    }
  },

  checkConnectivity: {
    name: 'checkConnectivity',
    description: 'Test TCP connectivity to a host and port',
    inputSchema: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          description: 'Target host'
        },
        port: {
          type: 'number',
          description: 'Target port'
        },
        timeout: {
          type: 'number',
          description: 'Connection timeout in milliseconds',
          default: 5000
        }
      },
      required: ['host', 'port']
    },
    handler: async ({ host, port, timeout = 5000 }: { host: string; port: number; timeout?: number }) => {
      return new Promise<{ content: Array<{ type: string, text: string }> }>((resolve) => {
        const result: NetworkConnectivityResult = {
          connected: false
        };

        const socket = createConnection(port, host);
        socket.setTimeout(timeout);

        socket.on('connect', () => {
          result.connected = true;
          socket.end();
        });

        socket.on('timeout', () => {
          result.error = 'Connection timed out';
          socket.destroy();
        });

        socket.on('error', (err) => {
          result.error = err.message;
        });

        socket.on('close', () => {
          resolve({
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          });
        });
      });
    }
  },

  getPublicIP: {
    name: 'getPublicIP',
    description: 'Get public IP address using ip-api.com',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      try {
        const response = await fetch('http://ip-api.com/json/?fields=query');
        const data = await response.json();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ ip: data.query }, null, 2)
          }]
        };
      } catch (error) {
        throw new Error(`Failed to get public IP: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  pingHost: {
    name: 'pingHost',
    description: 'Ping a host using system ping command',
    inputSchema: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          description: 'Target host to ping'
        },
        count: {
          type: 'number',
          description: 'Number of ping requests',
          default: 4
        }
      },
      required: ['host']
    },
    handler: async ({ host, count = 4 }: { host: string; count?: number }) => {
      const platform = os.platform();
      const pingCmd = platform === 'win32' 
        ? `ping -n ${count} ${host}`
        : `ping -c ${count} ${host}`;

      try {
        const { stdout } = await execAsync(pingCmd);
        return {
          content: [{
            type: 'text',
            text: stdout
          }]
        };
      } catch (error) {
        throw new Error(`Ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  traceroute: {
    name: 'traceroute',
    description: 'Perform traceroute to a host',
    inputSchema: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          description: 'Target host'
        }
      },
      required: ['host']
    },
    handler: async ({ host }: { host: string }) => {
      const platform = os.platform();
      const cmd = platform === 'win32' ? `tracert ${host}` : `traceroute ${host}`;

      try {
        const { stdout } = await execAsync(cmd);
        return {
          content: [{
            type: 'text',
            text: stdout
          }]
        };
      } catch (error) {
        throw new Error(`Traceroute failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};