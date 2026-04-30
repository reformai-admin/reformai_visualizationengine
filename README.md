# ReformAI Visualization Engine

Welcome to the ReformAI Visualization testing project. This repository contains the tools and engine used to transform room photos into styled interior designs using advanced AI pipelines.

## 🏗️ Project Overview

This is a multi-pipeline AI visualization system designed for testing and evaluating different image-generation model configurations.

- **Sandbox UI:** A React-based interface for interactive testing and comparison.
- **Visualization Service:** A Fastify-powered backend that interfaces with Google Gemini.
- **Evaluation Suite:** Python-based regression testing and AI-driven prompt optimization.

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- Python 3.10+ (for testing suites)

### 2. Environment Variables
Copy `.env.example` to `.env` in the root and provide your API keys:
```bash
API_KEY=your_google_gemini_key       # Required for Visualization Service
ANTHROPIC_API_KEY=sk-ant-...         # Required for AI Evaluation/Optimization
```

### 3. Installation
Install dependencies for both the frontend and backend:
```bash
# Install Sandbox UI & Backend dependencies
cd reform-ai-vis-sandbox
npm install
cd reform-ai-image-visualization-service
npm install
```

### 4. Running the App
Start both services to begin testing:

**Start Backend (Port 8080):**
```bash
cd reform-ai-vis-sandbox/reform-ai-image-visualization-service
npm run dev
```

**Start Sandbox UI (Port 3333):**
```bash
cd reform-ai-vis-sandbox
npm run dev
```

## 🧪 Model Testing Workflow

1. Open the Sandbox UI at `http://localhost:3333`.
2. Upload a **Room Image**.
3. Select a **Room Type** and **Style Preset**.
4. Enable **Comparison Mode** to evaluate the "Baseline" vs "Improved" pipelines.
5. Review the **Response Metadata** and **Debug Output** to analyze model behavior.

## ☁️ Deployment

### Netlify (Frontend)
The Sandbox UI is optimized for Netlify deployment. 
1. Build command: `npm run build` (within the `reform-ai-vis-sandbox` directory)
2. Publish directory: `reform-ai-vis-sandbox/dist`
3. Environment variables needed: `VITE_API_URL` (pointing to your backend).

### Backend Service
The backend is designed to run as a containerized service (Google Cloud Run) or a standard Node.js server. 

## ⚖️ License
Internal Use Only — ReformAI
