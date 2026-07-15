import json
from .fetch_docs import fetch_docs
from .analyze_llms_txt import analyze_llms_txt as analyze_llms_txt_logic


def fetch_online_docs(query: str) -> str:
    """
    Fetch documentation (like llms.txt) for a given query or library from context7.com.

    Args:
        query: The user query or library name to search for (e.g. "Next.js docs" or "better-auth").

    Returns:
        The fetched documentation JSON string or an error response.
    """
    try:
        result = fetch_docs(query)
        return json.dumps(result, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": f"Exception: {str(e)}"}, indent=2)


def analyze_llms_txt(content: str) -> str:
    """
    Analyze llms.txt content to extract URLs, prioritize them, and suggest optimal agent distribution.

    Args:
        content: Raw content of the llms.txt file to analyze.

    Returns:
        JSON string containing the analyzed URLs, priorities, and suggested agent distribution.
    """
    try:
        result = analyze_llms_txt_logic(content)
        return json.dumps(result, indent=2, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": f"Exception: {str(e)}"}, indent=2)
