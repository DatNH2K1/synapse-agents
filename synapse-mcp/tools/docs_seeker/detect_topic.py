import re
import os

DEBUG = os.environ.get("DEBUG") == "true"

# Topic-specific query patterns
TOPIC_PATTERNS = [
    # "How do I use X in Y?"
    re.compile(
        r"how (?:do i|to|can i) (?:use|implement|add|setup|configure) (?:the )?(.+?) (?:in|with|for) (.+)",
        re.IGNORECASE,
    ),
    # "Y X strategies/patterns" - e.g., "Next.js caching strategies"
    re.compile(
        r"(.+?) (.+?) (?:strategies|patterns|techniques|methods|approaches)",
        re.IGNORECASE,
    ),
    # "X Y documentation" or "Y X docs"
    re.compile(r"(.+?) (.+?) (?:documentation|docs|guide|tutorial)", re.IGNORECASE),
    # "Using X with Y"
    re.compile(r"using (.+?) (?:with|in|for) (.+)", re.IGNORECASE),
    # "Y X guide/implementation/setup"
    re.compile(
        r"(.+?) (.+?) (?:guide|implementation|setup|configuration)", re.IGNORECASE
    ),
    # "Implement X in Y"
    re.compile(r"implement(?:ing)? (.+?) (?:in|with|for|using) (.+)", re.IGNORECASE),
]

# General library query patterns (non-topic specific)
GENERAL_PATTERNS = [
    re.compile(r"(?:documentation|docs) for (.+)", re.IGNORECASE),
    re.compile(r"(.+?) (?:getting started|quick ?start|introduction)", re.IGNORECASE),
    re.compile(r"(?:how to use|learn) (.+)", re.IGNORECASE),
    re.compile(r"(.+?) (?:api reference|overview|basics)", re.IGNORECASE),
]


def normalize_topic(topic: str) -> str:
    """Normalize topic keyword."""
    t = topic.lower().strip()
    t = re.sub(r"[^a-z0-9\s-]", "", t)  # Remove special chars
    t = re.sub(r"\s+", "-", t)  # Replace spaces with hyphens
    parts = t.split("-")
    if parts:
        t = parts[0]  # Take first word for multi-word topics
    return t[:20]  # Limit length


def normalize_library(library: str) -> str:
    """Normalize library name."""
    normalized = library.lower().strip()
    normalized = re.sub(r"[^a-z0-9\s\-\/\.]", "", normalized)
    return re.sub(r"\s+", "-", normalized)


def detect_topic(query: str) -> dict | None:
    """Detect if query is topic-specific or general."""
    if not query or not isinstance(query, str):
        return None

    trimmed_query = query.strip()

    # Check general patterns first
    for pattern in GENERAL_PATTERNS:
        if pattern.search(trimmed_query):
            if DEBUG:
                print("[DEBUG] Matched general pattern, no topic")
            return None

    # Check topic-specific patterns
    for i, pattern in enumerate(TOPIC_PATTERNS):
        match = pattern.search(trimmed_query)
        if match:
            groups = match.groups()
            term1, term2 = groups[0], groups[1]

            # Determine which is library and which is topic based on pattern index
            # For pattern 1 (strategies/patterns), term1 is library, term2 is topic
            if i == 1:
                topic = normalize_topic(term2)
                library = normalize_library(term1)
            else:
                # For other patterns, term1 is topic, term2 is library
                topic = normalize_topic(term1)
                library = normalize_library(term2)

            if DEBUG:
                print("[DEBUG] Matched topic pattern")
                print(f"[DEBUG] Topic: {topic}")
                print(f"[DEBUG] Library: {library}")

            return {
                "query": trimmed_query,
                "topic": topic,
                "library": library,
                "isTopicSpecific": True,
            }

    if DEBUG:
        print("[DEBUG] No pattern matched, treating as general")
    return None
