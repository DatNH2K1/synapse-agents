import { z } from "zod";

export const analyzeDistillationSourcesSchema = {
  sources: z
    .array(z.string())
    .describe(
      "List of file paths, directories, or glob patterns to analyze.",
    ),
};
