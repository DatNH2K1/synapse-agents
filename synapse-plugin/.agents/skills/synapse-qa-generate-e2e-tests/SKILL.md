---
name: synapse-qa-generate-e2e-tests
description: |-
  Generate end to end automated tests for existing features. Use when the user says "create qa automated tests for [feature]"

  MANDATORY: Execute when generating end-to-end integration and user interface tests automatically.

  Trigger immediately for:
    - generate E2E tests
    - create Playwright specs
    - user journey testing auto-generation
    - ui flow test generator

  DO NOT trigger for:
    - Writing unit tests.
    - Fixing UI bugs without tests.
---

Follow the instructions in [QA Generate E2E Tests Workflow](./workflow.md).
