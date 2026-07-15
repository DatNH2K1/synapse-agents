import os
import urllib.request
import urllib.parse
from tools.docs_seeker.detect_topic import detect_topic

DEBUG = os.environ.get("DEBUG") == "true"
API_KEY = os.environ.get("CONTEXT7_API_KEY")


def https_get(url: str) -> str | None:
    """Make HTTPS GET request."""
    req = urllib.request.Request(url)
    if API_KEY:
        req.add_header("Authorization", f"Bearer {API_KEY}")

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status == 200:
                return response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise e
    except Exception as e:
        raise e
    return None


def build_context7_url(library: str, topic: str = None) -> str:
    """Construct context7.com URL."""
    if "/" in library:
        # GitHub repo format: org/repo
        org, repo = library.split("/", 1)
        base_path = f"{org}/{repo}"
    else:
        # Try common patterns
        normalized = "".join(c for c in library.lower() if c.isalnum() or c == "-")
        base_path = f"websites/{normalized}"

    base_url = f"https://context7.com/{base_path}/llms.txt"
    if topic:
        return f"{base_url}?topic={urllib.parse.quote(topic)}"
    return base_url


def get_url_variations(library: str, topic: str = None) -> list:
    """Try multiple URL variations for a library."""
    urls = []

    # Known repo mappings
    known_repos = {
        "next.js": "vercel/next.js",
        "nextjs": "vercel/next.js",
        "remix": "remix-run/remix",
        "astro": "withastro/astro",
        "shadcn": "shadcn-ui/ui",
        "shadcn/ui": "shadcn-ui/ui",
        "better-auth": "better-auth/better-auth",
    }

    normalized = library.lower()
    repo = known_repos.get(normalized, library)

    # Primary: Try with topic if available
    if topic:
        urls.append(build_context7_url(repo, topic))

    # Fallback: Try without topic
    urls.append(build_context7_url(repo))
    return urls


def fetch_docs(query: str) -> dict:
    """Fetch documentation from context7.com."""
    topic_info = detect_topic(query)

    if DEBUG:
        print(f"[DEBUG] Topic detection result: {topic_info}")

    urls = []
    if topic_info and topic_info.get("isTopicSpecific"):
        # Topic-specific search
        urls = get_url_variations(topic_info["library"], topic_info["topic"])
        if DEBUG:
            print(f"[DEBUG] Topic-specific URLs: {urls}")
    else:
        # Extract library from general query
        import re

        library_match = re.search(
            r"(?:documentation|docs|guide) (?:for )?(.+)", query, re.IGNORECASE
        )
        if library_match:
            library = library_match.group(1).strip()
            urls = get_url_variations(library)
            if DEBUG:
                print(f"[DEBUG] General library URLs: {urls}")
        else:
            # Fallback to query as library name
            urls = get_url_variations(query)

    # Try each URL
    for url in urls:
        if DEBUG:
            print(f"[DEBUG] Trying URL: {url}")
        try:
            content = https_get(url)
            if content:
                return {
                    "success": True,
                    "source": "context7.com",
                    "url": url,
                    "content": content,
                    "topicSpecific": "?topic=" in url,
                }
        except Exception as e:
            if DEBUG:
                print(f"[DEBUG] Failed to fetch {url}: {str(e)}")

    # No URL worked
    return {
        "success": False,
        "source": "context7.com",
        "error": "Documentation not found on context7.com",
        "urls": urls,
        "suggestion": "Try repository analysis or web search",
    }
