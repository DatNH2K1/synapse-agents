import subprocess
import sys
from pathlib import Path

# Paths relative to the project structure
LOGIC_DIR = Path(__file__).resolve().parent / "skills_logic"
GENERATE_SCRIPT = LOGIC_DIR / "design_suite" / "ai_artist" / "generate.py"
SEARCH_SCRIPT = LOGIC_DIR / "design_suite" / "ai_artist" / "search.py"


def generate_ai_art(
    concept: str,
    output_path: str,
    mode: str = "search",
    aspect_ratio: str = "1:1",
    model: str = "flash2",
    verbose: bool = False,
    dry_run: bool = False,
) -> str:
    """
    Generate an image using the Nano Banana creative image model and curated prompts database.

    Args:
        concept: The image concept, description, or subject.
        output_path: Path to save the generated image file.
        mode: The generation mode ("search", "creative", "wild", "all").
        aspect_ratio: Aspect ratio of the image (e.g. "1:1", "16:9", "9:16").
        model: Model version to use ("flash2", "flash", "pro").
        verbose: If true, outputs matched prompt templates and reasoning.
        dry_run: If true, only compiles and displays the adapted prompt without calling Gemini.

    Returns:
        Console output of the generation result.
    """
    if not GENERATE_SCRIPT.exists():
        return f"❌ Error: Script not found: {GENERATE_SCRIPT}"

    cmd = [
        sys.executable,
        str(GENERATE_SCRIPT),
        concept,
        "--output",
        output_path,
        "--mode",
        mode,
        "--aspect-ratio",
        aspect_ratio,
        "--model",
        model,
    ]
    if verbose:
        cmd.append("--verbose")
    if dry_run:
        cmd.append("--dry-run")

    try:
        result = subprocess.run(
            cmd,
            cwd=str(LOGIC_DIR / "design_suite" / "ai_artist"),
            capture_output=True,
            text=True,
            check=False,
        )
        return result.stdout if result.returncode == 0 else f"❌ Error: {result.stderr}"
    except Exception as e:
        return f"❌ Exception: {str(e)}"


def search_ai_art_prompts(query: str, domain: str = "awesome") -> str:
    """
    Search the curated art prompt template database for concepts matching a query.

    Args:
        query: Search keywords or concept description.
        domain: Search domain filter ("awesome" or other).

    Returns:
        Matched prompt templates and details from the database.
    """
    if not SEARCH_SCRIPT.exists():
        return f"❌ Error: Script not found: {SEARCH_SCRIPT}"

    cmd = [sys.executable, str(SEARCH_SCRIPT), query, "--domain", domain]
    try:
        result = subprocess.run(
            cmd,
            cwd=str(LOGIC_DIR / "design_suite" / "ai_artist"),
            capture_output=True,
            text=True,
            check=False,
        )
        return result.stdout if result.returncode == 0 else f"❌ Error: {result.stderr}"
    except Exception as e:
        return f"❌ Exception: {str(e)}"
