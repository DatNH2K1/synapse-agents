import subprocess
import sys
from pathlib import Path
from typing import List

# Paths relative to the project structure
LOGIC_DIR = Path(__file__).resolve().parent / "skills_logic"
ANALYZE_SOURCES_SCRIPT = LOGIC_DIR / "distillator" / "analyze_sources.py"


def analyze_distillation_sources(inputs: List[str]) -> str:
    """
    Analyze input source documents/folders/globs to compute token estimates and recommend distillation routing.

    Args:
        inputs: List of paths (files, directories, or globs) to analyze.

    Returns:
        JSON string summarizing files, estimated tokens, routing recommendation, and groupings.
    """
    if not ANALYZE_SOURCES_SCRIPT.exists():
        return f"❌ Error: Script not found: {ANALYZE_SOURCES_SCRIPT}"

    cmd = [sys.executable, str(ANALYZE_SOURCES_SCRIPT)] + inputs
    try:
        result = subprocess.run(
            cmd,
            cwd=str(LOGIC_DIR / "distillator"),
            capture_output=True,
            text=True,
            check=False,
        )
        return result.stdout if result.returncode == 0 else f"❌ Error: {result.stderr}"
    except Exception as e:
        return f"❌ Exception: {str(e)}"
