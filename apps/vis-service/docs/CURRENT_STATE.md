# vis-service Current State (Derived)
**Last Updated:** 2026-05-21

Authoritative lifecycle source:
- `docs/PLATFORM_STATUS.md`

## Runtime Defaults
- Default mode: `balanced_v7`
- Canonical orchestration: AGT extraction/classification + generation

## Routing Behavior
- `balanced_v7`: canonical active path
- `balanced_v6`: explicit comparison path (`pipelines/versions/balanced-v6`)
- Historical benchmark modes remain callable via legacy handlers

## Source Layout
- `src/transport`: HTTP and request assembly
- `src/pipelines`: mode routing + orchestration by version
- `src/prompts`: prompt blocks/templates/composition
- `src/guardrails`: AGT and structural safety layer
- `src/models`: provider execution clients
- `src/catalog`: contractor catalogue feature
- `src/shared`: shared contracts/registries/validation

## Validation
- Build: `npm run build`
- Contracts: `npm run test:contracts`
