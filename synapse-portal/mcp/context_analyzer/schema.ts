import { z } from "zod";

export const analyzeContextHealthSchema = {
  context_file_path: z
    .string()
    .describe(
      "Absolute or relative path to a JSON file containing the message history/context.",
    ),
  token_limit: z
    .number()
    .optional()
    .default(128000)
    .describe("The total token limit of the model (default: 128000)."),
};

export const calculateContextBudgetSchema = {
  system_tokens: z
    .number()
    .optional()
    .default(2000)
    .describe("Estimated tokens for system prompts."),
  tools_tokens: z
    .number()
    .optional()
    .default(1500)
    .describe("Estimated tokens for tool definitions."),
  docs_tokens: z
    .number()
    .optional()
    .default(3000)
    .describe("Estimated tokens for retrieved docs/reference documents."),
  history_tokens: z
    .number()
    .optional()
    .default(5000)
    .describe("Estimated tokens for message history."),
  buffer_percentage: z
    .number()
    .optional()
    .default(0.15)
    .describe("Safety buffer percentage (0.0 to 1.0)."),
};
