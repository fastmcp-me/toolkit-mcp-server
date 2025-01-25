import os from 'node:os';
import { SystemInfo } from '../types.js';

export const systemTools = {
  getCurrentTime: {
    name: 'getCurrentTime',
    description: 'Get current time formatted with Intl.DateTimeFormat',
    inputSchema: {
      type: 'object',
      properties: {
        locale: {
          type: 'string',
          description: 'Locale for formatting (e.g., en-US)',
          default: 'en-US'
        },
        timeZone: {
          type: 'string',
          description: 'Time zone (e.g., America/New_York)',
          default: 'UTC'
        }
      }
    },
    handler: async ({ locale = 'en-US', timeZone = 'UTC' }) => {
      const formatter = new Intl.DateTimeFormat(locale, {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short'
      });
      
      return {
        content: [{
          type: 'text',
          text: formatter.format(Date.now())
        }]
      };
    }
  },

  getSystemInfo: {
    name: 'getSystemInfo',
    description: 'Get system information using Node.js os module',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const info: SystemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        nodeVersion: process.version
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(info, null, 2)
        }]
      };
    }
  },

  getLoadAverage: {
    name: 'getLoadAverage',
    description: 'Get system load average for 1, 5, and 15 minutes',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const [oneMin, fiveMin, fifteenMin] = os.loadavg();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            oneMinute: oneMin,
            fiveMinutes: fiveMin,
            fifteenMinutes: fifteenMin
          }, null, 2)
        }]
      };
    }
  }
};