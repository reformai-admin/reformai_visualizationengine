# ReformAI Visualization Engine — Project README
**Last Updated:** 2026-04-28

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
│           ├── index.ts              ← Fastify server entry (Port 8080)
│           ├── pipelines/            # Future: Core visualization logic
│           ├── prompts/              ← Versioned prompt templates (Balanced V4.0)
│           └── services/             ← Pipeline implementations (v2, v3, v4.0)
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
- [Project Handoff Roadmap](file:///c:/Users/cjlea/.gemini/antigravity/brain/2a7630ca-048e-4816-abab-54fcbc517b7d/project_handoff_roadmap.md)
- [Dependency Audit & Revised Plan](file:///c:/Users/cjlea/.gemini/antigravity/brain/2a7630ca-048e-4816-abab-54fcbc517b7d/dependency_audit_and_revised_plan.md)
- `docs/reference-documents/V4_0_SYSTEM_AND_PRODUCT_SPEC.md`
