# ReformAI Visualization Engine - Development Guide
**Last Updated:** 2026-05-21

## Source-of-Truth Order
1. `docs/PLATFORM_STATUS.md`
2. `docs/CURRENT_STATE.md`
3. `apps/vis-service/README.md`
4. `README.md`

## Current Architecture Snapshot
- Canonical active pipeline: `balanced_v7`
- Explicit comparison pipeline: `balanced_v6`
- Historical benchmark family preserved for comparison
- Backend source model: `transport/pipelines/prompts/guardrails/models/catalog/shared`

## Local Workflows
### Start local dev
```bash
npm run dev
```

### Backend
```bash
npm --workspace apps/vis-service run build
npm --workspace apps/vis-service run test:contracts
```

### Frontend
```bash
npm --workspace apps/web-sandbox run build
```

## Where to Add Code
- API request/response handling -> `apps/vis-service/src/transport`
- Pipeline behavior by mode -> `apps/vis-service/src/pipelines/versions`
- Prompt behavior -> `apps/vis-service/src/prompts/blocks`
- Structural/AGT safety -> `apps/vis-service/src/guardrails`
- Gemini/provider behavior -> `apps/vis-service/src/models`
- Catalogue feature logic -> `apps/vis-service/src/catalog`
- Shared contracts/registries/validation -> `apps/vis-service/src/shared`
