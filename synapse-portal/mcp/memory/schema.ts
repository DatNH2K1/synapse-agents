import { z } from "zod";

export const queryMemorySchema = {
  tags: z
    .array(z.string())
    .describe(
      'A list of tags to filter by (e.g. ["project:synapse-portal", "technology:nextjs"]).',
    ),
};

export const proposeMemorySchema = {
  label: z.string().describe("Short descriptive title of the node."),
  content: z.string().describe("The full markdown/text content of the node."),
  type: z
    .enum(["LESSON", "CONTEXT", "FEATURE"])
    .describe("One of 'LESSON', 'CONTEXT', or 'FEATURE'."),
  tags: z
    .array(z.string())
    .describe(
      "List of tags. If type is 'LESSON', at least one 'section:' tag is required.",
    ),
};

export const approveProposalSchema = {
  node_id: z
    .string()
    .describe("The UUID of the pending node proposal to approve."),
};

export const rejectProposalSchema = {
  node_id: z
    .string()
    .describe("The UUID of the pending node proposal to reject."),
};

export const incrementEfficacySchema = {
  node_id: z.string().describe("The UUID of the node to increment."),
};

export const listNodesSchema = {};
