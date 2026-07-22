---
name: synapse-copywriting
description: |
  Conversion copywriting formulas, headline templates, email copy patterns, landing page structures, CTA optimization, and writing style extraction.

  MANDATORY: Activate when writing high-converting copy, crafting headlines, email campaigns, landing pages, or applying custom writing styles from assets/writing-styles/ directory.

  Trigger immediately for:
  - Copywriting formulas & conversion: "AIDA", "PAS", "BAB", "4Ps", "FAB", "copywriting formulas", "landing page structures", "CTA optimization".
  - Headline templates & creation: "crafting headlines", "subject lines", "headline templates", "How to [X] without [Y]".
  - Email campaigns & social media: "email copy patterns", "email campaigns", "social posts", "product descriptions".
  - Writing styles & extraction: "extract writing styles", "custom writing styles", "tone extraction", "writing-styles".

  DO NOT trigger for:
  - Technical programming/coding tasks or architectural system design that do not involve copywriting or content composition.
argument-hint: "[copy-type] [context]"
---

# Copywriting

Formulas, templates, patterns, and writing styles for high-converting copy.

## When to Use

- Writing headlines/subject lines, landing page copy, email campaigns
- Social posts, product descriptions, CTA optimization, A/B variations
- Applying custom writing styles from user documents

## Writing Styles

Load: `references/*.md` | Default catalog: `assets/writing-styles/default.md` (50 styles)

**Extract styles from multi-format files using MCP tools:**

Use the MCP tools:

- `list_writing_styles()`: List all style template files.
- `extract_writing_style(style_name, output_json)`: Extract writing style properties from a selected style file.

**Formats:** `.md` `.txt` `.pdf` `.docx` `.xlsx` `.pptx` `.jpg` `.png` `.mp4` (docs/media need `GEMINI_API_KEY`)

## Copy Formulas

Load: `references/copy-formulas.md`

| Formula | Structure                                 | Best For                   |
| ------- | ----------------------------------------- | -------------------------- |
| AIDA    | Attention → Interest → Desire → Action    | Landing pages, ads         |
| PAS     | Problem → Agitate → Solution              | Email, sales pages         |
| BAB     | Before → After → Bridge                   | Testimonials, case studies |
| 4Ps     | Promise → Picture → Proof → Push          | Long-form sales            |
| 4Us     | Urgent + Unique + Useful + Ultra-specific | Headlines                  |
| FAB     | Feature → Advantage → Benefit             | Product descriptions       |

## Headlines

Load: `references/headline-templates.md`

Patterns: "How to [X] without [Y]" • "[Number] ways to [benefit]" • "The secret to [outcome]" • "Why [belief] is wrong"

## Email Copy

Load: `references/email-copy.md`

Subject lines: Curiosity gap • Benefit-driven • Question • Urgency

## Landing Pages & CTAs

Load: `references/landing-page-copy.md` | `references/cta-patterns.md`

Hero: Headline (promise) → Subheadline (how) → CTA (action) → Social proof
CTAs: "Start [verb]ing" • "Get [benefit]" • "Yes, I want [benefit]"

## Workflows

| Workflow                         | Purpose                                                   | Use When                                    |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| `references/workflow-cro.md`     | CRO optimization (25 principles) + plan creation workflow | Conversion optimization & CRO plan requests |
| `references/workflow-enhance.md` | Copy enhancement                                          | Improving existing copy                     |
| `references/workflow-fast.md`    | Quick copy generation                                     | Simple, time-sensitive requests             |
| `references/workflow-good.md`    | Quality copy with research                                | High-stakes content                         |

## References

| File                               | Purpose                                        |
| ---------------------------------- | ---------------------------------------------- |
| `references/writing-styles.md`     | 30 writing styles quick reference              |
| `references/copy-formulas.md`      | AIDA, PAS, BAB, 4Ps, FAB formulas              |
| `references/headline-templates.md` | Headline patterns & templates                  |
| `references/email-copy.md`         | Email copy patterns                            |
| `references/landing-page-copy.md`  | Landing page structure                         |
| `references/cta-patterns.md`       | CTA optimization                               |
| `references/power-words.md`        | Power words by emotion                         |
| `references/social-media-copy.md`  | Platform-specific copy                         |
| MCP Tools                          | `list_writing_styles`, `extract_writing_style` |
| `templates/copy-brief.md`          | Creative brief template                        |

## Agent Integration

**Primary:** fullstack-developer | **Related:** brand-guidelines, content-marketing, email-marketing

## Best Practices

1. Lead with benefit, not feature | 2. One CTA per piece
2. Specificity > vague claims | 4. Read aloud—if awkward, rewrite
3. Test headlines first | 6. Match copy to awareness level

## Outputs

**IMPORTANT:** Invoke "/synapse-project-organization" skill to organize the outputs.
