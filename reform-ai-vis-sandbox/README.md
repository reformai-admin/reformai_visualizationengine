# reform-ai-vis-sandbox

Internal developer sandbox for manually testing the `reform-ai-image-visualization-service` backend.
**Not for production use.**

---

## Folder structure

```
reform-ai-vis-sandbox/
├── index.html
├── package.json
├── vite.config.js          # proxies /generate-visualization, /health, /api/catalogue → localhost:8080
├── .env.example
├── README.md
└── src/
    ├── main.jsx
    ├── index.css
    └── App.jsx             # entire UI — single file, no external UI libs
```

---

## Prerequisites

- Node.js 18+
- The visualization backend running locally on port 8080
  (`npm run dev` inside `reform-ai-image-visualization-service`)

---

## Setup

```bash
cd reform-ai-vis-sandbox
npm install

# Optional: copy env file if you need a custom backend URL
cp .env.example .env
```

---

## Run

```bash
npm run dev
```

Open: **http://localhost:3333**

Vite proxies all `/generate-visualization`, `/health`, and `/api/catalogue` requests to `http://localhost:8080`
so there are no CORS issues during local testing.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Base URL of the visualization service backend |

Set in a `.env` file in this directory (copy from `.env.example`).

---

## Pipeline Modes

Select the active pipeline from the **Pipeline** dropdown in the top-right header.

| Dropdown Label | Query Mode | Template | Notes |
|---|---|---|---|
| Balanced V5.1 (Lean — Moodboard) | `balanced_v5` | 5.2.1 | Current production candidate. No catalogue. |
| Balanced V6.0 (Service Provider Catalogue) | `balanced_v6` | 6.0.0 | V5.2.1 + Tier 2B Renovation Anchors. Shows catalogue panel. |
| Balanced V4.1 | `balanced_v4_1` | 4.1 | Frozen |
| Balanced V4.0 | `balanced_v4_0` | 4.0 | Frozen |
| Balanced V3.0 | `balanced_v3_0` | 3.1 | Frozen |
| Balanced V2.2 / V2.1 / V2 / V1 | `balanced_v2_x` | — | Frozen |
| Baseline Original | `baseline_original` | — | Frozen |
| Improved Current | `improved_current` | — | Frozen |

**Comparison Mode** (checkbox in header): runs Baseline Original and the selected pipeline in parallel, displaying results side by side.

`balanced_v6` internally routes to `balanced_v5` on the backend — the catalogue path activates only when `X-Contractor-Id` and `renovationSelectionIds` are present in the request.

---

## What you can test

### Baseline inputs (all pipeline modes)

| Input | Notes |
|---|---|
| Room image | Required. JPEG/PNG/WebP up to 10MB |
| Room type | Dropdown: Living Room, Bedroom, Kitchen, etc. |
| Style preset name | Free text + quick-pick buttons for all known presets |
| Style preset imageUrl | Exposed to test the dead-code path (imageUrl currently unused by backend) |
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

When V6.0 is active and items are selected, the request includes:
- Header: `X-Contractor-Id: <contractorId>`
- FormData field: `renovationSelectionIds` (JSON string)

When no items are selected, the request is identical to V5.1 — no header, no renovation field.

---

## Result panel

| Panel | Description |
|---|---|
| Status bar | idle / pinging / loading / success / error with elapsed time |
| Request summary | Exact values sent in the multipart request, including contractor ID and renovation IDs when active |
| Response metadata | Raw JSON from the backend |
| Generated image | Displayed full-width with a download button |
| Tier 2B Renovation Debug | V6.0 only — shows contractorId, anchorsInserted flag, anchor count, resolved promptDescriptions, and the full anchor block text sent to the model |
| Error response | Raw error JSON on failure |

---

## Ping backend

Use the **ping /health** button in the top-right corner to confirm the backend is reachable
before submitting a generation request.
