import os
import subprocess
import sys
from pathlib import Path

# Paths relative to the project structure
INDEXER_SCRIPT = Path(__file__).resolve().parent / "repo_indexer" / "index_repo.py"


def index_repository(repo_path: str, repo_name: str = "") -> str:
    """
    Index a codebase/repository to build AST dependencies and sync them to Synapse Portal.

    Args:
        repo_path: The absolute or relative path to the repository directory to index.
        repo_name: Optional custom repository name. Defaults to the folder name of the repo_path.

    Returns:
        A confirmation message or error details from the indexer execution.
    """
    path = Path(repo_path).resolve()
    if not path.exists() or not path.is_dir():
        return f"❌ Error: Path '{repo_path}' does not exist or is not a directory."

    if not INDEXER_SCRIPT.exists():
        return (
            f"❌ Error: Indexer script not found at expected location: {INDEXER_SCRIPT}"
        )

    # Build command arguments
    cmd = [sys.executable, str(INDEXER_SCRIPT), "--path", str(path)]
    if repo_name:
        cmd.extend(["--repo", repo_name])

    try:
        # Run indexer script
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if result.returncode == 0:
            return f"✅ Indexing Successful!\n\nOutput:\n{result.stdout}"
        else:
            return f"❌ Indexing Failed (Exit code {result.returncode}):\n\nStderr:\n{result.stderr}\n\nStdout:\n{result.stdout}"
    except Exception as e:
        return f"❌ Exception running indexer: {str(e)}"


def query_repository_index(repo_name: str, file_path: str = "") -> str:
    """
    Query indexed files, symbols, dependencies, and dependents from the Synapse Portal database.

    Args:
        repo_name: Name of the repository to query (e.g. 'synapse-portal', 'synapse-plugin').
        file_path: Optional path to a specific file to get details (dependencies, dependents, symbols).

    Returns:
        A formatted JSON string containing the query results.
    """
    import urllib.request
    import urllib.parse
    import json

    host = os.getenv("SYNAPSE_PORTAL_HOST", "http://localhost:3100")

    if file_path:
        url = f"{host}/api/indexer/ai/details?repo={urllib.parse.quote(repo_name)}&file={urllib.parse.quote(file_path)}"
    else:
        url = f"{host}/api/indexer/graph?repo={urllib.parse.quote(repo_name)}"

    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            if not data.get("success", False):
                return f"❌ Failed to query repository index: {data.get('error', 'Unknown error')}"

            if file_path:
                return json.dumps(
                    {
                        "repo": data.get("repo"),
                        "file": data.get("file"),
                        "symbols": data.get("symbols"),
                        "dependencies": data.get("dependencies"),
                        "dependents": data.get("dependents"),
                    },
                    indent=2,
                )
            else:
                files_list = [f["path"] for f in data.get("files", [])]
                return json.dumps(
                    {
                        "repo": repo_name,
                        "total_files": len(files_list),
                        "files": files_list,
                    },
                    indent=2,
                )
    except Exception as e:
        return f"❌ Exception querying repository index: {str(e)}"
