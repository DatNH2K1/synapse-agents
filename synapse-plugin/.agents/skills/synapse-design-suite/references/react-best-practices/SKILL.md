---
name: synapse-design-suite
description: React and Next.js performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React/Next.js code.
argument-hint: "[component or pattern]"
---

# React & Next.js Best Practices (Vercel)

Ensure optimal performance and scalability for React/Next.js applications by following Vercel's engineering standards.

## Core Categories

### 1. Eliminating Waterfalls (CRITICAL)

- **Parallelize:** Use `Promise.all()` for independent data fetches.
- **Defer:** Move `await` into branches where the data is actually used.
- **Streaming:** Use `Suspense` boundaries to stream content and improve perceived load time.

### 2. Bundle Optimization (CRITICAL)

- **No Barrel Imports:** Import directly from files to avoid loading unnecessary code.
- **Dynamic Imports:** Use `next/dynamic` for heavy components (charts, editors).
- **Defer Third-Party:** Load non-critical scripts (analytics, ads) after hydration.

### 3. Server-Side Performance

- **Deduplication:** Use `React.cache()` to deduplicate fetches within a single request.
- **Minimize Serialization:** Only pass necessary primitive data from Server to Client components.

### 4. Re-render Optimization

- **Memoization:** Use `useMemo` and `useCallback` only for truly expensive operations.
- **Functional setState:** Use `setState(prev => ...)` for stable callbacks.
- **Stable References:** Keep object literals and arrays outside of component render cycles if static.

## When to Use

- Creating new components or pages.
- Refactoring slow or large components.
- Reviewing Pull Requests for performance regressions.
