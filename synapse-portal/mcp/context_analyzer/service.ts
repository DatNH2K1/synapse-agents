import * as fs from "fs";
import * as path from "path";

enum HealthStatus {
  HEALTHY = "healthy",
  WARNING = "warning",
  DEGRADED = "degraded",
  CRITICAL = "critical",
}

interface ContextAnalysis {
  total_tokens: number;
  token_limit: number;
  utilization: string;
  health_status: HealthStatus;
  health_score: string;
  degradation_risk: string;
  poisoning_risk: string;
  recommendations: string[];
}

function estimateTokens(text: string): number {
  return Math.floor(text.length / 4);
}

function estimateMessageTokens(messages: unknown[]): number {
  let total = 0;
  for (const msg of messages) {
    if (typeof msg === "object" && msg !== null) {
      const record = msg as Record<string, unknown>;
      const content = record.content ?? "";
      total += estimateTokens(String(content));
      total += 10; // Overhead for metadata/role
    } else {
      total += estimateTokens(String(msg));
    }
  }
  return total;
}

function detectLostInMiddle(
  messages: unknown[],
  criticalKeywords: string[],
): Array<{
  position: number;
  position_pct: string;
  keyword: string;
  risk: "high" | "medium";
}> {
  if (!messages || messages.length === 0) return [];
  const total = messages.length;
  const warnings: Array<{
    position: number;
    position_pct: string;
    keyword: string;
    risk: "high" | "medium";
  }> = [];

  for (let i = 0; i < total; i++) {
    const position = i / total;
    const msg = messages[i];
    const content = String(
      typeof msg === "object" && msg !== null && "content" in msg
        ? (msg as { content?: unknown }).content ?? ""
        : msg,
    );

    if (position > 0.1 && position < 0.9) {
      for (const keyword of criticalKeywords) {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          warnings.push({
            position: i,
            position_pct: `${(position * 100).toFixed(1)}%`,
            keyword,
            risk: position > 0.3 && position < 0.7 ? "high" : "medium",
          });
        }
      }
    }
  }
  return warnings;
}

function detectPoisoningPatterns(messages: unknown[]): {
  error_density: number;
  contradiction_count: number;
  poisoning_risk: number;
} {
  const errorPatterns = [
    /\berror\b/i,
    /\bfailed\b/i,
    /\bexception\b/i,
    /\bcannot\b/i,
    /\bunable\b/i,
    /\binvalid\b/i,
    /\bnot found\b/i,
    /\bundefined\b/i,
    /\bnull\b/i,
  ];

  const contradictionKeywords: Array<[string, string]> = [
    ["is correct", "is not correct"],
    ["should work", "should not work"],
    ["will succeed", "will fail"],
    ["is valid", "is invalid"],
  ];

  const errorsFound: Array<{ position: number; pattern: string }> = [];
  const contradictions: Array<{ position: number; type: string }> = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const content = String(
      typeof msg === "object" && msg !== null && "content" in msg
        ? (msg as { content?: unknown }).content ?? ""
        : msg,
    ).toLowerCase();

    for (const pattern of errorPatterns) {
      if (pattern.test(content)) {
        errorsFound.push({ position: i, pattern: pattern.source });
      }
    }

    for (const [posPhrase, negPhrase] of contradictionKeywords) {
      if (content.includes(posPhrase) && content.includes(negPhrase)) {
        contradictions.push({ position: i, type: "self-contradiction" });
      }
    }
  }

  const total = Math.max(messages.length, 1);
  return {
    error_density: errorsFound.length / total,
    contradiction_count: contradictions.length,
    poisoning_risk: Math.min(
      1.0,
      errorsFound.length * 0.1 + contradictions.length * 0.3,
    ),
  };
}

function calculateHealthScore(
  utilization: number,
  degradationRisk: number,
  poisoningRisk: number,
): number {
  let score = 1.0;
  if (utilization > 0.7) {
    score -= (utilization - 0.7) * 1.5;
  }
  score -= degradationRisk * 0.3;
  score -= poisoningRisk * 0.2;
  return Math.max(0.0, Math.min(1.0, score));
}

function getHealthStatus(score: number): HealthStatus {
  if (score > 0.8) return HealthStatus.HEALTHY;
  if (score > 0.6) return HealthStatus.WARNING;
  if (score > 0.4) return HealthStatus.DEGRADED;
  return HealthStatus.CRITICAL;
}

export function analyzeContextHealth(
  contextFilePath: string,
  tokenLimit: number = 128000,
): string {
  const resolvedPath = path.resolve(contextFilePath);
  if (!fs.existsSync(resolvedPath)) {
    return `❌ Error: File not found: ${contextFilePath}`;
  }

  try {
    const content = fs.readFileSync(resolvedPath, "utf-8");
    const parsed = JSON.parse(content);
    const messages = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.messages)
        ? parsed.messages
        : [];

    const criticalKeywords = ["goal", "task", "important", "critical", "must"];
    const totalTokens = estimateMessageTokens(messages);
    const utilization = totalTokens / tokenLimit;

    const middleWarnings = detectLostInMiddle(messages, criticalKeywords);
    const degradationRisk = Math.min(1.0, middleWarnings.length * 0.2);

    const poisoning = detectPoisoningPatterns(messages);
    const poisoningRisk = poisoning.poisoning_risk;

    const healthScore = calculateHealthScore(
      utilization,
      degradationRisk,
      poisoningRisk,
    );
    const healthStatus = getHealthStatus(healthScore);

    const recommendations: string[] = [];
    if (utilization > 0.8) {
      recommendations.push(
        "URGENT: Context utilization >80%. Trigger compaction immediately.",
      );
    } else if (utilization > 0.7) {
      recommendations.push(
        "WARNING: Context utilization >70%. Plan for compaction.",
      );
    }

    if (middleWarnings.length > 0) {
      recommendations.push(
        `Found ${middleWarnings.length} critical items in middle region. Consider moving to beginning/end.`,
      );
    }

    if (poisoningRisk > 0.3) {
      recommendations.push(
        "High poisoning risk detected. Review recent tool outputs for errors.",
      );
    }

    if (healthStatus === HealthStatus.CRITICAL) {
      recommendations.push(
        "CRITICAL: Consider context reset with clean state.",
      );
    }

    const result: ContextAnalysis = {
      total_tokens: totalTokens,
      token_limit: tokenLimit,
      utilization: `${(utilization * 100).toFixed(1)}%`,
      health_status: healthStatus,
      health_score: healthScore.toFixed(2),
      degradation_risk: degradationRisk.toFixed(2),
      poisoning_risk: poisoningRisk.toFixed(2),
      recommendations,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return `❌ Error analyzing context: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export function calculateContextBudget(
  systemTokens: number = 2000,
  toolsTokens: number = 1500,
  docsTokens: number = 3000,
  historyTokens: number = 5000,
  bufferPercentage: number = 0.15,
): string {
  try {
    const subtotal = systemTokens + toolsTokens + docsTokens + historyTokens;
    const buffer = Math.floor(subtotal * bufferPercentage);
    const total = subtotal + buffer;

    const result = {
      allocation: {
        system_prompt: systemTokens,
        tool_definitions: toolsTokens,
        retrieved_docs: docsTokens,
        message_history: historyTokens,
        reserved_buffer: buffer,
      },
      total_budget: total,
      warning_threshold: Math.floor(total * 0.7),
      critical_threshold: Math.floor(total * 0.8),
      recommendations: [
        `Recommended context window limit: ${Math.ceil(total / 1000)}k tokens`,
        `Safety buffer reserved: ${buffer} tokens (${Math.round(bufferPercentage * 100)}%)`,
        "Compact conversation history when reaching 70% threshold",
      ],
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return `❌ Error calculating budget: ${error instanceof Error ? error.message : String(error)}`;
  }
}
