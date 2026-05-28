# Pipeline: balanced_v8

**Status:** Implemented, pending regression validation
**Mode key:** `balanced_v8`
**Template version:** `8.0.0`

## What this pipeline is for

V8 is purpose-built for the **service provider catalogue use case**: a contractor or supplier has their own product catalogue, and the goal is to show a client what their room looks like with specific products installed. This is not a general room redesign — it is a renovation preview.

V8 should be called with active catalogue selections (`contractorId` + `renovationSelectionIds`). Without catalogue items, V7 is the more appropriate pipeline.

## What changed from V7

**Role framing:** The structural prompt is rewritten from "act as an expert interior designer" to "you are a professional renovation installer." This removes creative latitude from the model. A designer interprets; an installer renders what was specified.

**Catalogue as primary brief:** In V5–V7, catalogue items are Tier 2B anchors that *override* the style block on specific surfaces. In V8, the structural prompt establishes upfront that catalogue items are the primary render brief — every other decision is subordinate to them.

**Compact style block:** The V5–V7 style block contains a full aesthetic brief (core materials, color palette, signature elements, staging density tiers, don't rules, self-audit). V8 replaces this with a compact ambient-context block scoped to surfaces not covered by catalogue items. Two variants:
- **With style:** "Apply `{{STYLE_NAME}}` to all surfaces not covered by installed products"
- **No style:** "Maintain a clean contemporary aesthetic that complements the installed products"

**Updated constraint hierarchy:** Tier 2B is relabeled from "RENOVATION MATERIAL ANCHORS" to "INSTALLED CATALOGUE PRODUCTS [PRIMARY RENDER BRIEF]" with updated body text reflecting that these are real products being installed, not style overrides.

**No staging density validation:** V8's prompt builder does not validate `staging_density` from the style preset. The installer framing makes staging density irrelevant — the output should look like a renovation photograph, not a styled staging.

## What stays identical to V7

- AGT extraction call and confidence gating
- FALLBACK_AGT behavior (extraction failure never blocks generation)
- Conflict clauses block
- Moodboard support and influence prompt logic
- Injected item support (Tier 2)
- Canonical block sequence (renovation anchors before style block)
- Gemini client

## Acceptance criteria

- ≤2 hard rejections per 12-case regression
- Average catalogue product compliance ≥75% per category (flooring, walls, countertops, cabinets)

## What should NOT be modified here

Prompt block text belongs in `prompts/balanced_v8/` or `prompts/blocks/`. This file contains only orchestration logic: what blocks to build and in what order to pass them to the composer.
