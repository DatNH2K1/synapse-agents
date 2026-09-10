import { z } from "zod";

export const listWritingStylesSchema = {};

export const extractWritingStyleSchema = {
  style_name: z
    .string()
    .describe("Name of the style (e.g. 'academic', 'marketing')."),
  output_json: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, formats the output as JSON instead of markdown."),
};
