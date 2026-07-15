import re

PRIORITY_KEYWORDS = {
    "critical": [
        "getting-started",
        "quick-start",
        "quickstart",
        "introduction",
        "intro",
        "overview",
        "installation",
        "install",
        "setup",
        "basics",
        "core-concepts",
        "fundamentals",
    ],
    "supplementary": [
        "advanced",
        "internals",
        "migration",
        "migrate",
        "troubleshooting",
        "troubleshoot",
        "faq",
        "frequently-asked",
        "changelog",
        "contributing",
        "contribute",
    ],
    "important": [
        "guide",
        "tutorial",
        "example",
        "api-reference",
        "api",
        "reference",
        "configuration",
        "config",
        "routing",
        "route",
        "data-fetching",
        "authentication",
        "auth",
    ],
}


def categorize_url(url: str) -> str:
    """Categorize URL by priority."""
    url_lower = url.lower()
    priorities = ["critical", "supplementary", "important"]
    for priority in priorities:
        keywords = PRIORITY_KEYWORDS[priority]
        for keyword in keywords:
            if keyword in url_lower:
                return priority
    return "important"  # Default


def parse_urls(content: str) -> list:
    """Parse llms.txt content to extract URLs."""
    if not content or not isinstance(content, str):
        return []
    urls = []
    lines = content.split("\n")
    for line in lines:
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#"):
            continue
        # Extract URLs (look for http/https)
        url_match = re.search(r"https?://[^\s<>\"]+", trimmed, re.IGNORECASE)
        if url_match:
            urls.append(url_match.group(0))
    return urls


def group_by_priority(urls: list) -> dict:
    """Group URLs by priority."""
    groups = {
        "critical": [],
        "important": [],
        "supplementary": [],
    }
    for url in urls:
        priority = categorize_url(url)
        groups[priority].append(url)
    return groups


def suggest_agent_distribution(url_count: int) -> dict:
    """Suggest optimal agent distribution."""
    if url_count <= 3:
        return {
            "agentCount": 1,
            "strategy": "single",
            "urlsPerAgent": url_count,
            "description": "Single agent can handle all URLs",
        }
    elif url_count <= 10:
        agents = min((url_count + 1) // 2, 5)
        return {
            "agentCount": agents,
            "strategy": "parallel",
            "urlsPerAgent": (url_count + agents - 1) // agents,
            "description": f"Deploy {agents} agents in parallel",
        }
    elif url_count <= 20:
        return {
            "agentCount": 7,
            "strategy": "parallel",
            "urlsPerAgent": (url_count + 6) // 7,
            "description": "Deploy 7 agents with balanced workload",
        }
    else:
        return {
            "agentCount": 7,
            "strategy": "phased",
            "urlsPerAgent": (url_count + 6) // 7,
            "phases": 2,
            "description": "Use two-phase approach: critical first, then important",
        }


def analyze_llms_txt(content: str) -> dict:
    """Analyze llms.txt content."""
    urls = parse_urls(content)
    grouped = group_by_priority(urls)
    distribution = suggest_agent_distribution(len(urls))
    return {
        "totalUrls": len(urls),
        "urls": urls,
        "grouped": grouped,
        "distribution": distribution,
        "summary": {
            "critical": len(grouped["critical"]),
            "important": len(grouped["important"]),
            "supplementary": len(grouped["supplementary"]),
        },
    }
