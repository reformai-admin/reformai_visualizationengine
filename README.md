# ReformAI Visualization Engine

Internal developer sandbox for testing and evaluating the ReformAI image visualization pipelines. Transforms room photos into styled interior designs using Google Gemini.

---

## 🏗️ Architecture Overview

```
[Browser]
   │
   ├── Local:    Vite proxy (port 3333) → Fastify backend (port 8080) → Gemini API
   │
   └── Deployed: Netlify CDN → Netlify Function (api.mjs OIDC proxy) → Cloud Run → Gemini API
```

### Components

| Component | Local | Deployed |
|---|---|---|
| Frontend (Sandbox UI) | `localhost:3333` (Vite dev server) | Netlify CDN |
| Backend (Fastify) | `localhost:8080` | Google Cloud Run (`us-central1`) |
| Auth | None (local) | OIDC token via service account (Netlify Function → Cloud Run) |
| Image Proxy | Vite's built-in proxy | `netlify/functions/api.mjs` |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js v20+
- Python 3.10+ (for regression test suites)

### Environment Variables

**Root `.env`** (copy from `.env.example`):
```
ANTHROPIC_API_KEY=sk-ant-...   # AI regression eval + optimization
API_BASE_URL=http://localhost:8080
```

**Backend `.env`** (`reform-ai-vis-sandbox/reform-ai-image-visualization-service/.env`):
```
API_KEY=your_google_gemini_api_key
```

### Start the Backend (Port 8080)
```bash
cd reform-ai-vis-sandbox/reform-ai-image-visualization-service
npm install
npm run dev
```

### Start the Sandbox UI (Port 3333)
```bash
cd reform-ai-vis-sandbox
npm install
npm run dev
```

Open: **http://localhost:3333**

Vite proxies `/generate-visualization`, `/health`, and `/api/catalogue` to `http://localhost:8080`. No CORS issues locally.

---

## ☁️ Deployment

### Stack
- **Frontend:** Netlify (auto-deploys from `main` branch)
- **Backend:** Google Cloud Run — `reform-ai-vis-646800391584.us-central1.run.app`
- **Auth:** Cloud Run is private (requires authentication). A Netlify Function acts as an authenticated proxy using a Google Service Account with OIDC token generation.

### Netlify Configuration (`netlify.toml`)
```toml
[build]
  command = "cd reform-ai-vis-sandbox && npm install && npm run build"
  publish = "reform-ai-vis-sandbox/dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[functions.api]
  timeout = 26
```

Redirects: `/generate-visualization`, `/health`, `/api/catalogue` → `/.netlify/functions/api`

### Netlify Environment Variables (set in Netlify Dashboard)
| Variable | Description |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Full JSON of the GCP service account key (used for OIDC token generation) |

### Cloud Run Environment Variables (set in Cloud Run Console)
| Variable | Description |
|---|---|
| `API_KEY` | Google Gemini API key |
| `PORT` | `8080` (default) |

### Deploying Backend to Cloud Run
The backend is containerized. To push a new image:
```bash
cd reform-ai-vis-sandbox/reform-ai-image-visualization-service
# Build and push to Google Artifact Registry, then deploy to Cloud Run
gcloud run deploy reform-ai-vis \
  --source . \
  --region us-central1 \
  --allow-unauthenticated=false
```

### Deploying Frontend
Push to `main` → Netlify auto-builds and deploys. No manual step needed.

---

## 🧪 Pipeline Modes

Select from the dropdown in the sandbox header:

| Pipeline | Status | Notes |
|---|---|---|
| `balanced_v5` | ✅ Active (production candidate) | V5.2.1 — Moodboard overlay, structural anchoring |
| `balanced_v6` | 🧪 POC | V5.2.1 + Tier 2B renovation material anchors |
| `balanced_v4_1` | 🔒 Frozen | — |
| `balanced_v4_0` | 🔒 Frozen | — |
| `balanced_v3_0` | 🔒 Frozen | — |
| `balanced_v2_2` / `v2_1` / `v2` / `v1` | 🔒 Frozen | — |
| `baseline_original` | 🔒 Frozen | Regression anchor |
| `improved_current` | 🔒 Frozen | Fallback default |

**Comparison Mode:** Runs `baseline_original` and the selected pipeline in parallel, side by side.

---

## 🧪 Running Tests

### Bedroom Regression
```bash
cd tests/bedroom_regression
python run_regression.py
```

### Main Style Regression (15-style matrix)
```bash
cd tests/regression
python run_regression.py
```

Reports saved to `tests/*/outputs/run_YYYYMMDD_.../`.

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `netlify/functions/api.mjs` | OIDC proxy — authenticates Netlify → Cloud Run |
| `netlify.toml` | Netlify build + redirect config |
| `reform-ai-vis-sandbox/src/App.jsx` | Entire sandbox UI (single file) |
| `reform-ai-vis-sandbox/reform-ai-image-visualization-service/src/index.ts` | Fastify server entry |
| `reform-ai-vis-sandbox/reform-ai-image-visualization-service/src/services/geminiService.ts` | Pipeline dispatcher |
| `CURRENT_STATE.md` | Pipeline status + what has been built |
| `LESSONS_LEARNED.md` | Engineering decisions and failure modes |
| `DEVELOPMENT_GUIDE.md` | Full folder structure reference |

---

## ⚖️ License
Internal Use Only — ReformAI
