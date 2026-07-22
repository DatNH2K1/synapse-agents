# ⚙️ E2E AUTOMATED TEST PLAN

## 1. Mapped User Flows & Playwright/Cypress Scenarios

- **Scenario 1: [Scenario Name, e.g., Successful Import Flow]**
  - **Pre-conditions**: [e.g., Auth cookies set, clean DB seed]
  - **Step-by-step Actions**: [e.g., Click 'Import', drag-and-drop CSV, wait for API response]
  - **Assertions & Expected Results**: [e.g., Database contains 100 rows, toast alert shows 'Success', URL shifts to dashboard]
- **Scenario 2: [Scenario Name, e.g., Invalid File Boundary Flow]**
  - [Actions and Assertions for failed boundary cases]

## 2. Visual Regression Checklist

- **Screenshots Captured**: [List paths/views, e.g., Dashboard Desktop view, Sidebar collapsed mobile view]
- **Tolerance Threshold**: [e.g., Max 0.1% pixel variance]
- **Comparison Engine**: [e.g., Playwright page.screenshot with maxDiffPixels]

## 3. Accessibility & Conformance Plan (A11y)

- **Target Conformance**: WCAG 2.1 AA / AAA
- **Keyboard Navigation Path**: [Detail Tab-key focus order]
- **Axe-core Automated Checkpoints**: [Verify alt-tags, ARIA-labels, color contrast minimums]

## 4. Performance & Core Web Vitals Budget

- **Page Load Budget**: First Contentful Paint (FCP) < 1.0s, Largest Contentful Paint (LCP) < 2.5s
- **Interactive Budget**: Interaction to Next Paint (INP) < 100ms, Cumulative Layout Shift (CLS) < 0.05
