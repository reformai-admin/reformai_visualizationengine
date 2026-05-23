# Agent Handoff
**Last Updated:** 2026-05-21

## Current Snapshot
The structural cleanup pass is complete. The repo now follows a clear backend responsibility model:
- `transport`
- `pipelines`
- `prompts`
- `guardrails`
- `models`
- `catalog`
- `shared`

## What Changed Most Recently
1. Backend source folders were reorganized into the ownership model above.
2. Pipeline versions were normalized under `pipelines/versions/`:
   - `balanced-v5`
   - `balanced-v6`
   - `balanced-v7`
3. `balanced_v6` now has an explicit handler module (`balanced-v6/index.ts`) and no longer silently resolves to V5 in routing.
4. Contract tests were updated to reflect explicit V6 behavior.
5. README/docs were updated for new request flow and structure.
6. Generated legacy test build output moved to `archive/legacy-snapshots/`.

## Where to Start as Next Engineer
1. Read `docs/PLATFORM_STATUS.md`.
2. Read `apps/vis-service/README.md`.
3. Follow request path from:
   - `transport/controllers/visualization.controller.ts`
   - `pipelines/core/pipeline-dispatcher.ts`
   - `pipelines/versions/<mode>/index.ts`

## Active Work Guidance
- New API/validation logic -> `transport/`
- New pipeline behavior -> `pipelines/versions/`
- New prompt logic -> `prompts/blocks/`
- New structural safety logic -> `guardrails/`
- Model-call behavior -> `models/`
- Shared contracts only when truly reused -> `shared/`

## Quick Validation Commands
- `npm --workspace apps/vis-service run build`
- `npm --workspace apps/vis-service run test:contracts`
- `npm --workspace apps/web-sandbox run build`
