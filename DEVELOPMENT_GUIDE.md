# ReformAI Visualization Engine — Project README
**Last Updated:** 2026-05-04

---

## 🏗️ System Architecture

This project is a multi-pipeline AI visualization system that transforms room photos into styled interior designs using Google Gemini. It is structured into three main domains:

1.  **Active Service (`/reform-ai-vis-sandbox`):** The current development workspace containing the Fastify backend and Vite frontend.
2.  **Reference Baseline (`/Visualization_Engine_Baseline`):** The immutable production "Ground Truth" used as a benchmark for all regression testing.
3.  **Test & Evaluation (`/tests`):** The regression suites, AI-evaluators, and prompt-optimization systems.

---

## 📂 Folder Structure & Roles

```text
Visualization_Engine/
├── docs/                             ← Centralized project documentation
│   └── reference-documents/          ← Historical specs, PRDs, and audit reports
├── reform-ai-vis-sandbox/            ← ACTIVE DEVELOPMENT WORKSPACE
│   ├── src/                          ← Vite + React frontend (Dev Sandbox UI)
│   └── reform-ai-image-visualization-service/
│       └── src/
│           ├── index.ts              ← Fastify server entry (Port 8080) + /api/catalogue route
│           ├── data/
│           │   └── catalogues.ts     ← In-memory contractor catalogue registry (POC)
│           ├── utils/
│           │   └── catalogue.utils.ts← Translation layer: IDs → validated promptDescriptions
│           ├── prompts/              ← Versioned prompt templates
│           └── services/             ← Pipeline implementations (v2, v3, v4.0, v5/v6)
├── Visualization_Engine_Baseline/    ← IMMUTABLE REFERENCE BASELINE
├── tests/                            ← TEST & EVALUATION INFRASTRUCTURE
│   ├── regression/                   ← Shared regression runner (15-style matrix)
│   ├── bedroom_regression/           ← Isolated bedroom test suite
│   └── visualization_ab/             ← Historical A/B experiments
├── runs/                             ← [GIT IGNORED] Generated reports & images
├── fixtures/                         ← [FUTURE] Centralized test input images
├── .env                              ← [GIT IGNORED] API Keys (Anthropic, Google)
└── README.md                         ← This file
```

---

## 🚦 Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env` and provide your API keys:
```bash
ANTHROPIC_API_KEY=sk-ant-...  # Required for Regression AI Eval
API_KEY=your_google_key       # Required for Visualization Service
```

### 2. Start the Backend
```bash
cd reform-ai-vis-sandbox/reform-ai-image-visualization-service
npm install
npm run dev
# Server starts at http://localhost:8080
```

### 3. Start the UI Sandbox
```bash
cd reform-ai-vis-sandbox
npm install
npm run dev
# Sandbox UI available at http://localhost:3333
```

---

## 🧪 Testing & Optimization

### Run Bedroom Regression
This compares **Baseline** vs **Balanced V4.0** across all 15 styles for a bedroom image.
```bash
cd tests/bedroom_regression
python run_regression.py
```

### Run AI Evaluation & Prompt Optimization
The regression suite automatically triggers the **Prompt Optimizer** if an `ANTHROPIC_API_KEY` is present. It will generate a report at `outputs/run_YYYYMMDD_.../report.html` which includes AI-driven advice for improving the prompt templates.

---

## ⚖️ Baseline vs. Active Service

| Folder | Purpose | Developer Rule |
| :--- | :--- | :--- |
| `/reform-ai-vis-sandbox` | Active feature development | **OK TO MODIFY** — This is where V4.0+ lives. |
| `/Visualization_Engine_Baseline` | Reference benchmark | **DO NOT MODIFY** — Immutable comparative ground truth. |

---

## 🛠️ Key Reference Docs

| Document | Location | Purpose |
|---|---|---|
| V4.0 System & Product Spec | `docs/reference-documents/V4_0_SYSTEM_AND_PRODUCT_SPEC.md` | Canonical architecture spec (V4.0 → V5.x → V6.0 appendix) |
| Phase 1 Playbook | `docs/reference-documents/VISUALIZATION_PHASE_1_PLAYBOOK.md` | Historical execution plan (status: complete) |
| Active pipeline tracker | `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/CURRENT_STATE.md` | Per-version release notes, open items, T1–T10 test plan |
| V5 compression changelog | `reform-ai-vis-sandbox/reform-ai-image-visualization-service/docs/V5_COMPRESSION_CHANGELOG.md` | V5.1 compression detail |
| Lessons Learned | `LESSONS_LEARNED.md` | Engineering lessons V1 → V6.0 |
| Current State | `CURRENT_STATE.md` | Top-level pipeline status summary |
