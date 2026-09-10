interface FetchDocsResult {
  success: boolean;
  source?: string;
  url?: string;
  content?: string;
  topicSpecific?: boolean;
  error?: string;
  urls?: string[];
  suggestion?: string;
}

interface TopicInfo {
  isTopicSpecific: boolean;
  library: string;
  topic?: string;
}

function detectTopic(query: string): TopicInfo | null {
  const q = query.trim();

  // Pattern: "how to do X in Y" or "X in Y"
  const inPattern = /^(?:how to\s+)?(.+?)\s+(?:in|with|using)\s+([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)$/i;
  const inMatch = q.match(inPattern);
  if (inMatch) {
    return {
      isTopicSpecific: true,
      library: inMatch[2].trim(),
      topic: inMatch[1].trim(),
    };
  }

  // Pattern: "Y X" e.g. "Next.js routing"
  const knownPrefixes = [
    "next.js",
    "nextjs",
    "remix",
    "astro",
    "shadcn",
    "shadcn/ui",
    "better-auth",
    "prisma",
    "tailwind",
    "react",
    "vue",
    "svelte",
  ];

  for (const prefix of knownPrefixes) {
    if (q.toLowerCase().startsWith(prefix) && q.length > prefix.length + 1) {
      const topic = q.slice(prefix.length).trim();
      return {
        isTopicSpecific: true,
        library: prefix,
        topic,
      };
    }
  }

  return null;
}

function buildContext7Url(library: string, topic?: string): string {
  let basePath: string;
  if (library.includes("/")) {
    basePath = library;
  } else {
    const normalized = library.toLowerCase().replace(/[^a-z0-9-]/g, "");
    basePath = `websites/${normalized}`;
  }

  const baseUrl = `https://context7.com/${basePath}/llms.txt`;
  if (topic) {
    return `${baseUrl}?topic=${encodeURIComponent(topic)}`;
  }
  return baseUrl;
}

function getUrlVariations(library: string, topic?: string): string[] {
  const urls: string[] = [];
  const knownRepos: Record<string, string> = {
    "next.js": "vercel/next.js",
    nextjs: "vercel/next.js",
    remix: "remix-run/remix",
    astro: "withastro/astro",
    shadcn: "shadcn-ui/ui",
    "shadcn/ui": "shadcn-ui/ui",
    "better-auth": "better-auth/better-auth",
  };

  const normalized = library.toLowerCase();
  const repo = knownRepos[normalized] || library;

  if (topic) {
    urls.push(buildContext7Url(repo, topic));
  }
  urls.push(buildContext7Url(repo));
  return urls;
}

async function httpsGet(url: string, apiKey?: string): Promise<string | null> {
  const headers: Record<string, string> = {
    "User-Agent": "Synapse-Portal/1.0",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (res.status === 200) {
      return await res.text();
    }
    if (res.status === 404) {
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchOnlineDocs(query: string): Promise<string> {
  try {
    const apiKey = process.env.CONTEXT7_API_KEY;
    const topicInfo = detectTopic(query);
    let urls: string[] = [];

    if (topicInfo?.isTopicSpecific) {
      urls = getUrlVariations(topicInfo.library, topicInfo.topic);
    } else {
      const docMatch = query.match(
        /(?:documentation|docs|guide)\s+(?:for\s+)?(.+)/i,
      );
      if (docMatch) {
        const library = docMatch[1].trim();
        urls = getUrlVariations(library);
      } else {
        urls = getUrlVariations(query);
      }
    }

    for (const url of urls) {
      const content = await httpsGet(url, apiKey);
      if (content) {
        const result: FetchDocsResult = {
          success: true,
          source: "context7.com",
          url,
          content,
          topicSpecific: url.includes("?topic="),
        };
        return JSON.stringify(result, null, 2);
      }
    }

    const failureResult: FetchDocsResult = {
      success: false,
      source: "context7.com",
      error: "Documentation not found on context7.com",
      urls,
      suggestion: "Try repository analysis or web search",
    };
    return JSON.stringify(failureResult, null, 2);
  } catch (error) {
    return JSON.stringify(
      {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : String(error)}`,
      },
      null,
      2,
    );
  }
}

export function analyzeLlmsTxt(content: string): string {
  try {
    const lines = content.split("\n");
    const urls: Array<{ url: string; title: string; priority: string }> = [];

    const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

    for (const line of lines) {
      let match;
      while ((match = urlRegex.exec(line)) !== null) {
        const title = match[1];
        const url = match[2];
        let priority = "medium";

        const lowerLine = line.toLowerCase();
        if (
          lowerLine.includes("core") ||
          lowerLine.includes("getting started") ||
          lowerLine.includes("overview") ||
          lowerLine.includes("guide")
        ) {
          priority = "high";
        } else if (
          lowerLine.includes("api") ||
          lowerLine.includes("reference")
        ) {
          priority = "medium";
        } else if (
          lowerLine.includes("example") ||
          lowerLine.includes("community")
        ) {
          priority = "low";
        }

        urls.push({ url, title, priority });
      }
    }

    const highPriority = urls.filter((u) => u.priority === "high");
    const mediumPriority = urls.filter((u) => u.priority === "medium");
    const lowPriority = urls.filter((u) => u.priority === "low");

    const result = {
      total_urls: urls.length,
      distribution: {
        high_priority: highPriority.length,
        medium_priority: mediumPriority.length,
        low_priority: lowPriority.length,
      },
      recommended_agent_allocation: {
        primary_agent_docs: highPriority.slice(0, 5),
        research_subagents_docs: mediumPriority.slice(0, 10),
      },
      all_urls: urls,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify(
      {
        success: false,
        error: `Exception: ${error instanceof Error ? error.message : String(error)}`,
      },
      null,
      2,
    );
  }
}
