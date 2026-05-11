# ReformAI Visualization Engine

An AI visualization platform that transforms room photos into styled interior designs using Google Gemini.

## Quick Start

### 1. Prerequisites
- Node.js v20+
- Google Gemini API key

### 2. Install
```bash
npm install
```

### 3. Environment
Copy `.env.example` to `.env` and set `API_KEY`.

### 4. Run locally
```bash
npm run dev
```
- Frontend: `http://localhost:3333`
- Backend: `http://localhost:8080`

## Product/Governance Model
- Canonical active candidate: `balanced_v7`
- Compatibility alias path: `balanced_v6 -> balanced_v5`
- Historical/frozen benchmark modes remain available for comparison workflows.
- Historical anchor: `baseline_original`

Authoritative lifecycle/governance source:
- `docs/PLATFORM_STATUS.md`

## Repository Structure
- `apps/web-sandbox`: comparison-oriented sandbox UI
- `apps/vis-service`: backend dispatcher/orchestration/prompt system
- `docs`: architecture, governance, reference docs
- `tests`: regression and benchmarking workflows

## Validation Workflows
### vis-service contract checks (spawn-free)
```bash
cd apps/vis-service
npm run test:contracts
```

### Regression preflight profiles (Node, no Python required)
```bash
npm run regression:preflight
npm run regression:preflight:full
```

- `regression:preflight` validates fast canonical profile (`tests/regression/config.yaml`) in non-strict mode.
- `regression:preflight:full` validates full product-evolution benchmark matrix (`tests/regression/config.full_matrix.yaml`) in strict mode.

## Architecture
See:
- `ARCHITECTURE.md`
- `docs/PLATFORM_STATUS.md`
- `tests/regression/README.md`

## Deployment
Backend deploys to Cloud Run; frontend deploys to Netlify.

## License
Internal Use Only - ReformAI
