# vis-service

Fastify backend for the Visualization Engine.

## Canonical and Comparison Modes
- Canonical active candidate: `balanced_v7`
- Compatibility alias path: `balanced_v6 -> balanced_v5`
- Historical/frozen benchmark modes remain callable for comparison workflows.

Authoritative lifecycle source: `../../docs/PLATFORM_STATUS.md`

## Dispatcher Semantics
- Request mode is resolved in `src/services/pipelineRouting.ts`.
- Omitted mode defaults to `balanced_v7`.
- `balanced_v6` keeps log-mode identity but resolves to `balanced_v5` handler execution.

## Prompt and Orchestration Consolidation
- Shared runtime primitives: `src/services/shared/*`
- Shared prompt contracts/primitives: `src/prompts/shared/*`
- V7 AGT and conflict layers are composed on top of shared primitives.

## API
### Generate visualization
```http
POST /generate-visualization?mode=<pipeline>
```
`mode` is optional; default is `balanced_v7`.

### Catalogue endpoint
```http
GET /api/catalogue
Header: X-Contractor-Id: <contractorId>
```

## Validation Commands
### Build
```bash
npm run build
```

### Spawn-free contract checks
```bash
npm run test:contracts
```

Contract checks include:
- mode routing/default behavior
- V6 alias log-mode/handler-mode parity
- AGT confidence classification behavior
- canonical prompt block ordering
- V7 AGT hierarchy insertion behavior

## Regression Profiles (repo root)
- Fast canonical preflight: `npm run regression:preflight`
- Full benchmark-matrix preflight: `npm run regression:preflight:full`
