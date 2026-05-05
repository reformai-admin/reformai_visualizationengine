# reform-ai-vis-sandbox

Internal developer sandbox for manually testing the `reform-ai-image-visualization-service` backend.
**Not for production use.**

---

## Architecture

```
Local:    Browser → Vite (port 3333) → [proxy] → Fastify (port 8080) → Gemini
Deployed: Browser → Netlify CDN → netlify/functions/api.mjs → Cloud Run → Gemini
```

---

## Folder Structure

```
reform-ai-vis-sandbox/
├── index.html
├── package.json
├── vite.config.js          # Dev proxy: /generate-visualization, /health, /api/catalogue → localhost:8080
├── .env.example            # Copy to .env and set VITE_API_URL if needed
└── src/
    ├── main.jsx
    ├── index.css
    └── App.jsx             # Entire UI — single file, no external UI libs
```

---

## Prerequisites

- Node.js 20+
- The visualization backend running locally on port 8080
  (`npm run dev` inside `reform-ai-image-visualization-service`)

---

## Setup

```bash
cd reform-ai-vis-sandbox
npm install
```

---

## Run

```bash
npm run dev
```

Open: **http://localhost:3333**

Vite proxies all `/generate-visualization`, `/health`, and `/api/catalogue` requests to `http://localhost:8080` — no CORS issues in local dev.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Base URL of the visualization service backend |

Set in a `.env` file in this directory (copy from `.env.example`).

---

## Pipeline Modes

Select the active pipeline from the **Pipeline** dropdown in the top-right header.

| Dropdown Label | Query Mode (`?mode=`) | Notes |
|---|---|---|
| Balanced V5.1 (Lean — Moodboard) | `balanced_v5` | **Current production candidate.** V5.2.1 |
| Balanced V6.0 (Service Provider Catalogue) | `balanced_v6` | V5.2.1 + Tier 2B Renovation Anchors. Shows catalogue panel. |
| Balanced V4.1 | `balanced_v4_1` | Frozen |
| Balanced V4.0 | `balanced_v4_0` | Frozen |
| Balanced V3.0 | `balanced_v3_0` | Frozen |
| Balanced V2.2 / V2.1 / V2 / V1 | `balanced_v2_x` | Frozen |
| Baseline Original | `baseline_original` | Frozen — regression anchor |
| Improved Current | `improved_current` | Frozen — fallback default |

**Comparison Mode** (checkbox): runs Baseline Original and the selected pipeline in parallel, side by side.

`balanced_v6` internally routes to `balanced_v5` on the backend — the catalogue path activates only when `X-Contractor-Id` and `renovationSelectionIds` are present in the request.

> ⚠️ The `?mode=` query parameter is **required** by the backend for pipeline routing. Never strip it when proxying. Losing it causes the backend to default to `improved_current` regardless of what was selected.

---

## Style Presets

The following presets are registered in the backend style registry and fully supported:

`Modern` · `Contemporary` · `Minimalist` · `Industrial` · `Midcentury Modern` · `Farmhouse` · `Coastal` · `Japandi` · `Rustic` · `Bohemian` · `Biophilic` · `French Country` · `Japanese` · `Neoclassic` · `Vintage`

The default is **Modern**. Entering a preset name not in this list will still work (the request is sent) but the backend will not enrich the style with `model_inputs` — prompt quality degrades significantly.

---

## What You Can Test

### Baseline Inputs (all pipeline modes)

| Input | Notes |
|---|---|
| Room image | Required. JPEG/PNG/WebP up to 10MB |
| Room type | Dropdown: Living Room, Bedroom, Kitchen, etc. |
| Style preset name | Free text + quick-pick buttons for all registered presets |
| Moodboard images | Multiple upload, up to 10 |
| Furniture image (injected item) | Optional single image — shimmed to `injectedItems[0]` at service layer |
| Previous result image | Only sent when isRefinement is checked |
| isRefinement | Checkbox |
| Text prompt | Free text, optional |

### V6.0 — Service Provider Catalogue (visible only when Balanced V6.0 is selected)

| Input | Notes |
|---|---|
| Contractor ID | Defaults to `contractor_demo`. Used as `X-Contractor-Id` header. |
| Load button | Fetches `/api/catalogue` and populates category-grouped item cards |
| Item selection | Click a card to select it for that category (one per category). Click again to deselect. |
| Per-category clear | × clear button removes the selection for that category |
| Request preview | Live JSON showing the `X-Contractor-Id` header and `renovationSelectionIds` that will be sent |

When V6.0 is active and items are selected:
- Header: `X-Contractor-Id: <contractorId>`
- FormData field: `renovationSelectionIds` (JSON string)

When no items are selected, the request is identical to V5.1 — no header, no renovation field.

---

## Result Panel

| Panel | Description |
|---|---|
| Status bar | idle / pinging / loading / success / error with elapsed time |
| Request summary | Exact values sent in the multipart request |
| Response metadata | Raw JSON from the backend |
| Generated image | Displayed full-width with a download button |
| Tier 2B Renovation Debug | V6.0 only — contractorId, anchorsInserted, anchor count, resolved descriptions, full anchor block |
| Error response | Raw error JSON on failure |

---

## Ping Backend

Use the **ping /health** button in the top-right corner to confirm the backend is reachable before submitting a generation request. In the deployed environment, this confirms the full Netlify → Cloud Run connection including OIDC auth.
