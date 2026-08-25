# Changelog

All notable changes to this project will be documented in this file.

## main

### Overview

- Restructured code analysis and security auditing skills into a unified `synapse-code-scan` Master Skill suite with specialized sub-skills for SonarQube inspection, Trivy image scanning, vulnerability remediation, and container hardening.

### NEW FEATURES

- Introduced the `synapse-code-scan` Master Skill in `synapse-plugin/.agents/skills/synapse-code-scan/SKILL.md` to coordinate static analysis, security scans, and remediation workflows.
- Added `synapse-sonarqube-scan` sub-skill in `references/sonarqube-scan/SKILL.md` providing automated workflows for local SonarQube Docker setup, scan execution, and SonarQube MCP tool integrations (`search_sonar_issues_in_projects`, `get_project_quality_gate_status`, `search_security_hotspots`, `change_sonar_issue_status`).
- Added `synapse-trivy-scan` sub-skill in `references/trivy-scan/SKILL.md` tailored for production Dockerfile discovery, clean `--no-cache` builds with `:scan` tags, and unfiltered vulnerability audits.
- Added `synapse-vulnerability-remediation` sub-skill in `references/vulnerability-remediation/SKILL.md` covering language dependency patches (npm, pip, poetry, go) and OS-level package upgrades inside Dockerfiles.
- Added `synapse-container-hardening` sub-skill in `references/container-hardening/SKILL.md` defining multi-stage build standards, non-root user execution, and verification loops.

### CONFIGURATION CHANGES

- Added `SYNAPSE_SONARQUBE_PORT` support in `render_config.ts`, generating a dedicated `[sonarqube]` table in `config.toml` for configurable local SonarQube port mapping and host routing.

### IMPROVEMENTS

- Replaced standalone `synapse-security-check` with the comprehensive `synapse-code-scan` suite.
- Promoted `synapse-party-mode` skill from a nested sub-skill of `synapse-agent-coordination` to a top-level skill in `synapse-plugin/.agents/skills/synapse-party-mode/SKILL.md`.
- Updated `synapse-plugin/.agents/skills/synapse-agent-coordination/SKILL.md` to remove the nested sub-skill entry for Party Mode.
- Removed all hardcoded absolute `file:///Users/...` paths in `SKILL.md` files across all skills and replaced them with relative paths.
- Updated `changelog-guidelines.md` rules to globally prohibit using absolute paths in any code, configuration, or markdown files.
- Added BMAD Method attribution to `README.md` under the Acknowledgements section to credit their open-source AI development workflows and role-based structures.
- Created a global project `LICENSE` file under the MIT License, incorporating the required third-party MIT License copyright notice for BMAD Method components.

## feat/skill_pixel_art

### NEW FEATURES

- Added background removal capability to the `slice_spritesheet_to_gifs` tool, which automatically detects the background color from the top-left pixel `(0, 0)` and keys it out.
- Automated state frame mapping inside `slice_spritesheet_to_gifs` by removing the manual `states` parameter and automatically compiling all grid frames into a clean animated GIF named after the source file's base name.

### IMPROVEMENTS

- Integrated the smart dynamic bounding-box slicing and customized frame selection directly into the `slice_spritesheet_to_gifs` MCP tool on the `synapse-portal` server, introducing `smart_slice` and `select_frames` parameters.
- Added a **Frame Boundaries and Padding (Prevent Clipping)** guideline to `SKILL.md` to ensure the generated characters remain perfectly centered with generous safety margins, preventing limbs, weapons, or special effects from spilling over cell boundaries or being cut off during slicing.
- Updated `pixel-art-sprites` skill guidelines in `SKILL.md` to strongly enforce single-row layouts, preventing AI models from generating multi-row grids, and updated the prompt template to explicitly forbid vertical stacking or grid configurations (such as 2x2 or 3x3 grids).
- Updated `pixel-art-sprites` skill guidelines in `SKILL.md` to enforce a single uniform background color (preferably pure green `#00ff00` or magenta `#ff00ff`) and visual consistency via base-state reference images when generating subsequent animation states.
- Enhanced the visual consistency rules in `SKILL.md` by defining a **strict prompt template** format to keep character core descriptions (armor, clothing, weapons, colors) 100% identical and verbatim across all generation prompts.
- Added a guideline to `SKILL.md` for handling 429 errors, enforcing that the agent must report the error and ask for user permission before switching to MCP tools.

### CONFIGURATION CHANGES

- Added `Pillow` dependency to `synapse-mcp/requirements.txt` to resolve `ModuleNotFoundError: No module named 'PIL'` during startup of the `synapse-portal` MCP server.
