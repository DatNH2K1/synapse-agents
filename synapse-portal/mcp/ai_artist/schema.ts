import { z } from "zod";

export const generateAiArtSchema = {
  concept: z
    .string()
    .describe(
      "Visual concept or idea (e.g. 'cyberpunk city neon lights').",
    ),
  mode: z
    .string()
    .optional()
    .default("search")
    .describe("Generation mode ('search', 'creative', 'wild')."),
  aspect_ratio: z
    .string()
    .optional()
    .default("16:9")
    .describe("Target aspect ratio (e.g. '1:1', '16:9', '9:16')."),
};

export const searchAiArtPromptsSchema = {
  query: z.string().describe("Search keywords or theme."),
  category: z
    .string()
    .optional()
    .default("all")
    .describe("Category filter."),
  limit: z
    .number()
    .optional()
    .default(5)
    .describe("Maximum number of results."),
};
