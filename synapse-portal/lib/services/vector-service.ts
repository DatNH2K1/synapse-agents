import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../db";

const MODEL_NAME = process.env.GEMINI_EMBEDDING_MODEL;

interface SimilarityResult {
  id: string;
  label: string;
  score: number;
}

class VectorService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("[VectorService] No API key, returning null embedding");
      return null;
    }
    if (!MODEL_NAME) {
      console.error(
        "[VectorService] GEMINI_EMBEDDING_MODEL is not defined in .env",
      );
      return null;
    }
    try {
      const model = this.genAI.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.embedContent(text);
      const values = result.embedding.values;
      if (values.length !== 3072) {
        console.warn(
          `[VectorService] Embedding dimension mismatch: expected 3072, got ${values.length}`,
        );
        return null;
      }
      return values;
    } catch (e) {
      console.error("[VectorService] Embedding error:", e);
      return null;
    }
  }

  async findSimilarNodes(
    text: string,
    type: string,
    threshold = 0.8,
    limit = 5,
  ): Promise<SimilarityResult[]> {
    if (!process.env.GEMINI_API_KEY) return [];

    try {
      const embedding = await this.generateEmbedding(text);
      if (!embedding) return [];
      const vectorStr = `[${embedding.join(",")}]`;

      const results = await prisma.$queryRaw<
        { id: string; label: string; score: number }[]
      >`
        SELECT id, label, 1 - (embedding <=> cast(${vectorStr} as vector)) as score 
        FROM "Node" 
        WHERE embedding IS NOT NULL 
        AND status IN ('APPROVED', 'BETA', 'GOLD')
        AND type = ${type}
        AND 1 - (embedding <=> cast(${vectorStr} as vector)) > ${threshold} 
        ORDER BY score DESC 
        LIMIT ${limit}
      `;

      return results.map((r) => ({
        id: r.id,
        label: r.label,
        score: Number(r.score),
      }));
    } catch (e) {
      console.error("[VectorService] Similarity search error:", e);
      return [];
    }
  }

  async findSimilarToNode(
    nodeId: string,
    type: string,
    fallbackText: string,
    threshold = 0.8,
    limit = 5,
  ): Promise<SimilarityResult[]> {
    try {
      // Fetch node properties to get actual content
      const node = await prisma.node.findUnique({
        where: { id: nodeId },
        select: { label: true, properties: true },
      });

      const embeddingCheck = node
        ? await prisma.$queryRaw<{ has_embedding: boolean }[]>`
            SELECT (embedding IS NOT NULL) as has_embedding FROM "Node" WHERE id = cast(${nodeId} as uuid)
          `
        : [];
      const hasEmbedding = embeddingCheck[0]?.has_embedding || false;

      let content = "";
      try {
        const props = JSON.parse(node?.properties || "{}");
        content = props.content || "";
      } catch (err) {
        console.error(
          "[VectorService] Failed to parse node properties",
          nodeId,
          err,
        );
      }
      const fullText = node ? `${node.label}\n${content}` : fallbackText;

      if (hasEmbedding) {
        // Use DB-side vector comparison (very fast, no API call)
        const results = await prisma.$queryRaw<
          { id: string; label: string; score: number }[]
        >`
          SELECT id, label, 1 - (embedding <=> (SELECT embedding FROM "Node" WHERE id = cast(${nodeId} as uuid))) as score 
          FROM "Node" 
          WHERE embedding IS NOT NULL 
          AND status IN ('APPROVED', 'BETA', 'GOLD')
          AND type = ${type}
          AND id != cast(${nodeId} as uuid)
          AND 1 - (embedding <=> (SELECT embedding FROM "Node" WHERE id = cast(${nodeId} as uuid))) > ${threshold} 
          ORDER BY score DESC 
          LIMIT ${limit}
        `;

        return results.map((r) => ({
          id: r.id,
          label: r.label,
          score: Number(r.score),
        }));
      }

      // Fallback to text-based search (calls Gemini)
      return this.findSimilarNodes(fullText, type, threshold, limit);
    } catch (e) {
      console.error("[VectorService] findSimilarToNode error:", nodeId, e);
      return this.findSimilarNodes(fallbackText, type, threshold, limit);
    }
  }

  async updateNodeEmbedding(nodeId: string, text: string): Promise<boolean> {
    try {
      const embedding = await this.generateEmbedding(text);
      if (!embedding) {
        // Set embedding to NULL if it failed to generate or API key missing
        await prisma.$executeRaw`
          UPDATE "Node" SET embedding = NULL, "embeddingModel" = NULL WHERE id = cast(${nodeId} as uuid)
        `;
        return false;
      }
      const vectorStr = `[${embedding.join(",")}]`;

      await prisma.$executeRaw`
        UPDATE "Node" SET embedding = cast(${vectorStr} as vector), "embeddingModel" = ${MODEL_NAME} WHERE id = cast(${nodeId} as uuid)
      `;
      return true;
    } catch (e) {
      console.error("[VectorService] Update embedding error:", nodeId, e);
      return false;
    }
  }
}

export const vectorService = new VectorService();
