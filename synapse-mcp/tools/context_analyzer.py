import json
from pathlib import Path
from tools.skills_logic.context_engineering.context_analyzer import (
    analyze_context,
    calculate_budget,
    load_json_file,
)


def analyze_context_health(context_file_path: str, token_limit: int = 128000) -> str:
    """
    Analyze the health, token utilization, degradation risk, and attention budget of an agent's context.

    Args:
        context_file_path: Absolute or relative path to a JSON file containing the message history/context.
        token_limit: The total token limit of the model (default: 128000).

    Returns:
        JSON string containing the health status, score, degradation risk, and recommendations.
    """
    path = Path(context_file_path).resolve()
    if not path.exists():
        return f"❌ Error: File not found: {context_file_path}"

    try:
        data = load_json_file(str(path))
        messages = data if isinstance(data, list) else data.get("messages", [])
        result = analyze_context(messages, token_limit)
        return json.dumps(
            {
                "total_tokens": result.total_tokens,
                "token_limit": result.token_limit,
                "utilization": f"{result.utilization:.1%}",
                "health_status": result.health_status.value,
                "health_score": f"{result.health_score:.2f}",
                "degradation_risk": f"{result.degradation_risk:.2f}",
                "poisoning_risk": f"{result.poisoning_risk:.2f}",
                "recommendations": result.recommendations,
            },
            indent=2,
            ensure_ascii=False,
        )
    except Exception as e:
        return f"❌ Error analyzing context: {str(e)}"


def calculate_context_budget(
    system_tokens: int = 2000,
    tools_tokens: int = 1500,
    docs_tokens: int = 3000,
    history_tokens: int = 5000,
    buffer_percentage: float = 0.15,
) -> str:
    """
    Calculate and suggest a context/token budget allocation for system prompts, tools, documents, and history.

    Args:
        system_tokens: Estimated tokens for system prompts.
        tools_tokens: Estimated tokens for tool definitions.
        docs_tokens: Estimated tokens for retrieved docs/reference documents.
        history_tokens: Estimated tokens for message history.
        buffer_percentage: Safety buffer percentage (0.0 to 1.0).

    Returns:
        JSON string containing the calculated token budgets and warnings.
    """
    try:
        result = calculate_budget(
            system_tokens, tools_tokens, docs_tokens, history_tokens, buffer_percentage
        )
        return json.dumps(result, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"❌ Error calculating budget: {str(e)}"
