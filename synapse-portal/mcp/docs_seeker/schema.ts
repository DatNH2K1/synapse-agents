import { z } from "zod";

export const fetchOnlineDocsSchema = {
  query: z
    .string()
    .describe(
      'The user query or library name to search for (e.g. "Next.js docs" or "better-auth").',
    ),
};

export const analyzeLlmsTxtSchema = {
  content: z
    .string()
    .describe("Raw content of the llms.txt file to analyze."),
};
