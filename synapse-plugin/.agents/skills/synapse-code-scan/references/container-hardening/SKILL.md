---
name: synapse-container-hardening
description: |-
  Container security hardening standards, Dockerfile best practices, multi-stage builds, non-root user configurations, and post-remediation verification loops.

  MANDATORY: Execute when hardening Dockerfiles, configuring least-privilege container runtime users, or running end-to-end container security validation.

  Trigger immediately for:
    - dockerfile hardening
    - container security best practices
    - non-root container configuration
    - multi-stage build optimization

  DO NOT trigger for:
    - SonarQube linting rules.
    - Application feature development.
---

# Container Security Hardening & Validation

This skill defines standards and best practices for hardening Dockerfiles, minimizing attack surfaces, and executing complete verification loops after applying security updates.

---

## 1. Container Hardening Standards

### A. Multi-Stage Builds

Separate build tooling and compilation dependencies from the final runtime container:

```dockerfile
# Stage 1: Build & Compilation
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### B. Enforce Non-Root Execution

Never run production containers as `root`:

- **Node.js**: Use existing `USER node`
- **Alpine generic**:
  ```dockerfile
  RUN addgroup -S appgroup && adduser -S appuser -G appgroup
  USER appuser
  ```
- **Debian / Ubuntu**:
  ```dockerfile
  RUN groupadd -r appgroup && useradd -r -g appgroup appuser
  USER appuser
  ```

### C. Minimal Base Images

- Prefer `alpine`, `distroless`, or `-slim` official base images.
- Avoid full distribution images (`ubuntu:latest`, `debian:latest`) when not required.

---

## 2. Verification & Validation Loop

After modifying Dockerfiles or applying dependency upgrades:

### Step 1: Rebuild Pristine Image

```bash
docker build --no-cache --platform linux/amd64 . --target runner -f Dockerfile.prod -t <image_name>:scan
```

### Step 2: Re-scan with Trivy

```bash
trivy image <image_name>:scan
```

### Step 3: Run Project Test Suite

Execute the repository's test suite to ensure all patches maintain full backward compatibility:

- `npm test` / `pytest` / `make check` / `cargo test`

### Step 4: Record in Changelog

Document all fixed CVEs and package upgrades under the `SECURITY` section in `CHANGELOG.md`.
