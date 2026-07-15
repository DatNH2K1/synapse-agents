import { GoogleGenerativeAI } from "@google/generative-ai";

export class AIService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async synthesizeKnowledge(
    nodes: { label: string; content: string }[],
  ): Promise<{
    label: string;
    content: string;
    reason: string;
  }> {
    if (!process.env.GEMINI_API_KEY) {
      return {
        label: nodes[0]?.label || "Merged Node",
        content: nodes.map((n) => n.content).join("\n\n---\n\n"),
        reason: "Manual merge: No API key for AI synthesis.",
      };
    }

    const modelName = process.env.GEMINI_MODEL;
    if (!modelName) {
      throw new Error("GEMINI_MODEL environment variable is not defined");
    }
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" },
    });

    const nodesDescription = nodes
      .map((n, i) => `Node ${i + 1}:\nLabel: ${n.label}\nContent: ${n.content}`)
      .join("\n\n");

    const prompt = `
You are a Senior Knowledge Architect. Your task is to merge multiple overlapping knowledge nodes into a single, highly optimized, concise, and atomic master node.

### Source Nodes to Merge:
${nodesDescription}

### Instructions for Merging:
1. **Strict Conciseness & Compression**: Keep the merged content as short and direct as possible. Avoid any introductions, warm-ups, summaries, conclusions, or filler sentences. Get straight to the core technical or business facts.
2. **Preserve Simplicity**: If the source nodes are simple and short, the merged node MUST remain simple and short. Do NOT inflate the content or add unnecessary structure. A simple merge of 2 simple sentences should result in a single simple sentence or 2 brief bullets, not an article.
3. **Format**: Use clean, modern, and minimal markdown (e.g. bolding key terms, simple bullet points, or code blocks if present in source nodes). Do not use excessive headers.
4. **Concise Label**: Create a direct, high-impact, professional title (e.g., "Docker volume mount decoupling" rather than "How to decouple docker volumes to solve host issues").
5. **Brief Reason**: Write a one-sentence professional rationale explaining why these nodes were merged.

Output your response as a JSON object matching this schema:
{
  "label": "Concise, professional title",
  "content": "Atomic, compressed, minimal markdown content",
  "reason": "Single-sentence professional merge justification"
}
`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      let cleanText = text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("[AIService] Synthesis error:", e);
      return {
        label: nodes[0]?.label || "Merged Node",
        content: nodes.map((n) => n.content).join("\n\n---\n\n"),
        reason: "Failed to synthesize content automatically.",
      };
    }
  }
}

export const aiService = new AIService();
