# ReformAI Visualization Engine - Current State (Summary)
**Last Updated:** 2026-05-11

Authoritative lifecycle/governance source:
- `docs/PLATFORM_STATUS.md`

## Runtime Summary
- Canonical active candidate: `balanced_v7`
- Compatibility alias path: `balanced_v6 -> balanced_v5`
- Historical/frozen benchmark modes remain available for product-evolution comparison

## Comparison Philosophy
- Comparison capability is intentional architecture, not legacy residue.
- `baseline_original` is the historical anchor.
- V4, V5, V6, V7 are preserved as product-evolution checkpoints with explicit semantics.

## Validation Workflows
- Contract tests (spawn-free): `npm run test:contracts` in `apps/vis-service`
- Fast preflight profile (non-strict): `npm run regression:preflight`
- Full benchmark profile (strict): `npm run regression:preflight:full`

## Lifecycle Snapshot
- Historical baseline anchor: `baseline_original`
- Frozen benchmark (furniture/control): `balanced_v4_0`, `balanced_v4_1`
- Frozen benchmark (moodboard): `balanced_v5`
- Compatibility alias behavior: `balanced_v6`
- Canonical active candidate: `balanced_v7`
- Historical benchmarks: `balanced_v1` through `balanced_v3_0`
- Historical comparison path: `improved_current`

## Deployment Path
`Browser -> Netlify CDN -> netlify/functions/api.mjs -> Cloud Run -> Gemini`
