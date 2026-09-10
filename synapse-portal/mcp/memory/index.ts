import { McpToolName } from "../enums";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryMemorySchema, proposeMemorySchema, approveProposalSchema, rejectProposalSchema, incrementEfficacySchema, listNodesSchema } from "./schema";
import { queryMemory, proposeMemory, approveProposal, rejectProposal, incrementEfficacy, listNodes } from "./service";

export * from "./schema";
export * from "./service";

export function registerMemoryTools(server: McpServer): void {
  server.tool(
    McpToolName.QUERY_MEMORY,
    "Query knowledge nodes from the Synapse Knowledge Portal by tags.",
    queryMemorySchema,
    async ({ tags }) => {
      const text = await queryMemory(tags);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.PROPOSE_MEMORY,
    "Propose a new knowledge node to the Synapse Knowledge Portal.",
    proposeMemorySchema,
    async ({ label, content, tags }) => {
      const text = await proposeMemory(label, content, tags);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.APPROVE_PROPOSAL,
    "Approve a pending knowledge proposal in the Synapse Knowledge Portal.",
    approveProposalSchema,
    async ({ node_id }) => {
      const text = await approveProposal(node_id);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.REJECT_PROPOSAL,
    "Reject a pending knowledge proposal in the Synapse Knowledge Portal.",
    rejectProposalSchema,
    async ({ node_id }) => {
      const text = await rejectProposal(node_id);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.INCREMENT_EFFICACY,
    "Increment the success count (efficacy tracking) of a knowledge node.",
    incrementEfficacySchema,
    async ({ node_id }) => {
      const text = await incrementEfficacy(node_id);
      return { content: [{ type: "text", text }] };
    },
  );

  server.tool(
    McpToolName.LIST_NODES,
    "List all active/approved knowledge nodes currently present in the Synapse Knowledge Portal.",
    listNodesSchema,
    async () => {
      const text = await listNodes();
      return { content: [{ type: "text", text }] };
    },
  );
}
