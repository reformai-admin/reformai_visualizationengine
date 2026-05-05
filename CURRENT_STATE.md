# ReformAI Visualization Engine — Current State
**Last Updated:** 2026-05-04

---

## 🚦 System Status: 🟢 FULLY OPERATIONAL (Local + Deployed)

| Environment | Status | URL |
|---|---|---|
| Local (dev) | ✅ Operational | `http://localhost:3333` |
| Deployed (Netlify + Cloud Run) | ✅ Operational | Netlify auto-deploy from `main` |

---

## 1. Deployment Architecture

```
Browser → Netlify CDN → netlify/functions/api.mjs → Cloud Run → Gemini API
```

- **Frontend:** Netlify. Builds from `reform-ai-vis-sandbox/`. Auto-deploys on push to `main`.
- **Backend:** Google Cloud Run (`us-central1`). URL: `https://reform-ai-vis-646800391584.us-central1.run.app`. Private (requires OIDC auth).
- **Auth:** `netlify/functions/api.mjs` generates an OIDC token from `GOOGLE_SERVICE_ACCOUNT_KEY` (env var in Netlify) and forwards it as `Authorization: Bearer <token>` to Cloud Run.
- **Proxy:** The Netlify function forwards the full request (including query params like `?mode=balanced_v5` and the binary multipart body) to Cloud Run. Binary body is decoded from base64 using latin1 fallback to prevent image data corruption.
- **Model:** `gemini-2.5-flash-image` — image generation with `responseModalities: [IMAGE]`.

### Known Proxy Behavior
- Netlify Functions receive binary bodies as base64 (`event.isBase64Encoded = true`). The proxy decodes using `Buffer.from(body, 'base64')`. If `isBase64Encoded` is false (edge case), latin1 encoding is used as a lossless fallback.
- Query parameters ARE forwarded (`?mode=...`). This is required — the backend uses `?mode` to route to the correct pipeline. **Stripping this query param causes the backend to default to `improved_current` and may produce NO_IMAGE errors.**
- The `/health` endpoint is proxied and can be pinged from the sandbox UI to confirm Cloud Run connectivity.

---

## 2. Pipeline Status

| Pipeline | Template | Status | Role |
| :--- | :--- | :--- | :--- |
| `balanced_v5` | **5.2.1** | ✅ **Active — production candidate** | Moodboard-aware; overlay relationship mode; structural anchoring |
| `balanced_v6` | **6.0.0** | 🧪 **POC — Tier 2B Renovation Anchors** | V5.2.1 + contractor catalogue material selections (prompt-only) |
| `balanced_v4_1` | 4.1 | 🔒 Frozen | ~21% compression vs V4.0; signature elements |
| `balanced_v4_0` | 4.0 | 🔒 Frozen | Constraint hierarchy + image role labeling introduced |
| `balanced_v3_0` | 3.1 | 🔒 Frozen | Template-driven injection; density registry |
| `baseline_original` | — | 🔒 Frozen | Untouched production baseline (regression anchor) |
| `improved_current` | — | 🔒 Frozen | Fallback default; phase-anchoring sandwich |

`balanced_v6` is a sandbox alias — it routes to `balanced_v5` internally. The Tier 2B catalogue path activates only when `X-Contractor-Id` header + `renovationSelectionIds` FormData field are present.

Full version history: `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/CURRENT_STATE.md`

---

## 3. What Has Been Built

### Netlify Deployment (2026-05-04)
- Cloud Run backend connected to Netlify via authenticated OIDC proxy
- `netlify/functions/api.mjs` — generates GCP OIDC token, forwards full request (path + query + binary body) to Cloud Run
- `netlify.toml` — build config, 26s function timeout, redirects for `/generate-visualization`, `/health`, `/api/catalogue`
- Fixed: query param stripping bug (`?mode=` was being dropped, causing all production requests to run the wrong pipeline)
- Fixed: binary body handling (latin1 fallback prevents multipart image data corruption)
- Fixed: `/api/catalogue` redirect was missing from production config

### Sandbox UI Cleanup (2026-05-04)
- Default style preset changed from `Scandinavian` (not in registry) → `Modern`
- "Preset Image URL" field removed (dead code — `imageUrl` is unused by the backend)
- `improved_current` pipeline updated to use `IMAGE_ROLES` labels (same as `balanced_v5`) for consistent model behavior

### V6.0 — Tier 2B Renovation Material Anchors (2026-05-04)
- New constraint tier (Tier 2B) between Tier 2 (injected items) and Tier 3 (room function)
- Multi-tenant contractor catalogue: `X-Contractor-Id` header scopes items per contractor
- Translation layer: `RenovationSelectionIds` → 6-rule validation → `ResolvedRenovationSelections` → Tier 2B anchor block
- `/api/catalogue` GET endpoint returns active, visible items for a contractor
- Backward compatible: V5.2.1 output is bit-identical when no renovation fields are sent

### V4.0 → V5.2.1 — Core Pipeline Development
- V4.0: 6-tier constraint system, image role labeling, InjectedItem model
- V4.1: 21% prompt compression, signature elements
- V5.0–V5.1: Moodboard as bounded modifier (TIER 5), scope block, 36–40% compression
- V5.2: TIER 1 hardened (window/door count immutable), structural violations → 0
- V5.2.1 Hybrid C: Material leakage closed; floor-vs-ceiling paradox resolved via overlay mode

---

## 4. Test Infrastructure

| Suite | Location | Coverage |
| :--- | :--- | :--- |
| Main regression (15 styles) | `tests/regression/` | Style quality, structural integrity, density |
| Bedroom regression | `tests/bedroom_regression/` | Bedroom-specific style + density |
| Moodboard regression | `tests/moodboard_regression/` | Bounded modifier behavior; V5.x moodboard validation |

**Next required run:** V5.2.1 moodboard regression to confirm Hybrid C fixes.
**V6.0 validation:** T1–T10 test plan pending (see `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/CURRENT_STATE.md`).

---

## 5. Project Map

### Active Service (`/reform-ai-vis-sandbox`)
- **Backend:** Fastify server (Port 8080) — `reform-ai-vis-sandbox/reform-ai-image-visualization-service`
- **Frontend:** Vite sandbox (Port 3333) — `reform-ai-vis-sandbox`
- **Deployed backend:** Google Cloud Run (same codebase, containerized via `Dockerfile`)
- **Deployed frontend:** Netlify (builds `reform-ai-vis-sandbox/dist`)

### Reference Baseline (`/Visualization_Engine_Baseline`)
Ground-truth production code. Used for regression comparison only. **Do not modify.**

### Deployment Files
- `netlify.toml` — Netlify build + redirect configuration
- `netlify/functions/api.mjs` — OIDC proxy function
- `reform-ai-vis-sandbox/reform-ai-image-visualization-service/Dockerfile` — Cloud Run container

### Documentation
- `docs/reference-documents/V4_0_SYSTEM_AND_PRODUCT_SPEC.md` — canonical architecture spec
- `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/CURRENT_STATE.md` — live pipeline version tracker
- `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/V5_COMPRESSION_CHANGELOG.md` — V5.x compression detail

---

## 6. Immutable Anchors (Do Not Modify)

- `/Visualization_Engine_Baseline` — Benchmarking source
- All frozen pipeline service files (`balanced_v3_0`, `balanced_v4_0`, `balanced_v4_1`)
- `BALANCED_V5_STRUCTURAL_PART` — Structural protocol; requires full re-validation if changed
