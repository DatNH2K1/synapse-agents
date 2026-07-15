# Configuration & Execution Policies

### 1. Prerequisite: Read & Apply Config from config.toml

To obtain system and environment settings, the agent MUST read the generated configuration file at `../config.toml` (relative to the rules directory) and use its values. DO NOT attempt to read `.env` files directly to avoid exposing sensitive keys (such as `GEMINI_API_KEY` or `POSTGRES_PASSWORD`).

When interacting, you must read `../config.toml` and map the placeholders as follows:

- `{user_name}`: Use the value of `user_name` (e.g., greet the user with this name).
- `{communication_language}`: Use the value of `communication_language` for all user-facing chat and prompts.
- `{document_output_language}`: Use the value of `document_output_language` for generating any documents or text files.

If the file does not exist or needs to be updated, run the render script first:

```bash
python3 scripts/render_config.py
```

### 2. Execution Policy: Prefer Docker in Target Repos

When using a skill to work on another repository, verify Docker in that target repository before running development commands. If the target repo has Docker available and the relevant service/container can be reached, prefer containerized execution over running the same command directly on the host.

- Use `docker compose exec` for app commands when the target service container is running.
- Use the target repo's `docker compose up` / `docker compose -f ... up` flow for local stacks instead of starting host-side processes when the repo already supports Docker.
- Fall back to host execution only when Docker is unavailable in the target repo, the container is not running, or the task explicitly requires host-only tooling.
- Keep the decision local to the target repo: check Docker first, then choose the shortest safe path for the command you need to run.
