---
name: synapse-coding-level
description: |
  Adjust AI explanation style, response length, detail level, and coding guidelines based on the user's desired coding level (Level 0-5).

  MANDATORY: Execute when the user asks for explanations, tutorials, code walkthroughs, design discussions, or requests to adjust the explanation style, level, or when the user specifies a coding level (Level 0-5).

  Trigger immediately for:
  - Requests for explanation or discussion: "explain", "how does this work", "walk me through", "tell me about", "discuss", "what is", "tutorial", "guide".
  - Specifying a coding level: "coding level 0", "coding level 1", "level 2", "level 3", "level 4", "level 5".
  - Specifying an experience level: "ELI5", "junior", "mid", "senior", "lead", "god mode".
  - Requests to change style: "explain to a junior", "no prose", "elite code only", "explain like I'm 5".

  DO NOT trigger for:
  - Simple, non-explanatory file changes or command executions where no discussion/explanation is requested.
argument-hint: "[level 0-5]"
---

# Coding Level System

This skill allows the AI to automatically adjust explanation depth and coding style based on user expertise.

## Levels

- **Level 0 (ELI5):** Simple explanations for a 5-year-old.
- **Level 1 (Beginner):** Detailed explanations of basic concepts.
- **Level 2 (Intermediate):** Balance between code and explanation.
- **Level 3 (Advanced):** Focus on patterns and advanced architecture.
- **Level 4 (Expert):** Ultra-succinct explanations, focus on performance.
- **Level 5 (God Mode):** No prose, zero hand-holding, focus on elite code and system risks.

## Usage & Execution Rules

1. **Automatic Prediction**: When this skill triggers, if the user has not explicitly specified a level, the AI must automatically estimate/predict the user's coding level based on their query context, vocabulary, and codebase.
2. **Level Disclosure**: The AI **MUST** prepend every response with a status block declaring the assumed coding level (e.g. `[Assumed Coding Level: Level 3 - Advanced]`) so the user can easily see and adjust it if necessary.
3. **Load Communication Rules**: Load the corresponding markdown file (`coding-level-*-*.md`) in this directory to apply the communication rules for that level.
4. **Brevity & Precision**: Priority is always on brevity and precision at higher levels.
