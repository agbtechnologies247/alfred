import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.ALFRED_API_URL || "http://localhost:3000";
const AUTH_HEADER = { 
  "Authorization": `Bearer ${process.env.ALFRED_API_KEY || "sk_test_xxxxx"}` 
};

// Instantiate MCP Server
const server = new Server(
  {
    name: "alfred-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// 1. Tools: Register A.L.F.R.E.D. operational endpoints
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_system_kpis",
        description: "Fetch live operational KPIs (health score, critical alerts, active incident count, and automation success rate) from A.L.F.R.E.D.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "list_incidents",
        description: "List all active/recent incidents logged in A.L.F.R.E.D.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "simulate_blast_radius",
        description: "Simulate the blast radius, risk level, cost impact, and SLA violation risk of a recovery action BEFORE executing it.",
        inputSchema: {
          type: "object",
          properties: {
            action_type: { 
              type: "string", 
              description: "The type of action to execute, e.g., 'restart_service', 'clear_disk', 'scale_replicas'" 
            },
            target_entity_id: { 
              type: "string", 
              description: "The target infrastructure entity ID, e.g., 'orders-api', 'db-postgres-prod'" 
            }
          },
          required: ["action_type", "target_entity_id"]
        }
      },
      {
        name: "execute_workflow",
        description: "Execute an autonomic recovery playbook or runbook workflow to self-heal an incident in A.L.F.R.E.D.",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: { 
              type: "string", 
              description: "The workflow ID/template to run, e.g., 'TPL-001', 'TPL-010', 'TPL-020'" 
            }
          },
          required: ["workflow_id"]
        }
      },
      {
        name: "get_opex_savings",
        description: "Get data-driven ROI and opex savings computed from the live template catalog.",
        inputSchema: { type: "object", properties: {} }
      }
    ]
  };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_system_kpis": {
        const response = await axios.get(`${API_URL}/api/monitoring/kpis`, { headers: AUTH_HEADER });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
        };
      }
      case "list_incidents": {
        const response = await axios.get(`${API_URL}/api/incidents`, { headers: AUTH_HEADER });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
        };
      }
      case "simulate_blast_radius": {
        const { action_type, target_entity_id } = args as { action_type: string; target_entity_id: string };
        const response = await axios.post(`${API_URL}/api/decisions/simulate`, {
          action_type,
          target_entity_id
        }, { headers: AUTH_HEADER });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
        };
      }
      case "execute_workflow": {
        const { workflow_id } = args as { workflow_id: string };
        const response = await axios.post(`${API_URL}/api/workflows/${workflow_id}/execute`, {}, { headers: AUTH_HEADER });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
        };
      }
      case "get_opex_savings": {
        const response = await axios.get(`${API_URL}/api/opex/roi`, { headers: AUTH_HEADER });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
        };
      }
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ 
        type: "text", 
        text: `Error executing tool '${name}': ${error.message} \nResponse: ${JSON.stringify(error.response?.data || {})}` 
      }],
      isError: true
    };
  }
});

// 2. Resources: Register SOPs and incident timeline logs
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "alfred://sops",
        name: "Standard Operating Procedures (SOPs)",
        description: "List of all AI-generated recovery procedures and runbooks in A.L.F.R.E.D.",
        mimeType: "application/json"
      },
      {
        uri: "alfred://incidents/active",
        name: "Active Incident Log",
        description: "Diagnostic reports for all currently open high-severity incidents.",
        mimeType: "application/json"
      }
    ]
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  try {
    if (uri === "alfred://sops") {
      const response = await axios.get(`${API_URL}/api/sops`, { headers: AUTH_HEADER });
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } else if (uri === "alfred://incidents/active") {
      const response = await axios.get(`${API_URL}/api/incidents`, { headers: AUTH_HEADER });
      const activeOnly = response.data.filter((inc: any) => inc.status !== "Resolved");
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(activeOnly, null, 2)
          }
        ]
      };
    } else {
      throw new Error(`Resource not found: ${uri}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to read resource '${uri}': ${error.message}`);
  }
});

// Stdio initialization
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("A.L.F.R.E.D. MCP server running on stdio transport");
}

run().catch((error) => {
  console.error("Fatal error running MCP server:", error);
  process.exit(1);
});
