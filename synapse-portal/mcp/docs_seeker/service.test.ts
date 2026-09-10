import { describe, it, expect } from "vitest";
import { analyzeLlmsTxt } from "./index";

describe("Docs Seeker Tool Module", () => {
  it("should parse llms.txt and categorize urls by priority", () => {
    const sampleLlms = `
# Next.js Documentation
- [Overview and Getting Started](https://nextjs.org/docs)
- [API Reference](https://nextjs.org/docs/api-reference)
- [Community Examples](https://github.com/vercel/next.js/examples)
    `;
    const result = analyzeLlmsTxt(sampleLlms);
    const parsed = JSON.parse(result);
    expect(parsed.total_urls).toBe(3);
    expect(parsed.distribution.high_priority).toBe(1);
    expect(parsed.distribution.medium_priority).toBe(1);
    expect(parsed.distribution.low_priority).toBe(1);
  });
});
