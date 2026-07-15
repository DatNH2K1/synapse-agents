---
name: synapse-design-suite
description: "Generate images via Nano Banana with 129 curated prompts. Mandatory validation interview refines style/mood/colors (use --skip to bypass). 3 modes: search, creative, wild. Styles: Ukiyo-e, Bento grid, cyberpunk, cinematic, vintage patent."
argument-hint: "[concept] [--mode search|creative|wild|all] [--skip]"
---

# Documentation Discovery via MCP Tools

## Overview

**MCP-first** image generation and prompt searching.

Use the MCP tools instead of running local python scripts.

## Primary Workflow

1. **Search Curated Prompt Database:**
   Call the MCP tool `search_ai_art_prompts(query, domain)`.
   _Example:_ `search_ai_art_prompts(query="minimalist banner")`

2. **Generate AI Art:**
   Call the MCP tool `generate_ai_art(concept, output_path, mode, aspect_ratio, model, verbose, dry_run)`.
   _Example:_ `generate_ai_art(concept="tech conference banner", output_path="banner.png", aspect_ratio="16:9")`

### Generation Modes

| Mode       | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| `search`   | Find best matching prompt from 129 curated prompts (default)    |
| `creative` | Remix elements from top 3 matching prompts                      |
| `wild`     | Out-of-the-box creative interpretation (random style transform) |
| `all`      | Generate all 3 variations                                       |

---

## Prompt Database

**129 curated prompts** extracted from awesome-nano-banana-pro-prompts:

Call the MCP tool `search_ai_art_prompts(query, domain)` to query the database.
_Example:_ `search_ai_art_prompts(query="product showcase")`

### Categories include:

- **Profile/Avatar**: Thought-leader headshots, mirror selfies
- **Infographics**: Bento grid, chalkboard, ingredient labels
- **Social Media**: Quote cards, banners, thumbnails
- **Product**: Commercial shots, e-commerce, Apple-style
- **Artistic**: Ukiyo-e, patent documents, vaporwave, cyberpunk
- **Character**: Anime, chibi, comic storyboards

---

## Wild Mode Transformations

The `wild` mode randomly applies one of these artistic transformations:

- Japanese Ukiyo-e woodblock print
- Premium liquid glass Bento grid infographic
- Vintage 1800s patent document
- Surreal dreamscape with volumetric god rays
- Cyberpunk neon aesthetic with holograms
- Hand-drawn chalkboard explanation
- Isometric 3D diorama
- Cinematic movie poster
- Vaporwave aesthetic with glitch effects
- Apple-style product showcase

---

## References

| Topic                   | File                                            |
| ----------------------- | ----------------------------------------------- |
| **Validation Workflow** | `references/validation-workflow.md`             |
| Nano Banana Guide       | `references/nano-banana.md`                     |
| Image Prompting         | `references/image-prompting.md`                 |
| Source                  | `references/awesome-nano-banana-pro-prompts.md` |

---

## MCP Tools

| MCP Tool                | Purpose                            |
| ----------------------- | ---------------------------------- |
| `generate_ai_art`       | Main image generation with 3 modes |
| `search_ai_art_prompts` | Search prompts database            |
