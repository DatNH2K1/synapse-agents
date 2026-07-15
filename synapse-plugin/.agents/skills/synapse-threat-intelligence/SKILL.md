---
name: synapse-threat-intelligence
description: |-
  CVE & Threat Intelligence Monitoring: Real-time CVE audits, GitHub Advisory tracking, and proactive dependency patching.

  MANDATORY: Execute when analyzing threat intelligence reports, tracking threat vectors, or securing API gateways against active threats.

  Trigger immediately for:
    - threat intelligence audit
    - threat vector tracking
    - securing api gateway
    - active cyber threat analysis

  DO NOT trigger for:
    - Configuring simple route guards.
    - Implementing standard login features.
---

# CVE & Threat Intelligence Monitoring

This skill provides workflows to proactively monitor newly disclosed third-party vulnerabilities, cross-reference dependency trees with global threat databases, and recommend security hotfixes.

---

## Core Workflows & Methodologies

### 1. CVE & Advisory Monitoring

Actively monitor global threat databases and security advisories for emerging Zero-Day disclosures and security warnings affecting the tech stack.

**Key Sources**:

- **GitHub Advisory Database**: Emerging library security disclosures.
- **National Vulnerability Database (NVD)**: CVE (Common Vulnerabilities and Exposures) registry.
- **Snyk Vulnerability Database**: Rapid developer advisories.
- **OWASP Community Boards**: New attack vectors and threat intelligence.

---

### 2. Dependency Audit Cross-Reference

Parse project lockfiles and dependencies to map against newly announced security advisories.

**Workflow Steps**:

1. **Analyze Lockfiles**: Parse package files (e.g., `package.json`, `pnpm-lock.yaml`, `composer.json`, `composer.lock`).
2. **Database Querying**: Cross-reference the identified library versions against CVE registries.
3. **Generate Risk Map**: List all vulnerable dependencies, categorizing them by CVSS (Common Vulnerability Scoring System) severity (Low, Medium, High, Critical).

---

### 3. Threat Vector Assessment

Evaluate whether a newly disclosed library vulnerability actually exposes the project's specific architecture to attacks.

**Workflow Steps**:

1. **Trace Usage**: Investigate if the vulnerable library method is actively called in the project codebase.
2. **Analyze Exposure**: Determine if the vulnerable code path is exposed to untrusted user input or public endpoints.
3. **Calculate Risk Level**: If a vulnerable library is used but the specific buggy function is unreachable, label it "Protected/Low Risk." If the buggy path is public, label it "Active Threat/Critical Risk."

---

### 4. Security Patch & Mitigation Proposals

Formulate rapid response proposals to neutralize active vulnerabilities before they are exploited.

**Workflow Steps**:

1. **Upgrade Resolutions**: Propose updating libraries to the patched minor/patch versions (e.g., changing `package.json` resolutions or running `npm update`).
2. **Workaround Implementations**: If no official patch exists, design an architectural override (e.g., middleware to block the attack payload or custom validation rules).
3. **Verify Remediation**: After applying the patch, re-run audit commands and security test suites to confirm that the vulnerability is resolved and no functionalities are broken.

---

## Output Templates

Refer to the official template when outputting a security threat advisory regarding newly discovered community/third-party vulnerabilities:

- [Threat Intelligence Advisory Template](./templates/threat-intelligence-advisory.md)
