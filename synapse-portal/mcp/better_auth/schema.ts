import { z } from "zod";

export const initBetterAuthSchema = {
  db_type: z
    .string()
    .describe(
      "One of 'sqlite', 'mysql', 'postgresql', 'drizzle', 'prisma', 'kysely', 'mongodb'.",
    ),
  auth_methods: z
    .array(z.string())
    .describe(
      "Selected authentication methods (e.g. ['email', 'github', 'google', 'discord', '2fa', 'passkey', 'magic_link', 'username']).",
    ),
  project_path: z
    .string()
    .optional()
    .default(".")
    .describe("Root path of the project."),
};
