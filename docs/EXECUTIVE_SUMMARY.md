# ReformAI Visualization Engine -- Executive Summary
**Last Updated:** 2026-05-21

## Current Product State
ReformAI generates style-transformed room visualizations with multiple pipeline modes for quality comparison.

- Canonical active candidate: `balanced_v7`
- Explicit comparison path: `balanced_v6`
- Historical benchmark family retained for controlled regression/comparison

## Current Engineering State
The repository was recently reorganized for clarity and maintainability.

### Backend source is now intentionally separated into:
- `transport` (HTTP/controller/request/schema)
- `pipelines` (routing/dispatch/version orchestration)
- `prompts` (block/template/composition)
- `guardrails` (AGT + structural enforcement inputs)
- `models` (Gemini/provider execution)
- `catalog` (contractor catalogue feature)
- `shared` (contracts/types/validation/registries)

## Why This Matters
A new engineer can now quickly answer:
- where requests enter
- how mode routing works
- where prompt behavior lives
- where structural safety logic lives
- where to modify model/provider behavior

## Operational Validation
Current baseline checks passing:
- backend build
- backend contract tests
- frontend build

See `docs/PLATFORM_STATUS.md` for authoritative runtime semantics and active file paths.
