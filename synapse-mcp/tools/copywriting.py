import subprocess
import sys
from pathlib import Path

# Paths relative to the project structure
LOGIC_DIR = Path(__file__).resolve().parent / "skills_logic"
EXTRACT_STYLES_SCRIPT = LOGIC_DIR / "copywriting" / "extract-writing-styles.py"


def list_writing_styles() -> str:
    """
    List all available writing style template files inside assets/writing-styles/.

    Returns:
        Markdown table of available styles and sizes.
    """
    if not EXTRACT_STYLES_SCRIPT.exists():
        return f"❌ Error: Script not found: {EXTRACT_STYLES_SCRIPT}"

    cmd = [sys.executable, str(EXTRACT_STYLES_SCRIPT), "--list"]
    try:
        result = subprocess.run(
            cmd,
            cwd=str(LOGIC_DIR / "copywriting"),
            capture_output=True,
            text=True,
            check=False,
        )
        return result.stdout if result.returncode == 0 else f"❌ Error: {result.stderr}"
    except Exception as e:
        return f"❌ Exception: {str(e)}"


def extract_writing_style(style_name: str, output_json: bool = False) -> str:
    """
    Extract writing style characteristics from a specific style template file in assets/writing-styles/.

    Args:
        style_name: Name of the style (e.g. "academic", "marketing").
        output_json: If true, formats the output as JSON instead of markdown.

    Returns:
        Structured style analysis containing tone, vocabulary, sentence structure, formatting patterns.
    """
    if not EXTRACT_STYLES_SCRIPT.exists():
        return f"❌ Error: Script not found: {EXTRACT_STYLES_SCRIPT}"

    cmd = [sys.executable, str(EXTRACT_STYLES_SCRIPT), "--style", style_name]
    if output_json:
        cmd.append("--json")

    try:
        result = subprocess.run(
            cmd,
            cwd=str(LOGIC_DIR / "copywriting"),
            capture_output=True,
            text=True,
            check=False,
        )
        return result.stdout if result.returncode == 0 else f"❌ Error: {result.stderr}"
    except Exception as e:
        return f"❌ Exception: {str(e)}"
