---
name: synapse-qa-automation
description: |-
  Advanced QA Automation: End-to-End browser testing, visual regression testing, accessibility (WCAG) compliance, and performance audits.

  MANDATORY: Execute when building, executing, or managing automated test suites (e.g. Cypress, Playwright, Jest).

  Trigger immediately for:
    - automated test suite
    - Cypress config
    - Playwright tests
    - Jest unit testing
    - QA pipeline setup

  DO NOT trigger for:
    - Manual exploratory testing.
    - Writing documentation.
---

# Advanced QA Automation

This skill provides comprehensive methodologies and guidelines to automate browser interactions, verify pixel-perfect visuals, check accessibility conformance, and audit page loading speeds.

---

## Core Workflows & Methodologies

### 1. End-to-End (E2E) Browser Testing

Write robust, non-flaky automated browser tests using Playwright or Cypress to simulate multi-step user journeys and assert application states.

**Workflow Steps**:

1. **Define Test Scenarios**: Extract user stories and Acceptance Criteria (AC) to map key workflows (e.g., "Add product to cart, check out, verify order receipt").
2. **Page Object Model (POM)**: Structure test code using the POM pattern to separate element selectors from test logic.
3. **Execute Assertions**: Ensure tests assert state changes (e.g., database writes, page navigation, success notification visibilities).
4. **Clean State Management**: Ensure tests seed a fresh database state and clear local storage before execution to prevent test pollution.

---

### 2. Visual Regression Testing

Automatically verify visual pixel-perfection across commits to catch UI shifts, layout breaks, or font sizing issues.

**Workflow Steps**:

1. **Take Baseline Screenshots**: Capture golden screenshots of key responsive layouts (Mobile, Tablet, Desktop) on clean builds.
2. **Execute Comparators**: Run visual difference tools on subsequent commits (e.g., `expect(page).toHaveScreenshot()`).
3. **Analyze Differences**: Generate pixel-diff overlays highlighting any unexpected font, padding, margin, or color changes.
4. **Approve/Reject**: Collaborate with the UX Designer to either approve the visual update as intentional or reject the commit as a layout bug.

---

### 3. Accessibility Testing (A11y Compliance)

Audit the interface to ensure WCAG (Web Content Accessibility Guidelines) AA/AAA compliance.

**Workflow Steps**:

1. **Automated Audits**: Run `axe-core` engines within E2E test scripts to detect issues like missing alt texts, improper heading structures, and bad ARIA attributes.
2. **Color Contrast Audits**: Check color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text).
3. **Keyboard Nav Audits**: Assert that all interactive elements can be focused and triggered using ONLY keyboard inputs (`Tab`, `Enter`, `Space`).

---

### 4. Performance & Core Web Vitals Audits

Measure, track, and enforce page speed budgets to guarantee a premium, instantaneous user experience.

- **Largest Contentful Paint (LCP)**: Verify main page content renders in under 2.5 seconds.
- **Cumulative Layout Shift (CLS)**: Verify visual stability (layout shift score under 0.1) during loading.
- **First Input Delay (FID) / Interaction to Next Paint (INP)**: Assert page responsiveness to user clicks (under 100ms).
- **Lighthouse CI**: Automate audits during CI pipelines to block merges if Performance, Best Practices, or SEO scores drop below 90.

---

## Output Templates

Refer to the official template when outputting an automated testing strategy and coverage plan:

- [E2E Test Plan Template](./templates/e2e-test-plan.md)
