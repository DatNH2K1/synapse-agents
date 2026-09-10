import { z } from "zod";

export const indexRepositorySchema = {
  repo_path: z
    .string()
    .describe(
      "The absolute or relative path to the repository directory to index.",
    ),
  repo_name: z
    .string()
    .optional()
    .describe(
      "Optional custom repository name. Defaults to the folder name of the repo_path.",
    ),
};

export const queryRepositoryIndexSchema = {
  repo_name: z
    .string()
    .describe(
      "Name of the repository to query (e.g. 'synapse-portal', 'synapse-plugin').",
    ),
  file_path: z
    .string()
    .optional()
    .describe(
      "Optional path to a specific file to get details (dependencies, dependents, symbols).",
    ),
};
