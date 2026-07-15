import subprocess
import sys
from pathlib import Path

# Paths relative to the project structure
LOGIC_DIR = Path(__file__).resolve().parent / "skills_logic"
DESIGN_SYSTEM_SCRIPT = LOGIC_DIR / "design_suite" / "ui_ux" / "design_system.py"


def generate_design_system_recommendation(
    query: str, project_name: str = "", format_type: str = "markdown"
) -> str:
    """
    Generate comprehensive design system recommendations based on a UI concept and styles database.

    Args:
        query: UI concept description (e.g. "SaaS dashboard", "e-commerce checkout").
        project_name: Optional custom project name.
        format_type: Format of output ("ascii" or "markdown").

    Returns:
        Structured recommendation for colors, typography, layout, spacing, and animations.
    """
    if not DESIGN_SYSTEM_SCRIPT.exists():
        return f"❌ Error: Script not found: {DESIGN_SYSTEM_SCRIPT}"

    cmd = [sys.executable, str(DESIGN_SYSTEM_SCRIPT), query, "--format", format_type]
    if project_name:
        cmd.extend(["--project-name", project_name])

    try:
        result = subprocess.run(
            cmd,
            cwd=str(LOGIC_DIR / "design_suite" / "ui_ux"),
            capture_output=True,
            text=True,
            check=False,
        )
        return result.stdout if result.returncode == 0 else f"❌ Error: {result.stderr}"
    except Exception as e:
        return f"❌ Exception: {str(e)}"
