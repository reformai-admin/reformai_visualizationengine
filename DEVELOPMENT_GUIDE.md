# ReformAI Visualization Engine — Development Guide
**Last Updated:** 2026-05-04

---

## 🏗️ System Architecture

This project is a multi-pipeline AI visualization system that transforms room photos into styled interior designs using Google Gemini. It is structured into three main domains:

1. **Active Service (`/reform-ai-vis-sandbox`):** The current development workspace containing the Fastify backend and Vite frontend.
2. **Reference Baseline (`/Visualization_Engine_Baseline`):** The immutable production "Ground Truth" used as a benchmark for all regression testing.
3. **Test & Evaluation (`/tests`):** The regression suites, AI-evaluators, and prompt-optimization systems.

---

## 📂 Folder Structure & Roles

```text
Visualization_Engine/
├── netlify/
│   └── functions/
│       └── api.mjs               ← OIDC proxy: Netlify → Cloud Run (authenticated)
├── netlify.toml                  ← Netlify build, redirect, and function config
├── docs/                         ← Centralized project documentation
│   └── reference-documents/      ← Historical specs, PRDs, and audit reports
├── reform-ai-vis-sandbox/        ← ACTIVE DEVELOPMENT WORKSPACE
│   ├── src/                      ← Vite + React frontend (Dev Sandbox UI)
│   │   └── App.jsx               ← Entire sandbox UI (single file, no external UI libs)
│   ├── vite.config.js            ← Dev proxy: /generate-visualization, /health, /api/catalogue → localhost:8080
│   ├── package.json              ← Frontend deps (React, Vite)
│   └── reform-ai-image-visualization-service/
│       ├── Dockerfile            ← Container definition for Cloud Run deployment
│       ├── package.json          ← Backend deps (@google/genai, fastify, zod)
│       └── src/
│           ├── index.ts          ← Fastify server entry (Port 8080), CORS, multipart, /health, /api/catalogue
│           ├── controllers/
│           │   └── main.ts       ← POST /generate-visualization handler
│           ├── services/
│           │   ├── geminiService.ts      ← Pipeline dispatcher (routes by ?mode=)
│           │   ├── baseline/             ← baseline_original pipeline (frozen)
│           │   ├── improved/             ← improved_current pipeline (frozen)
│           │   ├── balanced/             ← balanced_v1 (frozen)
│           │   ├── balanced_v2/          ← balanced_v2 (frozen)
│           │   ├── balanced_v2_1/        ← balanced_v2_1 (frozen)
│           │   ├── balanced_v2_2/        ← balanced_v2_2 (frozen)
│           │   ├── balanced_v3_0/        ← balanced_v3_0 (frozen)
│           │   ├── balanced_v4_0/        ← balanced_v4_0 (frozen)
│           │   ├── balanced_v4_1/        ← balanced_v4_1 (frozen)
│           │   └── balanced_v5/          ← balanced_v5 ACTIVE (also handles v6 alias)
│           ├── prompts/
│           │   ├── imageRoles.ts         ← Image role label constants (V4.0+)
│           │   ├── baseline/             ← Baseline prompt constants
│           │   ├── improved/             ← Improved prompt constants
│           │   └── balanced_v5/          ← V5.x/V6.0 prompt constants + constraint builder
│           ├── data/
│           │   ├── styles.ts             ← Style registry (15 styles, model_inputs + pipeline_config)
│           │   └── catalogues.ts         ← In-memory contractor catalogue registry (V6.0 POC)
│           ├── utils/
│           │   ├── formdata.utils.ts     ← Multipart parsing, field validation, pipeline mode routing
│           │   ├── validation.utils.ts   ← Zod-based validators
│           │   └── catalogue.utils.ts    ← V6.0 translation layer: IDs → validated promptDescriptions
│           ├── schemas/
│           │   └── visualization.schema.ts ← Zod schema for all request fields
│           └── types.ts                  ← Shared TypeScript types
├── Visualization_Engine_Baseline/ ← IMMUTABLE REFERENCE BASELINE (do not modify)
├── tests/                          ← TEST & EVALUATION INFRASTRUCTURE
│   ├── regression/                 ← 15-style matrix regression runner
│   ├── bedroom_regression/         ← Isolated bedroom test suite
│   └── visualization_ab/           ← Historical A/B experiments
├── runs/                           ← [GIT IGNORED] Generated reports & images
├── fixtures/                       ← [FUTURE] Centralized test input images
├── .env                            ← [GIT IGNORED] Root API keys (Anthropic)
├── CURRENT_STATE.md                ← Top-level status: pipelines, deployment, open items
├── LESSONS_LEARNED.md              ← Engineering decisions, failure modes, rules
├── DEVELOPMENT_GUIDE.md            ← This file — folder structure and workflows
└── README.md                       ← Project overview + quickstart
```

---

## 🚦 Getting Started (Local)

### 1. Environment Setup

**Root `.env`** (copy from `.env.example`):
```
ANTHROPIC_API_KEY=sk-ant-...  # Required for Regression AI Eval
API_BASE_URL=http://localhost:8080
```

**Backend `.env`** (`reform-ai-vis-sandbox/reform-ai-image-visualization-service/.env`):
```
API_KEY=your_google_gemini_api_key
```

### 2. Start the Backend
```bash
cd reform-ai-vis-sandbox/reform-ai-image-visualization-service
npm install
npm run dev
# Server starts at http://localhost:8080
```

### 3. Start the Sandbox UI
```bash
cd reform-ai-vis-sandbox
npm install
npm run dev
# Sandbox at http://localhost:3333
```

---

## ☁️ Deployed Environment

### How It Works
1. User opens the Netlify-hosted sandbox URL
2. API request hits Netlify CDN → redirected to `/.netlify/functions/api`
3. `api.mjs` generates an OIDC token from `GOOGLE_SERVICE_ACCOUNT_KEY`
4. Request forwarded (with `Authorization: Bearer <token>`) to Cloud Run
5. Cloud Run's Fastify server processes the request and calls Gemini
6. Response flows back through the same chain

### Required Secrets (Netlify Dashboard → Environment Variables)
| Variable | Value |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Full JSON string of the GCP service account key |

### Required Secrets (Cloud Run → Edit & Deploy → Environment Variables)
| Variable | Value |
|---|---|
| `API_KEY` | Google Gemini API key |

### Re-deploying the Backend (Cloud Run)
The frontend auto-deploys via Netlify on push to `main`. The **backend does not auto-deploy** — it requires a manual Cloud Run deployment when the Fastify source changes:

```bash
cd reform-ai-vis-sandbox/reform-ai-image-visualization-service
gcloud run deploy reform-ai-vis \
  --source . \
  --region us-central1
```

Or push a new Docker image to Artifact Registry and update the Cloud Run revision.

> ⚠️ **Important:** After a Cloud Run redeploy, the sandbox must be tested end-to-end. Use the health ping button in the UI to confirm connectivity before testing generation.

---

## 🧪 Testing & Optimization

### Run Regression Suites
```bash
# Main 15-style regression
cd tests/regression
python run_regression.py

# Bedroom regression
cd tests/bedroom_regression
python run_regression.py
```

Reports are saved to `tests/*/outputs/run_YYYYMMDD_.../`.

### AI Evaluation & Prompt Optimization
The regression suite automatically triggers the Prompt Optimizer if `ANTHROPIC_API_KEY` is set. It generates:
- `report.html` — visual grid of all outputs with scores
- `optimization_advice.md` — AI-generated suggestions for prompt improvements

---

## ⚖️ Baseline vs. Active Service

| Folder | Purpose | Developer Rule |
| :--- | :--- | :--- |
| `/reform-ai-vis-sandbox` | Active feature development | **OK TO MODIFY** |
| `/Visualization_Engine_Baseline` | Reference benchmark | **DO NOT MODIFY** — Immutable comparative ground truth |

---

## 🛠️ Key Reference Docs

| Document | Location | Purpose |
|---|---|---|
| V4.0 System & Product Spec | `docs/reference-documents/V4_0_SYSTEM_AND_PRODUCT_SPEC.md` | Canonical architecture spec (V4.0 → V5.x → V6.0) |
| Active pipeline tracker | `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/CURRENT_STATE.md` | Per-version release notes, open items, V6 test plan |
| V5 compression changelog | `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/V5_COMPRESSION_CHANGELOG.md` | Full V5.1 compression detail |
| Lessons Learned | `LESSONS_LEARNED.md` | Engineering lessons V1 → deployment |
| Current State | `CURRENT_STATE.md` | Pipeline + deployment status summary |
