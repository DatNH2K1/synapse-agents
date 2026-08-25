---
name: synapse-sonarqube-scan
description: |-
  Static code analysis, code quality auditing, security hotspot detection, and automated remediation workflow using local SonarQube Server and SonarQube MCP tools.

  MANDATORY: Execute when running local SonarQube scans, querying code smells/bugs/vulnerabilities via SonarQube MCP, analyzing security hotspots, or evaluating Quality Gate compliance.

  Trigger immediately for:
    - sonarqube scan
    - sonar local check
    - static code quality analysis
    - check quality gate
    - security hotspots analysis
    - resolve sonarqube issues

  DO NOT trigger for:
    - Container image OS vulnerability scanning (use synapse-trivy-scan).
    - Manual SonarLint IDE installation.
---

# SonarQube Scan & Automated MCP Inspection

This skill provides fully autonomous workflows for initializing local SonarQube container instances, provisioning projects and tokens via Web APIs, running local scans, and utilizing the **SonarQube MCP Server** to query issues, analyze security hotspots, check quality gates, and verify fixes without requiring manual user intervention.

---

## 1. Autonomous SonarQube Lifecycle (Zero Manual Setup)

When requested to scan with SonarQube, the agent must autonomously ensure a SonarQube instance is running and ready:

> [!NOTE]
> Read `port` from the `[sonarqube]` section in `config.toml` (default: `9000`). Substitute this value for `$SONAR_PORT` in all commands below.

### Step A: Check & Start SonarQube Container

1. **Check container status**:
   ```bash
   docker ps -a --filter "name=sonarqube" --format "{{.Status}}"
   ```
2. **Start or create container**:
   - **If not existing**: Proactively run:
     ```bash
     docker run -d --name sonarqube -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -p ${SONAR_PORT:-9000}:9000 sonarqube:community
     ```
   - **If stopped (`Exited`)**: Proactively run:
     ```bash
     docker start sonarqube
     ```

### Step B: Wait for SonarQube Ready

Poll the health endpoint until status returns `UP`:

```bash
until curl -s -u admin:admin http://localhost:${SONAR_PORT:-9000}/api/system/status | grep -q '"status":"UP"'; do sleep 3; done
```

### Step C: Auto-Provision Project & Token via Web API

The agent provisions the project and token automatically using default admin credentials (`admin:admin`):

1. **Create Project** (if not already existing):
   ```bash
   curl -s -u admin:admin -X POST "http://localhost:${SONAR_PORT:-9000}/api/projects/create?project=<PROJECT_KEY>&name=<PROJECT_NAME>"
   ```
2. **Generate Token**:
   ```bash
   TOKEN_RESPONSE=$(curl -s -u admin:admin -X POST "http://localhost:${SONAR_PORT:-9000}/api/user_tokens/generate?name=agent-scan-$(date +%s)")
   SONAR_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
   ```

---

## 2. Execute Local SonarScanner

Run the scanner against the workspace using either Docker CLI or npm package:

### Option A: Docker SonarScanner CLI (Recommended)

```bash
docker run --rm \
    -e SONAR_HOST_URL="http://host.docker.internal:${SONAR_PORT:-9000}" \
    -e SONAR_TOKEN="$SONAR_TOKEN" \
    -v "$(pwd):/usr/src" \
    sonarsource/sonar-scanner-cli \
    -Dsonar.projectKey=<PROJECT_KEY>
```

### Option B: npm / Node.js Scanner

```bash
npm install -D sonarqube-scanner
npx sonar-scanner \
    -Dsonar.host.url=http://localhost:${SONAR_PORT:-9000} \
    -Dsonar.token="$SONAR_TOKEN" \
    -Dsonar.projectKey=<PROJECT_KEY>
```

---

## 3. Automated Inspection via SonarQube MCP Tools

Use the lazy-loaded `sonarqube` MCP server tools (`call_mcp_tool` with `ServerName: "sonarqube"`) to automate issue resolution and validation:

### Step 1: Project Key Discovery

Discover and verify the target project key:

- Call `search_my_sonarqube_projects` with `{ "query": "<project_name>" }`.

### Step 2: Quality Gate Status Check

Check overall project compliance:

- Call `get_project_quality_gate_status` with `{ "projectKey": "<PROJECT_KEY>" }`.

### Step 3: Fetch Issues (Bugs, Vulnerabilities, Code Smells)

Retrieve unresolved issues across the codebase:

- Call `search_sonar_issues_in_projects` with parameters:
  ```json
  {
    "projects": ["<PROJECT_KEY>"],
    "resolved": false,
    "types": ["BUG", "VULNERABILITY", "CODE_SMELL"]
  }
  ```

### Step 4: Security Hotspots Analysis

Inspect security hotspots requiring review:

- Call `search_security_hotspots` with `{ "projectKey": "<PROJECT_KEY>" }`.
- Call `show_security_hotspot` with `{ "hotspot": "<HOTSPOT_KEY>" }` to review detailed context and risk justification.

### Step 5: On-Demand Snippet Analysis

Analyze individual code snippets without full scans:

- Call `analyze_code_snippet` with `{ "code": "<code>", "language": "<lang>" }`.

---

## 4. Remediation & Verification Cycle

1. **Locate & Understand**: Read the issue details and rule definition using `show_rule`.
2. **Apply Clean Code Fixes**: Refactor code in the repository following language conventions and SonarQube standards.
3. **Re-run Scanner**: Trigger a new scan (`sonar-scanner`).
4. **Confirm Resolution**: Verify `get_project_quality_gate_status` returns `OK` / `PASSED`.
5. **Update Issue Status**: Use `change_sonar_issue_status` or `change_security_hotspot_status` if manual confirmation is required.
