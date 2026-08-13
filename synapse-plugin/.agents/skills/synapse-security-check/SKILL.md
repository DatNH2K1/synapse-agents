---
name: synapse-security-check
description: |-
  Security Check & Vulnerability Remediation: Run Trivy scans, parse security reports (such as AWS Inspector CSVs), and apply package/OS-level hotfixes.

  MANDATORY: Execute when tasked to run security scans, fix package vulnerabilities, or resolve CVE alerts in dependencies/Dockerfiles.

  Trigger immediately for:
    - security scan check
    - run trivy scan
    - fix vulnerability cve
    - package remediation

  DO NOT trigger for:
    - Simple lint/code formatting issues.
    - Implementing application logic.
---

# Security Check & Vulnerability Remediation

This skill provides resources and procedures for executing local Trivy security scans, analyzing security vulnerabilities, and applying hotfixes to package and OS-level dependencies.

---

## Core Workflows & Methodologies

### 1. Run Security Scans with Trivy

Run Trivy scans to detect security issues in the codebase and built container images.

- **Filesystem Scan** (Dependencies, Lockfiles, Misconfigurations):
  `trivy fs .`
- **Docker Image Scan**:
  `trivy image <image_name>:<tag>`
- **Exporting Reports**:
  `trivy image --format json --output report.json <image_name>:<tag>`

*(Exported CSV reports from platforms like AWS Inspector can be parsed as secondary inputs when local Trivy execution is unavailable).*

---

### 2. Analyze the Scan Output

Evaluate findings from the Trivy scan or security CSV files.

1. **Prioritize Severity**: Filter and resolve `CRITICAL`, `HIGH`, and `MEDIUM` severities first.
2. **Identify target packages**: Locate the library/package containing the vulnerability (e.g., `openssl`, `pyasn1`, `nodejs`).
3. **Determine Fixed Version**: Check if a secure patch version is recommended under the "Fixed Version" or "Remediation" fields.

---

### 3. Remediate Package Vulnerabilities

#### A. Language-Specific Packages (npm, pip, poetry)
1. **Locate**: Find the vulnerable library in the project configuration (e.g., `package.json`, `requirements.txt`, `pyproject.toml`).
2. **Update**: Upgrade the library to the version recommended in Trivy's "Fixed Version" column (or the latest stable version).
3. **Regenerate Lockfiles**: Run installation commands (`npm install`, `poetry update`) to update dependency resolution trees.

#### B. OS-Level Packages (inside Docker Container Images)
For OS-level packages (e.g., `openssl`, `libcrypto`, `zlib`) reported in Docker image scans:
1. **Upgrade Base Image**:
   - Check the `Dockerfile`'s `FROM` instruction (e.g., `python:3.11-alpine3.22`).
   - If a newer minor OS version is available (e.g., upgrading Alpine `3.22` to `3.24`), update the base image tag.
2. **Targeted Package Upgrades in Dockerfile**:
   - If upgrading the base image is not feasible or doesn't resolve all issues, append explicit package updates:
     - **Alpine**: `RUN apk update && apk upgrade --no-cache openssl libcrypto3`
     - **Debian/Ubuntu**: `RUN apt-get update && apt-get install --only-upgrade -y openssl`

---

## Verification & Validation

### 1. Build Container Image for Testing

To verify the remediated vulnerabilities, rebuild the production-ready container image using specific targets and architectures matching your deployment environment:

```bash
docker build --no-cache --platform linux/amd64 . --target runner -f Dockerfile.prod -t <image_name>:security-test
```

*Note: Replace `<image_name>` with the corresponding module name (e.g., `my-app-fe` or `my-app-be`).*

### 2. Scan Built Image with Trivy

Run Trivy directly on the newly built test image to confirm all critical/high security alerts have been resolved:

```bash
trivy image <image_name>:security-test
```

### 3. Execute Application Tests

Run the project-specific unit or integration test suite to ensure that dependency/package updates did not introduce breaking changes or regressions (using the appropriate test runner for your project, e.g. `npm test`, `pytest`, `cargo test`, etc.).

### 4. Update Changelog

Record resolved CVEs and package updates under the `SECURITY` section in `CHANGELOG.md`.
