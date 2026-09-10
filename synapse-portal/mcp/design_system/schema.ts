import { z } from "zod";

export const generateDesignSystemRecommendationSchema = {
  query: z
    .string()
    .describe(
      "UI concept description (e.g. 'SaaS dashboard', 'e-commerce checkout').",
    ),
  project_name: z
    .string()
    .optional()
    .default("")
    .describe("Optional custom project name."),
  format_type: z
    .string()
    .optional()
    .default("markdown")
    .describe("Format of output ('ascii', 'markdown', or 'json')."),
};
