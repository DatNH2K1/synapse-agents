---
name: synapse-trivy-scan
description: |-
  Comprehensive Docker container image vulnerability scanning using Trivy. Locates production Dockerfiles, builds scan images with no-cache, and performs full vulnerability audits without severity filtering.

  MANDATORY: Execute when performing container image security audits, finding production Dockerfiles to build and scan, or parsing security scan reports.

  Trigger immediately for:
    - trivy image scan
    - docker vulnerability scan
    - scan container image
    - parse inspector csv

  DO NOT trigger for:
    - SonarQube static code quality issues.
    - End-to-end web testing.
---

# Trivy Container Image Security Scan

This skill provides procedures for identifying production Docker configurations, building pristine test container images, and running full vulnerability scans with Trivy without filtering severities.

---

## 1. Locate Production Dockerfile

Before building and scanning, identify the production container definition:

1. **Check Common File Names**:
   - `Dockerfile.prod` or `Dockerfile.production`
   - `Dockerfile` (inspect multi-stage targets such as `runner`, `production`, `prod`)
   - Container manifests under `.docker/`, `deploy/`, or `infrastructure/`
2. **Inspect Multi-Stage Target**:
   - Check the final stage in multi-stage builds (e.g. `FROM ... AS runner` or `FROM ... AS production`).

---

## 2. Build Container Image for Scanning

Build the production target image with clean cache and a standard `:scan` tag:

```bash
docker build --no-cache --platform linux/amd64 . --target runner -f Dockerfile.prod -t <image_name>:scan
```

### Build Guidelines:

- **Use `--no-cache`**: Ensures all base images and OS packages are pulled fresh.
- **Tag Convention**: Always tag as `<image_name>:scan` (e.g. `my-service-api:scan` or `portal-web:scan`).
- **Skip Sensitive Build-time Envs**: Do not inject live production secrets or credentials into build arguments. Use dummy or build-time placeholders when required.

---

## 3. Execute Trivy Image Scan (Full Audit)

Run Trivy on the newly built scan image. **Do not filter out any severity levels** (e.g. do not pass `--severity` filters) so that all vulnerabilities (CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN) are surfaced for complete remediation:

```bash
trivy image <image_name>:scan
```

### Exporting Reports for Automated Processing:

- **JSON Format**:
  ```bash
  trivy image --format json --output trivy-scan-report.json <image_name>:scan
  ```
- **Table / Summary**:
  ```bash
  trivy image --format table <image_name>:scan
  ```

---

## 4. External & Inspector CSV Report Parsing

When local Trivy execution is unavailable or when reviewing cloud scans (such as AWS Inspector CSV exports):

1. Parse the CSV/JSON report to extract CVE IDs, affected packages, current installed versions, and recommended fixed versions.
2. Cross-reference findings with the Dockerfile base image and dependency lockfiles.
3. Hand off actionable package updates to `vulnerability-remediation`.
