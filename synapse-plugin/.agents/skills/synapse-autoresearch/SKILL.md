---
name: synapse-autoresearch
description: |
  Autonomous iterative optimization loop — run N iterations against a mechanical metric (coverage, size, errors). Use for improving measurable project metrics automatically.

  MANDATORY: Execute when the project needs automated optimization or refinement of a specific mechanical metric (such as bundle size, test coverage, or lint/compile error counts) via a git-tracked loop of atomic changes.

  Trigger immediately for:
  - Improving mechanical project metrics: "optimize bundle size", "increase test coverage", "fix all lint errors automatically", "iterative optimization loop".
  - Running automated iterations against a target metric.

  DO NOT trigger for:
  - One-off manual edits, general feature development, or debugging non-mechanical problems.
  - Basic commands (e.g. standard tests or single lint fixes).
argument-hint: "[Goal/Metric description]"
---

# Auto-Research (Iterative Optimization Loop)

Improve measurable project metrics (test coverage, bundle size, ESLint errors) through autonomous, git-tracked experiments.

## Core Protocol

1. **Baseline:** Measure the current metric using a `Verify` command.
2. **Iteration:**
   - Perform ONE atomic change to the code in the defined `Scope`.
   - Commit the change.
   - Run `Verify` to measure the new metric.
   - Run `Guard` to ensure no regressions (e.g., tests still pass).
3. **Keep/Discard:** If the metric improved, KEEP the commit. If not, REVERT.
4. **Learn:** Use the results of the previous iteration to inform the next change.

## Configuration Requirements

- **Goal:** Description of what to improve.
- **Scope:** Glob patterns of files that can be modified.
- **Verify Command:** A shell command that outputs a **single number**.
- **Guard Command:** A regression check (exit 0 = pass).
- **Direction:** `higher` (e.g., coverage) or `lower` (e.g., bundle size).

## Example

```markdown
Goal: Reduce main bundle size below 200KB
Scope: src/**/\*.ts, src/**/\*.tsx
Verify: npx vite build 2>/dev/null | grep "dist/index" | awk '{print $2}' | sed 's/kB//'
Guard: npx tsc --noEmit
Direction: lower
```

## Constraints

- Requires a clean Git working tree before starting.
- Each iteration must be atomic.
- Sequential execution only.
