# ReformAI Visualization Engine -- Executive Summary
**Date:** 2026-05-20
**Audience:** Engineering handoff

---

## The Problem We Started With

ReformAI's core product is: upload a photo of your room, select a style, receive a photorealistic transformation. The underlying model is Gemini (multimodal), prompted to perform style transformation on an input image.

The original implementation had reasonable aesthetic output but significant reliability failures. Given minimal direction, the model would occasionally hallucinate architecture (adding windows that did not exist, changing room structure), drift in perspective, or produce completely wrong rooms. These were termed "hard rejections." The original baseline prompt was approximately 37 lines and 6 numbered constraints, relying almost entirely on Gemini's native aesthetic priors.

Three objectives drove all subsequent development:

1. **Architectural integrity** -- preserve room geometry, window/door count, perspective, and proportions reliably across all requests
2. **Style fidelity** -- produce outputs that are recognizably the requested style, with committed material choices, not hedged or generic outputs
3. **Contractor catalogue integration** -- anchor specific renovation materials (flooring, walls, countertops, cabinets) to surfaces to support real renovation workflows

---

## Version History

**V1 through V3 (Prompt Architecture):** Each version addressed specific, documented failure modes. V3.0 introduced the template-driven architecture: a static template with `{{PLACEHOLDERS}}` filled by an injection layer, the style registry (`styles.ts`) as the single source of truth for model inputs, explicit image role labels for multi-image requests, the staging density block registry (SPARSE / BALANCED / LAYERED), and the structural sandwich pattern. The structural sandwich wraps generation between a structural anchoring block at the start and a terminal room image re-anchor at the end. Both are load-bearing. The core engineering lesson from this phase: behavioral constraints must be system-level with explicit `MUST` / `DO NOT` language in dedicated blocks, not embedded as suggestions within style descriptions.

**V4.0 through V4.1 (Injected Items):** Added the injected item pipeline. Specific furniture pieces or other items are locked at Tier 2, preserved exactly as shown, with surrounding elements adapting to them. The constraint hierarchy was formalized in this version.

**V5.0 through V5.2.1 (Moodboard Support and Prompt Compression):** Added moodboard support with an explicit scope block defining what the model may extract from reference images (abstract tone only, no material or architectural leakage). A 6-tier constraint hierarchy was introduced. A two-phase compression pass removed significant redundancy while preserving behavioral coverage. V5 is the foundational architecture that V6 and V7 build on. All V5 pipeline files are frozen.

**V6.0 (Contractor Catalogue Integration):** Built directly on V5. Added the Tier 2B Renovation Material Anchors block: structured contractor catalogue selections are resolved server-side to prompt descriptions and injected as surface-specific anchors, each with APPLY TO / BOUNDARY / NON-NEGOTIABLE sub-instructions. Each active anchor overrides Tier 4 style transformation on its target surface. Last regression (run_20260505_121132): V6.0 avg score 4.21, 8 wins, 1 hard rejection vs. baseline avg 3.73, 1 win, 5 hard rejections. V6.0 is the current production pipeline. It is fully deployed to Cloud Run via the Netlify proxy.

**V7.0 (Architectural Ground Truth):** Introduced a 2-call pipeline. A pre-generation pass using Gemini Flash (text-only, approximately 300ms) extracts structural facts from the room image: window count, door count, ceiling fixture presence, built-in niches, and camera perspective. Each field carries a confidence level (high / medium / low). High-confidence fields are injected as hard constraints with explicit enforcement language and a visibility contract. Medium fields are injected as advisory observations. Low fields are suppressed entirely. When all fields are low confidence, a fallback AGT fires and the pipeline degrades gracefully to V6.0 behavior. V7 also introduced per-style conflict resolution clauses, which define the only permitted resolution paths for conflicts between a style's aspirations and the architectural constraints. These are sourced from `styles.ts` and injected after the style block.

Last regression (run_20260505_164955): 0 hard rejections (resolved both failures from prior runs), but 5 style regressions vs. baseline. All 5 regressions were aesthetic rather than structural: muted Coastal outputs, suppressed Vintage surface expression, tabletop density exceeding LOW tier, unconventional bold palette (dusty rose at wall scale). An optimization_advice.md in the run folder documents 4 specific fixes to `visualization.constants.ts`, `styles.ts`, and `densityBlocks.ts`. None of these fixes have been applied yet.

---

## The Strategic Question

After the most recent architectural review, the central finding is: **V7 may be introducing more aesthetic regression than the marginal compliance improvement justifies.**

The reasoning is as follows. The baseline had 5 hard rejections in 12 cases. V5/V6 brought this to 1 hard rejection through the constraint hierarchy, WINDOW PRESERVATION language, and structural anchoring. V7 added AGT to eliminate that final hard rejection and brought the count to 0. But the 5 style regressions in V7 are qualitatively different from the structural failures in the baseline: they are "correct but uninspired" outputs, not catastrophic failures. The regression score average for V7 vs. V6 head-to-head has not been directly measured. That comparison has not been run.

The key technical concerns with the current AGT implementation:

The model already processes the room image with its native multimodal understanding. Explicit AGT does not provide new visual information; it provides a compliance attestation that the model must treat as authoritative. The enforcement language (HARD FACTS, VISIBILITY CONTRACT, ECHO BLOCK, EXACTLY N) primes a conservative generation mode that suppresses style expression in cases adjacent to the constrained fields. The fallback message ("structural extraction confidence was insufficient to produce hard facts") signals architectural uncertainty even in cases where the model's own visual understanding is fully adequate, producing the muted Coastal and suppressed Vintage outputs observed in the regression.

Additionally, the AGT overhead fires on the majority of requests because most room images yield at least one high-confidence field. The intended behavior (graceful fallback to V6 when confidence is low) is the minority path in practice.

The evaluation framework has a related issue. Internal evaluators are trained to notice architectural violations. Consumer users are not. The current metrics reward architectural precision and may underweight aesthetic delight and aspirational quality, which are the actual product value drivers. This means regression scores may not accurately predict consumer preference.

---

## Current State and Recommended Next Steps

V6.0 is production-deployed and performs well against the baseline. V7.0 is implemented, deployed, and the canonical active candidate in the codebase, but has unresolved aesthetic regressions and 4 pending fixes documented in `runs/run_20260505_164955/optimization_advice.md`.

Before investing further in V7 tuning, three experiments should be completed in order:

1. **V6.0 vs. V7.0 direct regression.** Run the standard regression comparing V6.0 against V7.0 directly. If V7's average score is lower than V6's, AGT is not net-additive and the pending fixes are not the right path forward.

2. **AGT constraint block ablation.** Run V7 with the AGT constraint block and echo block removed, keeping only the conflict resolution clauses. This isolates the style suppression cost of the enforcement machinery from the benefit of the conflict clauses, which are low-overhead and appear to have no suppression cost.

3. **Consumer preference test.** Show paired outputs (V7 vs. baseline) to naive users without framing around architectural correctness. This will determine whether the internal regression metrics correlate with actual user preference.

The results of these three experiments should drive the architectural decision: continue V7 with targeted fixes, reduce AGT scope to selective activation on high-risk style/feature combinations, or consolidate the conflict resolution clauses into V6 as a lighter alternative.

---

## Key Files

| Purpose | Path |
|---|---|
| V7 pipeline service | `apps/vis-service/src/services/balanced_v7/geminiService.ts` |
| AGT extraction | `apps/vis-service/src/services/agt/extractGroundTruth.ts` |
| V7 prompt constants | `apps/vis-service/src/prompts/balanced_v7/visualization.constants.ts` |
| Style registry | `apps/vis-service/src/data/styles.ts` |
| Pending V7 fixes | `runs/run_20260505_164955/optimization_advice.md` |
| Regression runner | `tests/regression/run_regression.py` |
| Architecture spec | `docs/reference-documents/V7_IMPLEMENTATION_SPEC_REV1.md` |
| Platform status | `docs/PLATFORM_STATUS.md` |
