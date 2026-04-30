# reform-ai-vis-sandbox

Internal developer sandbox for manually testing the `reform-ai-image-visualization-service` backend.
**Not for production use.**

---

## Folder structure

```
reform-ai-vis-sandbox/
├── index.html
├── package.json
├── vite.config.js          # proxies /generate-visualization → localhost:8080
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

Vite proxies all `/generate-visualization` and `/health` requests to `http://localhost:8080`
so there are no CORS issues during local testing.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Base URL of the visualization service backend |

Set in a `.env` file in this directory (copy from `.env.example`).

---

## Active Pipeline

| Field | Value |
|---|---|
| Pipeline mode | `balanced_v5` |
| Template version | `5.2.1` |
| Key behaviors | Moodboard as bounded modifier (tonal overlay); 6-tier constraint hierarchy; image role labeling; structural re-anchor |

Set `pipelineMode: 'balanced_v5'` in the request to use the current pipeline. Prior frozen pipelines (`balanced_v4_1`, `balanced_v4_0`, `balanced_v3_0`, `baseline_original`) remain routable for regression comparison.

---

## What you can test

| Input | Notes |
|---|---|
| Room image | Required. JPEG/PNG/WebP up to 10MB |
| Room type | Dropdown: Living Room, Bedroom, Kitchen, etc. |
| Style preset name | Free text + quick-pick buttons for all known presets |
| Style preset imageUrl | Field intentionally exposed — tests the dead-code path (imageUrl currently unused by backend) |
| Style influence slider | 0–100 with live bucket indicator (preset / blend / moodboard) |
| Moodboard images | Multiple upload, up to 10 |
| Furniture image (injected item) | Optional single image — shimmed to `injectedItems[0]` at service layer |
| Previous result image | Only sent when isRefinement is checked |
| isRefinement | Checkbox |
| Text prompt | Free text, optional |

---

## Result panel

- **Status bar** — idle / pinging / loading / success / error with elapsed time
- **Request summary** — exact values sent in the multipart request
- **Response metadata** — raw JSON from the backend
- **Generated image** — displayed full-width with a download button
- **Error response** — raw error JSON on failure

---

## Ping backend

Use the **ping /health** button in the top-right corner to confirm the backend is reachable
before submitting a generation request.
