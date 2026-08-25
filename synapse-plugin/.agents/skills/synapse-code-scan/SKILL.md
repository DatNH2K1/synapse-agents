---
name: synapse-code-scan
description: |
  Master Skill for comprehensive source code quality analysis, local SonarQube inspection, Trivy container security scanning, vulnerability remediation, and Docker hardening.

  MANDATORY: Activate when running code quality checks, local SonarQube scans via MCP/Docker, scanning container images with Trivy, remediating CVE vulnerabilities, or hardening Dockerfiles.
---

# Synapse Code Scan & Security Suite

This Master Skill provides resources, automation protocols, and specialized sub-skills for static code analysis, local SonarQube inspection via MCP, container image security scanning with Trivy, end-to-end vulnerability remediation, and Docker container hardening.

## How to use Sub-skills

When performing code scanning, static analysis, or security remediation tasks, check the list below and read the specific sub-skill's instructions using the `view_file` tool before proceeding:

- **SonarQube Scan**: Run local SonarQube server via Docker, execute scans, and automate issue extraction, quality gate checks, and remediation status via SonarQube MCP tools.
  - File: [sonarqube-scan](references/sonarqube-scan/SKILL.md)
- **Trivy Scan**: Production Docker image scanning with Trivy, locating production Dockerfiles, no-cache build setups with scan tags, and comprehensive vulnerability auditing.
  - File: [trivy-scan](references/trivy-scan/SKILL.md)
- **Vulnerability Remediation**: Comprehensive remediation guides for application dependency packages (npm, pip, poetry, go) and OS-level packages (apk, apt-get, base image bumps).
  - File: [vulnerability-remediation](references/vulnerability-remediation/SKILL.md)
- **Container Hardening**: Dockerfile security best practices, multi-stage builds, non-root user execution, and rebuild validation loops.
  - File: [container-hardening](references/container-hardening/SKILL.md)
