#!/usr/bin/env python3
"""
Prompt Optimizer
Analyzes regression test manifests and suggests improvements to the prompt templates
by sending failures and rationales to Claude.
"""

import json
import os
import sys
from pathlib import Path
import yaml
import anthropic
from dotenv import load_dotenv

# ── paths ─────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).parent.parent.parent
PROMPT_CONSTANTS_FILE = REPO_ROOT / "reform-ai-vis-sandbox" / "reform-ai-image-visualization-service" / "src" / "prompts" / "balanced_v4_0" / "visualization.constants.ts"
CONFIG_FILE = Path(__file__).parent / "config.yaml"

# Load environment variables from project root
load_dotenv(REPO_ROOT / ".env")

# ── logic ─────────────────────────────────────────────────────────────────────

def load_manifest(run_dir):
    manifest_path = Path(run_dir) / "manifest.json"
    if not manifest_path.exists():
        print(f"Error: manifest.json not found in {run_dir}")
        sys.exit(1)
    with open(manifest_path) as f:
        return json.load(f)

def load_prompt_templates():
    if not PROMPT_CONSTANTS_FILE.exists():
        return "Could not locate prompt constants file."
    return PROMPT_CONSTANTS_FILE.read_text()

def summarize_failures(manifest, target_slug="v4_0"):
    failures = []
    regressions = []
    
    for case in manifest["cases"]:
        # Check validity
        validity = case.get("validity", {}).get(target_slug, {})
        if validity.get("verdict") == "FAIL":
            failures.append({
                "case": f"{case['room']} + {case['style']}",
                "violations": validity.get("violations"),
                "rationale": validity.get("rationale")
            })
            
        # Check AI eval
        ae = case.get("ai_evaluation")
        if ae:
            winner = ae.get("winner")
            # If Baseline won OR it was a Tie, we look for improvements
            if winner in ("Baseline", "baseline", "Tie / subjective"):
                regressions.append({
                    "case": f"{case['room']} + {case['style']}",
                    "ai_rationale": ae.get("rationale"),
                    "key_regression": ae.get("key_regression") or "Tie/Subjective - looking for edge over baseline",
                    "v4_score": ae.get("newest_build", {}).get("weighted_score"),
                    "baseline_score": ae.get("baseline", {}).get("weighted_score")
                })
                
    return failures, regressions

def generate_optimization_advice(failures, regressions, templates, api_key):
    client = anthropic.Anthropic(api_key=api_key)
    
    failure_text = "\n".join([f"- {f['case']}: {', '.join(f['violations'])} ({f['rationale']})" for f in failures])
    regression_text = "\n".join([f"- {r['case']}: V4 scored {r['v4_score']} vs Baseline {r['baseline_score']}. Rationale: {r['ai_rationale']} Regression: {r['key_regression']}" for r in regressions])

    prompt = f"""\
You are an expert Prompt Engineer for a generative AI visualization pipeline.
We have run a regression test comparing our 'Baseline' to our new 'Balanced V4.0' pipeline.

Below are the findings for V4.0 where it either failed hard validity rules or regressed compared to the baseline.

### HARD VALIDITY FAILURES (V4.0):
{failure_text if failures else "None"}

### AI SCORING REGRESSIONS (V4.0 vs Baseline):
{regression_text if regressions else "None"}

### CURRENT V4.0 PROMPT TEMPLATES (TypeScript Constants):
```typescript
{templates}
```

### TASK:
Analyze the failures and regressions. Suggest specific wording changes, new constraints, or structural adjustments to the V4.0 prompt templates (BALANCED_V4_0_STYLE_TEMPLATE or buildConstraintHierarchyBlock) to resolve these issues.

Focus on:
1. Preventing architectural drift (windows/walls).
2. Improving style fidelity for the specific styles that struggled.
3. Enhancing material contrast.

Return your advice in a clear, actionable format with specific "Before" and "After" snippets.
"""

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text

def main():
    if len(sys.argv) < 2:
        print("Usage: python optimize_prompts.py <run_outputs_dir>")
        sys.exit(1)
        
    run_dir = sys.argv[1]
    
    # Load API key from environment
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set.")
        print("Please copy .env.example to .env and provide your key.")
        sys.exit(1)

    print(f"Analyzing run: {run_dir}...")
    manifest = load_manifest(run_dir)
    failures, regressions = summarize_failures(manifest)
    
    print(f"Found {len(failures)} validity failures and {len(regressions)} regressions.")
    
    if not failures and not regressions:
        print("No issues found to optimize!")
        return

    templates = load_prompt_templates()
    
    print("\nConsulting Claude for optimization advice...")
    advice = generate_optimization_advice(failures, regressions, templates, api_key)
    
    output_file = Path(run_dir) / "optimization_advice.md"
    output_file.write_text(advice, encoding='utf-8')
    
    print(f"\nOptimization advice saved to: {output_file}")
    print("\n--- ADVICE SUMMARY ---")
    print(advice[:1000] + "...")

if __name__ == "__main__":
    main()
