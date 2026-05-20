#!/usr/bin/env python3
"""
Moodboard Regression Test Runner — V5.1
Validates moodboard-as-bounded-modifier behavior for pipelineMode 'balanced_v5'.

Single pipeline (no head-to-head comparison). Each case is:
  room fixture + style preset + moodboard image → V5.1 output

Evaluation framework per case:
  1. Structural Integrity   — PASS/FAIL hard gate (validity classifier)
  2. Style Dominance        — 1–5
  3. Moodboard Influence    — Presence (1–5), Strength, Scope Compliance (PASS/FAIL)
  4. Conflict Resolution    — PASS/PARTIAL/FAIL
  5. Composition Strength   — 1–5
  6. Density Accuracy       — 1–5

Post-run:
  7. Consistency Analysis   — CONSISTENT/MINOR_DRIFT/MAJOR_DRIFT for repeated styles
  8. Optimization Advice    — AI-generated prompt recommendations

Usage:
    python run_moodboard.py                          # run all cases + AI eval + report
    python run_moodboard.py --skip-ai                # run generation only
    python run_moodboard.py --report-only <run_dir>  # regenerate report from manifest
    python run_moodboard.py --eval-only   <run_dir>  # re-run AI eval on existing outputs
    python run_moodboard.py --advice-only <run_dir>  # regenerate optimization advice + report only
"""

import base64
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import requests
import yaml
from dotenv import load_dotenv

# ── paths ─────────────────────────────────────────────────────────────────────
TESTS_DIR    = Path(__file__).parent
ROOT         = TESTS_DIR.parent.parent
FIXTURES_DIR = TESTS_DIR / "fixtures"
ROOMS_DIR    = FIXTURES_DIR / "rooms"
MOODS_DIR    = FIXTURES_DIR / "moodboards"
OUTPUTS_DIR  = TESTS_DIR / "outputs"
CONFIG_FILE  = TESTS_DIR / "configs" / "moodboard_suite.yaml"
SERVICE_DIR  = ROOT / "apps" / "vis-service"
PROMPT_FILE  = SERVICE_DIR / "src" / "prompts" / "balanced_v5" / "visualization.constants.ts"

load_dotenv(ROOT / ".env", override=True)

# ── image util ────────────────────────────────────────────────────────────────

MAX_EVAL_PX  = 1500   # long-edge cap for AI evaluation images
EVAL_QUALITY = 85     # JPEG quality for re-encoded eval images

def load_image_b64(path, max_px=MAX_EVAL_PX):
    """Load an image, downscale if necessary, return (base64, mime).
    Always re-encodes as JPEG to stay within the 5 MB Claude API limit."""
    from PIL import Image
    import io

    img = Image.open(path).convert("RGB")
    w, h = img.size
    if max(w, h) > max_px:
        scale = max_px / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=EVAL_QUALITY, optimize=True)
    return base64.standard_b64encode(buf.getvalue()).decode("utf-8"), "image/jpeg"

# ── config ────────────────────────────────────────────────────────────────────

def load_config():
    with open(CONFIG_FILE) as f:
        return yaml.safe_load(f)

# ── backend ───────────────────────────────────────────────────────────────────

def backend_alive(base):
    try:
        return requests.get(f"{base}/health", timeout=2).status_code == 200
    except Exception:
        return False

def start_backend(base):
    if backend_alive(base):
        print("Backend already running.")
        return None
    print("Starting backend...")
    proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=SERVICE_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        shell=True,
    )
    for _ in range(30):
        time.sleep(2)
        if backend_alive(base):
            print("Backend ready.")
            return proc
    proc.terminate()
    raise RuntimeError("Backend failed to start within 60s.")

# ── pre-run verification ──────────────────────────────────────────────────────

def verify_and_summarize_config(cfg):
    """Print the test matrix and run pre-flight checks. Returns True if safe to run."""
    pipe       = cfg["pipeline"]
    room       = cfg["room"]
    moodboards = cfg["moodboards"]
    styles     = cfg["styles"]
    ver        = cfg.get("version", "unknown")

    print("\n" + "=" * 60)
    print(f"  MOODBOARD VALIDATION SUITE  --  version {ver}")
    print("=" * 60)

    # Room fixture check
    print(f"\n  Room:")
    room_fix   = ROOMS_DIR / room["fixture"]
    exists     = room_fix.exists()
    status     = "OK" if exists else "MISSING"
    size_kb    = f"  {room_fix.stat().st_size // 1024}KB" if exists else ""
    print(f"    {status}  {room['label']:20s}  type={room['room_type']:15s}  fixture={room['fixture']}{size_kb}")

    # Moodboard fixture check
    print(f"\n  Moodboards ({len(moodboards)}):")
    missing_moods = []
    for mb in moodboards:
        fp     = MOODS_DIR / mb["fixture"]
        ex     = fp.exists()
        st     = "OK" if ex else "MISSING"
        sz     = f"  {fp.stat().st_size // 1024}KB" if ex else ""
        styles_str = ", ".join(mb["styles"])
        print(f"    {st}  {mb['label']:40s}  styles=[{styles_str}]{sz}")
        if not ex:
            missing_moods.append(mb["fixture"])

    # Styles
    print(f"\n  Styles ({len(styles)}):")
    for s in styles:
        print(f"    · {s['name']:20s}  bucket={s['density_bucket']}")

    # Pipeline
    print(f"\n  Pipeline:")
    print(f"    · {pipe['label']:20s}  mode={pipe['mode']}")

    total = sum(len(mb["styles"]) for mb in moodboards)
    print(f"\n  Total cases: {total}")
    print(f"  Style influence: {cfg.get('style_influence', 50)}")

    errors = []
    if not room_fix.exists():
        errors.append(f"Missing room fixture: {room['fixture']}")
    if missing_moods:
        errors.append(f"Missing moodboard fixtures: {', '.join(missing_moods)}")

    print()
    if errors:
        for e in errors:
            print(f"  BLOCKED: {e}")
        print("\n  Simulation blocked. Resolve the above before proceeding.")
        print("=" * 60 + "\n")
        return False

    print("  OK  All pre-flight checks passed. Ready to run simulation.")
    print("=" * 60 + "\n")
    return True

# ── generation ────────────────────────────────────────────────────────────────

def call_pipeline(base, room_path, moodboard_path, room_type, style, pipeline_mode, style_influence):
    def mime(p):
        return "image/jpeg" if p.suffix.lower() in (".jpg", ".jpeg") else "image/png"

    with open(room_path, "rb") as room_f, open(moodboard_path, "rb") as mood_f:
        files = [
            ("roomImage",       (room_path.name,      room_f.read(),  mime(room_path))),
            ("moodBoardImages", (moodboard_path.name, mood_f.read(),  mime(moodboard_path))),
        ]
        data = {
            "roomType":       room_type,
            "stylePreset":    json.dumps({"id": style["id"], "name": style["name"]}),
            "styleInfluence": str(style_influence),
            "isRefinement":   "false",
            "textPrompt":     "",
        }
        resp = requests.post(
            f"{base}/generate-visualization?mode={pipeline_mode}",
            files=files, data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()

# ── test runner ───────────────────────────────────────────────────────────────

def run_tests(cfg):
    base       = cfg["api_base"]
    pipe       = cfg["pipeline"]
    room       = cfg["room"]
    moodboards = cfg["moodboards"]
    styles_map = {s["id"]: s for s in cfg["styles"]}
    influence  = cfg.get("style_influence", 50)

    room_fixture = ROOMS_DIR / room["fixture"]

    run_id  = datetime.now().strftime("run_%Y%m%d_%H%M%S")
    run_dir = OUTPUTS_DIR / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "run_id":    run_id,
        "timestamp": datetime.now().isoformat(),
        "pipeline":  pipe,
        "room":      room,
        "cases":     [],
    }

    total = sum(len(mb["styles"]) for mb in moodboards)
    n = 0

    for mb in moodboards:
        mood_fixture = MOODS_DIR / mb["fixture"]

        for style_id in mb["styles"]:
            n += 1
            style   = styles_map[style_id]
            case_id = f"{mb['id']}_{style_id}"
            print(f"\n[{n}/{total}] {mb['label']} × {style['name']} ({style['density_bucket']})")

            case = {
                "case_id":                case_id,
                "moodboard_id":           mb["id"],
                "moodboard_label":        mb["label"],
                "moodboard_fixture":      mb["fixture"],
                "moodboard_relationship": mb.get("relationship", "unknown"),
                "style_id":               style_id,
                "style_name":             style["name"],
                "density_bucket":         style["density_bucket"],
                "result":                 None,
                "validity":               None,
                "ai_evaluation":          None,
            }

            out_path = run_dir / f"{case_id}.png"
            dbg_path = run_dir / f"{case_id}_debug.json"

            print(f"  → {pipe['label']}...", end="", flush=True)
            try:
                r = call_pipeline(
                    base, room_fixture, mood_fixture,
                    room["room_type"], style, pipe["mode"], influence,
                )
                img_data = r.get("data", {}).get("image") or r.get("image")
                debug    = r.get("data", {}).get("debug") or r.get("debug") or {}
                out_path.write_bytes(base64.b64decode(img_data))
                dbg_path.write_text(json.dumps(debug, indent=2))
                case["result"] = {"image": out_path.name, "debug": debug, "status": "ok"}
                print(" ✓")
            except Exception as e:
                case["result"] = {"status": "error", "error": str(e)}
                print(f" ✗  {e}")

            manifest["cases"].append(case)

    (run_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\nOutputs saved → {run_dir}")
    return run_dir, manifest

# ── validity classifier ───────────────────────────────────────────────────────

VALIDITY_VIOLATIONS = {
    "corrupted_or_incomplete_image",
    "window_opening_removed",
    "window_opening_blocked_by_opaque_non_fabric_surface",
    "new_structural_element_added",
    "room_type_changed",
    "fundamentally_different_camera_position",
}

VALIDITY_CLASSIFIER_PROMPT = """\
You are a visual validity classifier for AI-generated interior design images.

Compare the SOURCE image (Image 1) to the GENERATED output (Image 2).
Determine whether the generated output has any hard structural validity failures.

Step 1 — window check:
  Examine the SOURCE image. If NO windows or openings are visible in the source,
  skip rules "window_opening_removed" and "window_opening_blocked_by_opaque_non_fabric_surface" entirely.

Step 2 — evaluate each rule independently:

  corrupted_or_incomplete_image
    The output is blank, severely corrupted, cut off, or visually unusable.

  window_opening_removed
    A visible source window or opening was removed or replaced by a wall, artwork,
    shelving, mirror, cabinetry, or another solid non-window element.
    Apply ONLY if the source has visible windows. Mutually exclusive with the rule below.

  window_opening_blocked_by_opaque_non_fabric_surface
    A visible source window still exists spatially but is blocked by an opaque solid
    non-fabric element that effectively eliminates the window as a light or view source.
    Apply ONLY if the source has visible windows. Mutually exclusive with the rule above.
    NOT applicable to: curtains, drapes, blinds, sheers, shades, or any fabric or soft treatment.

  new_structural_element_added
    A new permanent structural element was added that did not exist in the source.
    Applies to: new walls, new doors, new permanent window openings, new load-bearing columns.
    Does NOT apply to: shiplap, brick veneer, wall paneling, decorative panels, shoji screens,
    surface cladding, material changes, furniture, lighting fixtures, or decorative elements.

  room_type_changed
    The generated output transforms the room into a different functional room type.

  fundamentally_different_camera_position
    The apparent camera position is fundamentally different from the source.
    Apply ONLY for clear binary cases: a different wall becomes the primary viewpoint,
    the camera appears to have moved to the opposite side of the room.
    Do NOT apply for: minor crop drift, minor lens differences, small perspective shifts.

Step 3 — "window_opening_removed" and "window_opening_blocked_by_opaque_non_fabric_surface"
  are mutually exclusive. Apply at most one per output, never both.

Return ONLY valid JSON — no markdown, no explanation outside the JSON:
{
  "verdict": "PASS" or "FAIL",
  "violations": [],
  "rationale": "One sentence explaining the verdict."
}

- verdict must be exactly "PASS" or "FAIL"
- if verdict is "PASS", violations must be []
- if verdict is "FAIL", violations must contain at least one value from the allowed enum
- use only the exact enum strings listed above — no paraphrasing\
"""


def _validate_classifier_result(raw_result):
    verdict    = raw_result.get("verdict")
    violations = raw_result.get("violations") or []
    rationale  = str(raw_result.get("rationale") or "")

    if verdict not in ("PASS", "FAIL"):
        return {"verdict": "ERROR", "violations": [], "rationale": f"Invalid verdict: {repr(verdict)}", "excluded": True}

    clean = [v for v in violations if v in VALIDITY_VIOLATIONS]

    if verdict == "PASS" and violations:
        return {"verdict": "ERROR", "violations": [], "rationale": "PASS verdict with non-empty violations.", "excluded": True}
    if verdict == "FAIL" and not clean:
        return {"verdict": "ERROR", "violations": [], "rationale": "FAIL verdict with no recognised violations.", "excluded": True}

    return {"verdict": verdict, "violations": clean, "rationale": rationale, "excluded": verdict != "PASS"}


def classify_output_validity(client, room_fixture, output_path):
    try:
        src_b64, src_mime = load_image_b64(room_fixture)
        out_b64, out_mime = load_image_b64(output_path)

        response = client.messages.create(
            model="claude-opus-4-7",
            max_tokens=400,
            messages=[{"role": "user", "content": [
                {"type": "text",  "text": "Image 1 — SOURCE (original room photo):"},
                {"type": "image", "source": {"type": "base64", "media_type": src_mime, "data": src_b64}},
                {"type": "text",  "text": "Image 2 — GENERATED output:"},
                {"type": "image", "source": {"type": "base64", "media_type": out_mime, "data": out_b64}},
                {"type": "text",  "text": VALIDITY_CLASSIFIER_PROMPT},
            ]}],
        )

        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return _validate_classifier_result(json.loads(raw.strip()))

    except Exception as e:
        return {"verdict": "ERROR", "violations": [], "rationale": f"Classifier error: {e}", "excluded": True}


def run_validity_classification(client, run_dir, manifest, cfg):
    room_fix = ROOMS_DIR / cfg["room"]["fixture"]
    cases    = manifest["cases"]
    total    = len([c for c in cases if c.get("result", {}).get("status") == "ok"])
    print(f"\nRunning validity classification ({total} cases)...")

    for i, case in enumerate(cases):
        if case.get("result", {}).get("status") != "ok":
            case["validity"] = {"verdict": "ERROR", "violations": [], "rationale": "Generation failed.", "excluded": True}
            print(f"  [{i+1}/{total}] {case['moodboard_label']} × {case['style_name']}  skip (gen failed)")
            continue

        out_path = run_dir / case["result"]["image"]
        v   = classify_output_validity(client, room_fix, out_path)
        sym = "P" if v["verdict"] == "PASS" else ("F" if v["verdict"] == "FAIL" else "E")
        case["validity"] = v
        print(f"  [{i+1}/{total}] {case['moodboard_label']} × {case['style_name']}  {sym}")

    (run_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))

# ── ai evaluation ─────────────────────────────────────────────────────────────

DENSITY_DESCRIPTIONS = {
    "LOW":    "sparse and restrained — minimal objects, deliberate negative space",
    "MEDIUM": "balanced and intentional — moderate presence, clear focal point",
    "HIGH":   "layered and expressive — rich groupings, warm material atmosphere",
}

MOODBOARD_EVAL_PROMPT = """\
You are evaluating an AI-generated interior design visualization for a moodboard validation test.

You will see three images:
  Image 1 — SOURCE ROOM: the original room photo (fixed architectural reference)
  Image 2 — MOODBOARD: the reference moodboard provided to the AI
  Image 3 — OUTPUT: the AI-generated visualization

Context:
  Target style: {style_name}
  Staging density: {bucket} ({bucket_description})
  Moodboard relationship to style: {moodboard_relationship}
  Moodboard ID: {moodboard_id}

The AI system treats the moodboard as a BOUNDED MODIFIER only.
The moodboard should influence only three dimensions:
  - Color palette direction (warm/cool tendency, dominant tone family)
  - Surface texture register (rough/smooth, natural/refined, matte/gloss)
  - Lighting mood (warmth, softness, quality of light)

The moodboard must NOT influence:
  - Style category or core material family
  - Object types, furniture arrangements, or spatial layout
  - Structural geometry (windows, walls, ceiling)
  - Decorative density

Evaluate the output using the following criteria:

1. STYLE DOMINANCE (1–5)
   Does the output clearly express the {style_name} style?
   5 = unmistakable, immediately recognizable
   3 = diluted, partial expression, or generic
   1 = wrong style, style collapsed, or moodboard aesthetic overrode style identity

2. MOODBOARD INFLUENCE
   A. Presence (1–5): Are palette, texture, and/or lighting visibly influenced by the moodboard?
      5 = clear, meaningful influence across at least two dimensions
      3 = subtle or single-dimension influence
      1 = no detectable influence, or moodboard completely ignored

   B. Strength: Is the moodboard influence calibrated correctly?
      "too_weak"   — moodboard is ignored or barely perceptible
      "balanced"   — appropriate tonal/textural shift without overwhelming the style
      "too_strong" — moodboard overtakes style identity or introduces non-permitted elements

   C. Scope Compliance (PASS / FAIL):
      PASS = influence limited to palette, texture, lighting only
      FAIL = output contains objects, layouts, or furniture copied or implied by the moodboard;
             or moodboard introduced a different style category

3. CONFLICT RESOLUTION (PASS / PARTIAL / FAIL)
   For {style_name} with this moodboard ({moodboard_relationship}):
   PASS    = style clearly dominates; moodboard conflict is resolved in style's favor
   PARTIAL = style is present but partially diluted by moodboard aesthetic
   FAIL    = moodboard aesthetic overrides the target style; output reads as a different style

4. COMPOSITION STRENGTH (1–5)
   Does the room feel intentionally designed and spatially coherent?
   5 = strong intent, layered, professionally composed
   3 = acceptable but flat or generic
   1 = incoherent, empty, or visually confused

5. DENSITY ACCURACY (1–5)
   Does the staging density match the expected bucket ({bucket})?
   5 = correct density for bucket
   3 = slightly off (minor over- or under-staging)
   1 = wrong density (empty room for HIGH, or cluttered for LOW)

Return ONLY valid JSON — no markdown, no explanation outside the JSON:
{{
  "style_dominance": <int 1-5>,
  "moodboard_influence": {{
    "presence": <int 1-5>,
    "strength": "too_weak" or "balanced" or "too_strong",
    "scope_compliance": "PASS" or "FAIL",
    "scope_notes": "<one sentence describing any scope violation, null if PASS>"
  }},
  "conflict_resolution": "PASS" or "PARTIAL" or "FAIL",
  "conflict_notes": "<one sentence explaining conflict resolution outcome>",
  "composition_strength": <int 1-5>,
  "density_accuracy": <int 1-5>,
  "summary": "<2–3 sentence overall assessment of moodboard integration quality>"
}}"""


def evaluate_case(client, room_fixture, mood_fixture, out_path, case):
    try:
        room_b64, room_mime = load_image_b64(room_fixture)
        mood_b64, mood_mime = load_image_b64(mood_fixture)
        out_b64,  out_mime  = load_image_b64(out_path)

        bucket = case["density_bucket"]
        prompt = MOODBOARD_EVAL_PROMPT.format(
            style_name=case["style_name"],
            bucket=bucket,
            bucket_description=DENSITY_DESCRIPTIONS.get(bucket, bucket),
            moodboard_relationship=case["moodboard_relationship"],
            moodboard_id=case["moodboard_id"],
        )

        response = client.messages.create(
            model="claude-opus-4-7",
            max_tokens=800,
            messages=[{"role": "user", "content": [
                {"type": "text",  "text": "Image 1 — SOURCE ROOM:"},
                {"type": "image", "source": {"type": "base64", "media_type": room_mime, "data": room_b64}},
                {"type": "text",  "text": "Image 2 — MOODBOARD:"},
                {"type": "image", "source": {"type": "base64", "media_type": mood_mime, "data": mood_b64}},
                {"type": "text",  "text": "Image 3 — OUTPUT:"},
                {"type": "image", "source": {"type": "base64", "media_type": out_mime,  "data": out_b64}},
                {"type": "text",  "text": prompt},
            ]}],
        )

        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())

    except Exception as e:
        return {"error": str(e)}


def run_ai_evaluation(client, run_dir, manifest, cfg):
    moods_map = {mb["id"]: mb for mb in cfg["moodboards"]}
    room_fix  = ROOMS_DIR / cfg["room"]["fixture"]
    cases     = manifest["cases"]
    ok_cases  = [c for c in cases if c.get("result", {}).get("status") == "ok"]
    total     = len(ok_cases)
    n         = 0

    print(f"\nRunning AI evaluation ({total} cases)...")

    for case in cases:
        if case.get("result", {}).get("status") != "ok":
            print(f"  [{case['case_id']}] skipped — generation failed")
            continue

        n += 1
        mood_fix = MOODS_DIR / moods_map[case["moodboard_id"]]["fixture"]
        out_path = run_dir / case["result"]["image"]
        print(f"  [{n}/{total}] {case['moodboard_label']} × {case['style_name']}...", end="", flush=True)

        result = evaluate_case(client, room_fix, mood_fix, out_path, case)
        case["ai_evaluation"] = result

        if "error" in result:
            print(f" ✗  {result['error']}")
        else:
            sd  = result.get("style_dominance", "?")
            mi  = result.get("moodboard_influence", {})
            mp  = mi.get("presence", "?")
            ms  = mi.get("strength", "?")
            sc  = mi.get("scope_compliance", "?")
            cr  = result.get("conflict_resolution", "?")
            print(f" ✓  SD:{sd} MP:{mp} Str:{ms} Scope:{sc} CR:{cr}")

    (run_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))

# ── consistency analysis ──────────────────────────────────────────────────────

def run_consistency_analysis(manifest, cfg):
    pairs   = cfg.get("consistency_pairs", [])
    cases   = manifest["cases"]
    results = []

    print("\nConsistency analysis (cross-moodboard)...")

    for pair in pairs:
        style_id    = pair["style"]
        mb_ids      = pair["moodboards"]
        style_cases = [
            c for c in cases
            if c["style_id"] == style_id and c["moodboard_id"] in mb_ids
            and c.get("ai_evaluation") and "error" not in c.get("ai_evaluation", {})
        ]

        if len(style_cases) < 2:
            continue

        sd_scores = [c["ai_evaluation"].get("style_dominance", 0) for c in style_cases]
        mp_scores = [c["ai_evaluation"].get("moodboard_influence", {}).get("presence", 0) for c in style_cases]
        sd_range  = max(sd_scores) - min(sd_scores)
        mp_range  = max(mp_scores) - min(mp_scores)

        verdict = "CONSISTENT" if sd_range <= 1 and mp_range <= 1 else \
                  "MINOR_DRIFT" if sd_range <= 2 and mp_range <= 2 else "MAJOR_DRIFT"

        row = {
            "style":                    style_cases[0]["style_name"],
            "moodboards_compared":      mb_ids,
            "style_dominance_scores":   dict(zip(mb_ids, sd_scores)),
            "moodboard_presence_scores": dict(zip(mb_ids, mp_scores)),
            "sd_range":  sd_range,
            "mp_range":  mp_range,
            "verdict":   verdict,
        }
        results.append(row)
        print(f"  {style_cases[0]['style_name']:20s}  SD range={sd_range}  MP range={mp_range}  → {verdict}")

    manifest["consistency_analysis"] = results
    return results

# ── optimization advice ───────────────────────────────────────────────────────

ADVICE_MAX_RETRIES = 3
ADVICE_RETRY_DELAY = 12   # seconds between retry attempts

OPTIMIZATION_PROMPT = """\
You are an expert Prompt Engineer for a generative AI interior-design visualization pipeline.
We have run a moodboard validation test suite for the {template_version} pipeline (pipelineMode: balanced_v5).

The moodboard system is designed to treat reference images as BOUNDED MODIFIERS — influencing
only palette direction, surface texture, and lighting mood. It must never extract objects,
furniture, layouts, or style categories from the moodboard.

Below are the validation findings.

### VALIDITY FAILURES (structural integrity — should be PASS for all cases):
{validity_failures}

### SCOPE VIOLATIONS (moodboard influenced objects/layout/style — should be PASS for all cases):
{scope_violations}

### CONFLICT RESOLUTION FAILURES (moodboard overrode style — PARTIAL or FAIL):
{conflict_failures}

### STYLE DOMINANCE WEAKNESS (SD score ≤ 3 — style should dominate at ≥ 4):
{style_weakness}

### MOODBOARD INFLUENCE TOO WEAK (MP presence ≤ 2 — moodboard should register):
{weak_influence}

### CURRENT V5.1 PROMPT TEMPLATES (TypeScript Constants):
```typescript
{templates}
```

### TASK:
Analyze the failures. Suggest specific wording changes or structural adjustments to the V5.1
bounded modifier system (buildMoodboardScopeBlock, MOODBOARD_V5 label in imageRoles.ts,
or the TIER 5 definition in buildConstraintHierarchyBlock) to resolve these issues.

Focus on:
1. Preventing scope violations — tightening the "do not extract" language.
2. Improving conflict resolution — reinforcing that the style definition wins over moodboard.
3. Preventing structural drift — if validity failures appear pattern-based.
4. Calibrating moodboard presence — if influence is systematically too weak.

Return your advice in a clear, actionable format with specific "Before" and "After" snippets
where applicable.
"""


def _extract_prompt_runtime(filepath):
    """Return only runtime code lines from a TypeScript constants file.
    Strips pure comment lines (// ...) to keep payload focused on actual prompt text."""
    if not filepath.exists():
        return "Prompt file not found."
    lines = filepath.read_text(encoding="utf-8").splitlines()
    code_lines = [l for l in lines if not l.strip().startswith("//")]
    content = "\n".join(code_lines)
    # Also pull MOODBOARD_V5 label from imageRoles.ts for full context
    roles_file = filepath.parent.parent / "imageRoles.ts"
    if roles_file.exists():
        roles_lines = [l for l in roles_file.read_text(encoding="utf-8").splitlines()
                       if not l.strip().startswith("//")]
        moodboard_v5_block = []
        capture = False
        for l in roles_lines:
            if "MOODBOARD_V5" in l:
                capture = True
            if capture:
                moodboard_v5_block.append(l)
                if l.strip().endswith(","):
                    break
        if moodboard_v5_block:
            content += "\n\n// imageRoles.ts — MOODBOARD_V5:\n" + "\n".join(moodboard_v5_block)
    if len(content) > 7000:
        content = content[:7000] + "\n... (truncated)"
    return content


def generate_optimization_advice(manifest, cfg, api_key):
    import anthropic
    client = anthropic.Anthropic(api_key=api_key, timeout=180.0)

    cases    = manifest["cases"]
    ok_cases = [c for c in cases if c.get("ai_evaluation") and "error" not in c.get("ai_evaluation", {})]

    # Derive template version from manifest pipeline label or fallback
    template_version = manifest.get("pipeline", {}).get("label", "V5.x")

    def fmt_case(c):
        return f"{c['moodboard_label']} × {c['style_name']} ({c['density_bucket']})"

    validity_failures = [
        f"  - {fmt_case(c)}: {c['validity']['rationale']}"
        for c in cases if c.get("validity", {}).get("verdict") == "FAIL"
    ]
    scope_violations = [
        f"  - {fmt_case(c)}: {c['ai_evaluation'].get('moodboard_influence', {}).get('scope_notes', '')}"
        for c in ok_cases
        if c["ai_evaluation"].get("moodboard_influence", {}).get("scope_compliance") == "FAIL"
    ]
    conflict_failures = [
        f"  - {fmt_case(c)} → {c['ai_evaluation'].get('conflict_resolution')}: {c['ai_evaluation'].get('conflict_notes', '')}"
        for c in ok_cases
        if c["ai_evaluation"].get("conflict_resolution") in ("PARTIAL", "FAIL")
    ]
    style_weakness = [
        f"  - {fmt_case(c)}: SD={c['ai_evaluation'].get('style_dominance')}"
        for c in ok_cases if c["ai_evaluation"].get("style_dominance", 5) <= 3
    ]
    weak_influence = [
        f"  - {fmt_case(c)}: MP={c['ai_evaluation'].get('moodboard_influence', {}).get('presence')}"
        for c in ok_cases
        if c["ai_evaluation"].get("moodboard_influence", {}).get("presence", 5) <= 2
    ]

    if not any([validity_failures, scope_violations, conflict_failures, style_weakness, weak_influence]):
        return "No issues found. All cases passed all checks — no optimization required."

    templates = _extract_prompt_runtime(PROMPT_FILE)

    prompt = OPTIMIZATION_PROMPT.format(
        template_version=template_version,
        validity_failures="\n".join(validity_failures) or "  None",
        scope_violations="\n".join(scope_violations) or "  None",
        conflict_failures="\n".join(conflict_failures) or "  None",
        style_weakness="\n".join(style_weakness) or "  None",
        weak_influence="\n".join(weak_influence) or "  None",
        templates=templates,
    )

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def run_optimization_advice(run_dir, manifest, cfg):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("\nWARNING: ANTHROPIC_API_KEY not set — skipping optimization advice")
        return

    print("\nConsulting Claude for optimization advice...")
    last_error = None
    for attempt in range(1, ADVICE_MAX_RETRIES + 1):
        try:
            advice = generate_optimization_advice(manifest, cfg, api_key)
            out    = run_dir / "optimization_advice.md"
            out.write_text(advice, encoding="utf-8")
            print(f"\nOptimization advice saved to: {out}")
            print("\n--- ADVICE SUMMARY ---")
            print(advice[:1200] + ("..." if len(advice) > 1200 else ""))
            return
        except Exception as e:
            last_error = e
            if attempt < ADVICE_MAX_RETRIES:
                print(f" ✗  (attempt {attempt}/{ADVICE_MAX_RETRIES}) — {e}")
                print(f"  Retrying in {ADVICE_RETRY_DELAY}s...")
                time.sleep(ADVICE_RETRY_DELAY)

    print(f"\nERROR: Optimization advice failed after {ADVICE_MAX_RETRIES} attempts — {last_error}")
    print("  Use --advice-only to retry without re-running generation or evaluation.")

# ── html report ───────────────────────────────────────────────────────────────

def _vbadge(verdict):
    cls = {"PASS": "vbadge-pass", "FAIL": "vbadge-fail", "ERROR": "vbadge-error"}.get(verdict, "vbadge-unknown")
    return f'<span class="validity-badge {cls}">{verdict or "—"}</span>'


def _vbanner(verdict, violations, rationale):
    if verdict == "PASS" or not verdict:
        return ""
    title    = "VALIDITY FAILURE" if verdict == "FAIL" else "CLASSIFIER ERROR"
    viol_str = " · ".join(v.replace("_", " ") for v in violations) if violations else "see rationale"
    cls      = "vbanner-fail" if verdict == "FAIL" else "vbanner-error"
    return (
        f'<div class="validity-banner {cls}">'
        f'<span class="vb-title">{title}</span>'
        f'<span class="vb-violations">{viol_str}</span>'
        f'<span class="vb-rationale">{rationale}</span>'
        f'</div>'
    )


def _sc(v, low=3):
    """Return color class for a 1-5 integer score."""
    if not isinstance(v, int):
        return "#6b7280"
    if v >= 4: return "#5aad6a"
    if v >= low: return "#d5a55b"
    return "#d05050"


def _pf_color(v):
    return {"PASS": "#5aad6a", "FAIL": "#d05050", "PARTIAL": "#d5a55b"}.get(v, "#6b7280")


def case_html_moodboard(case, pipe_label):
    cid    = case["case_id"]
    result = case.get("result") or {}
    val    = case.get("validity") or {}
    ev     = case.get("ai_evaluation") or {}
    mi     = ev.get("moodboard_influence") or {}

    img_name  = result.get("image", "")
    vverdict  = val.get("verdict", "")
    vviol     = val.get("violations", [])
    vrat      = val.get("rationale", "")
    excl      = val.get("excluded", False)

    sd   = ev.get("style_dominance")
    mp   = mi.get("presence")
    ms   = mi.get("strength", "—")
    sc   = mi.get("scope_compliance", "—")
    scn  = mi.get("scope_notes") or ""
    cr   = ev.get("conflict_resolution", "—")
    crn  = ev.get("conflict_notes") or ""
    comp = ev.get("composition_strength")
    dens = ev.get("density_accuracy")
    summ = ev.get("summary", "")
    err  = ev.get("error", "")

    bucket      = case["density_bucket"]
    bucket_cls  = {"LOW": "bucket-low", "MEDIUM": "bucket-medium", "HIGH": "bucket-high"}.get(bucket, "")
    rel_badge   = {"aligned": "rel-aligned", "mixed": "rel-mixed", "stress": "rel-stress"}.get(
                   case["moodboard_relationship"], "rel-unknown")

    img_panel_cls = " image-panel-invalid" if excl else ""
    img_tag = f'<img src="{img_name}" alt="output">' if img_name else '<div class="no-image">No output</div>'

    ms_color = {"balanced": "#5aad6a", "too_weak": "#d5a55b", "too_strong": "#d05050"}.get(ms, "#6b7280")

    scores_html = ""
    if err:
        scores_html = f'<div class="eval-error">Evaluation error: {err}</div>'
    elif ev:
        scores_html = f"""
        <div class="score-grid">
          <div class="score-item">
            <div class="si-label">Style Dominance</div>
            <div class="si-value" style="color:{_sc(sd)}">{sd if sd is not None else "—"}</div>
          </div>
          <div class="score-item">
            <div class="si-label">MB Presence</div>
            <div class="si-value" style="color:{_sc(mp)}">{mp if mp is not None else "—"}</div>
          </div>
          <div class="score-item">
            <div class="si-label">MB Strength</div>
            <div class="si-value" style="color:{ms_color};font-size:11px">{ms}</div>
          </div>
          <div class="score-item">
            <div class="si-label">Scope</div>
            <div class="si-value" style="color:{_pf_color(sc)};font-size:11px">{sc}</div>
          </div>
          <div class="score-item">
            <div class="si-label">Conflict Res.</div>
            <div class="si-value" style="color:{_pf_color(cr)};font-size:11px">{cr}</div>
          </div>
          <div class="score-item">
            <div class="si-label">Composition</div>
            <div class="si-value" style="color:{_sc(comp)}">{comp if comp is not None else "—"}</div>
          </div>
          <div class="score-item">
            <div class="si-label">Density</div>
            <div class="si-value" style="color:{_sc(dens)}">{dens if dens is not None else "—"}</div>
          </div>
        </div>
        {'<div class="diag-row"><span class="diag-label diag-reg">Scope note</span><span class="diag-val">' + scn + '</span></div>' if scn else ''}
        {'<div class="diag-row"><span class="diag-label">Conflict note</span><span class="diag-val">' + crn + '</span></div>' if crn else ''}
        <div class="case-summary">{summ}</div>"""
    else:
        scores_html = '<div class="eval-error">No evaluation data.</div>'

    return f"""
  <section class="case" id="{cid}">
    <div class="case-header">
      <h2>{case['moodboard_label']} <span class="sep">·</span>
          <span style="color:#60a5fa">{case['style_name']}</span>
          <span class="bucket {bucket_cls}">{bucket}</span>
          <span class="rel-badge {rel_badge}">{case['moodboard_relationship']}</span>
      </h2>
    </div>

    <div class="image-grid-3">
      <div class="image-panel">
        <div class="panel-label">Source Room</div>
        <img src="../../fixtures/rooms/{case.get('moodboard_fixture', '').replace('moodboard', 'room') or 'living_room.jpg'}" alt="source" onerror="this.style.display='none'">
      </div>
      <div class="image-panel">
        <div class="panel-label">Moodboard</div>
        <img src="../../fixtures/moodboards/{case.get('moodboard_fixture', '')}" alt="moodboard" onerror="this.style.display='none'">
      </div>
      <div class="image-panel{img_panel_cls}">
        <div class="panel-label">{pipe_label} {_vbadge(vverdict)}</div>
        {img_tag}
        {_vbanner(vverdict, vviol, vrat)}
      </div>
    </div>

    <div class="eval-block">
      {scores_html}
    </div>

    <div class="notes-block">
      <label>Human Notes / Rationale</label>
      <textarea rows="2" placeholder="Observations..."></textarea>
    </div>
  </section>"""


def build_report(run_dir, manifest, cfg):
    cases      = manifest["cases"]
    pipe_label = cfg["pipeline"]["label"]
    ok_cases   = [c for c in cases if c.get("ai_evaluation") and "error" not in c.get("ai_evaluation", {})]
    val_cases  = [c for c in cases if c.get("validity", {}).get("verdict") == "PASS"]
    fail_cases = [c for c in cases if c.get("validity", {}).get("verdict") == "FAIL"]

    # aggregate stats
    avg_sd = (sum(c["ai_evaluation"].get("style_dominance", 0) for c in ok_cases) / len(ok_cases)) if ok_cases else 0
    avg_mp = (sum(c["ai_evaluation"].get("moodboard_influence", {}).get("presence", 0) for c in ok_cases) / len(ok_cases)) if ok_cases else 0
    scope_pass = sum(1 for c in ok_cases if c["ai_evaluation"].get("moodboard_influence", {}).get("scope_compliance") == "PASS")
    cr_pass    = sum(1 for c in ok_cases if c["ai_evaluation"].get("conflict_resolution") == "PASS")
    si_pass    = len(val_cases)

    # validity failures table
    if fail_cases:
        frows = ""
        for c in fail_cases:
            v = c.get("validity", {})
            viols = ", ".join(v.get("violations", []) or []).replace("_", " ") or "—"
            frows += (
                f'<tr>'
                f'<td>{c["moodboard_label"]}</td>'
                f'<td style="color:#60a5fa">{c["style_name"]}</td>'
                f'<td><span class="ftv-badge ftv-fail">FAIL</span></td>'
                f'<td class="ft-violations">{viols}</td>'
                f'<td class="ft-rationale">{v.get("rationale","")}</td>'
                f'</tr>'
            )
        failures_html = f"""
    <div class="failures-table-section">
      <h3 class="ft-header">Validity Failures</h3>
      <table class="failures-table">
        <thead><tr><th>Moodboard</th><th>Style</th><th>Verdict</th><th>Violations</th><th>Rationale</th></tr></thead>
        <tbody>{frows}</tbody>
      </table>
    </div>"""
    else:
        failures_html = (
            '<div class="failures-table-section">'
            '<div class="ft-none">No validity failures — all outputs passed classification.</div>'
            '</div>'
        )

    # consistency table
    con_rows = ""
    for row in manifest.get("consistency_analysis", []):
        vc = {"CONSISTENT": "#5aad6a", "MINOR_DRIFT": "#d5a55b", "MAJOR_DRIFT": "#d05050"}.get(row["verdict"], "#6b7280")
        con_rows += (
            f'<tr>'
            f'<td>{row["style"]}</td>'
            f'<td>{", ".join(row["moodboards_compared"])}</td>'
            f'<td style="text-align:center">{row["sd_range"]}</td>'
            f'<td style="text-align:center">{row["mp_range"]}</td>'
            f'<td style="color:{vc};font-weight:700">{row["verdict"]}</td>'
            f'</tr>'
        )

    # optimization advice
    advice_html = ""
    advice_path = run_dir / "optimization_advice.md"
    if advice_path.exists():
        try:
            content = advice_path.read_text(encoding="utf-8")
            advice_html = f"""
    <div class="optimization-advice-section">
      <h3 class="ft-header">AI Prompt Optimization Recommendations</h3>
      <div class="advice-content-box"><pre>{content}</pre></div>
    </div>"""
        except Exception as e:
            advice_html = f'<div class="eval-error">Failed to load optimization advice: {e}</div>'

    cases_html = "\n".join(case_html_moodboard(c, pipe_label) for c in cases)

    si_color   = "#5aad6a" if si_pass == len(cases) else "#d05050"
    scp_color  = "#5aad6a" if scope_pass == len(ok_cases) else "#d5a55b"
    cr_color   = "#5aad6a" if cr_pass == len(ok_cases) else "#d5a55b"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Moodboard Validation — V5.1 — {manifest['run_id']}</title>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px; background: #0d0f14; color: #d4d8e1; line-height: 1.5;
  }}
  header {{
    background: #13161d; border-bottom: 1px solid #222730;
    padding: 20px 32px; display: flex; align-items: baseline; gap: 16px;
  }}
  header h1 {{ font-size: 16px; font-weight: 600; color: #f0f2f5; letter-spacing: 0.02em; }}
  header .meta {{ color: #6b7280; font-size: 12px; }}
  .container {{ max-width: 1400px; margin: 0 auto; padding: 32px; }}

  /* ── case cards ── */
  .case {{
    background: #13161d; border: 1px solid #1e2230; border-radius: 8px;
    margin-bottom: 40px; overflow: hidden;
  }}
  .case-header {{
    padding: 16px 20px; border-bottom: 1px solid #1e2230; background: #0f1118;
  }}
  .case-header h2 {{ font-size: 15px; font-weight: 600; color: #e8eaf0; }}
  .sep {{ color: #3a3f50; margin: 0 6px; }}

  .bucket {{
    display: inline-block; font-size: 10px; font-weight: 700;
    letter-spacing: 0.08em; padding: 2px 7px; border-radius: 3px;
    vertical-align: middle; margin-left: 6px;
  }}
  .bucket-low    {{ background: #1a2a1a; color: #5aad6a; border: 1px solid #2d4d2d; }}
  .bucket-medium {{ background: #1a1f2a; color: #5b9bd5; border: 1px solid #2a3550; }}
  .bucket-high   {{ background: #2a1a1a; color: #d58b5b; border: 1px solid #4d2d2d; }}

  .rel-badge {{
    display: inline-block; font-size: 9px; font-weight: 700;
    letter-spacing: 0.06em; padding: 2px 6px; border-radius: 3px;
    vertical-align: middle; margin-left: 6px; text-transform: uppercase;
  }}
  .rel-aligned {{ background: #0f2a1a; color: #5aad6a; border: 1px solid #1f5a35; }}
  .rel-mixed   {{ background: #1a1f2a; color: #5b9bd5; border: 1px solid #2a3550; }}
  .rel-stress  {{ background: #2a1a0a; color: #d5a55b; border: 1px solid #5a3010; }}
  .rel-unknown {{ background: #1a1a1a; color: #6b7280; border: 1px solid #2a2a2a; }}

  /* ── 3-image grid ── */
  .image-grid-3 {{
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0;
    border-bottom: 1px solid #1e2230;
  }}
  .image-panel {{ padding: 12px; border-right: 1px solid #1e2230; }}
  .image-panel:last-child {{ border-right: none; }}
  .image-panel-invalid {{ opacity: 0.75; border-left: 2px solid #5a2020; }}
  .panel-label {{
    font-size: 11px; font-weight: 600; color: #6b7280;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;
  }}
  .image-panel img {{
    width: 100%; display: block; border-radius: 4px; border: 1px solid #1e2230;
  }}
  .no-image {{
    width: 100%; aspect-ratio: 4/3; background: #0d0f14;
    border: 1px dashed #2a2f3a; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    color: #3a3f50; font-size: 12px;
  }}

  /* ── validity badges + banners ── */
  .validity-badge {{
    display: inline-block; font-size: 9px; font-weight: 800;
    letter-spacing: 0.08em; padding: 1px 6px; border-radius: 3px;
    vertical-align: middle; margin-left: 6px; text-transform: uppercase;
  }}
  .vbadge-pass  {{ background: #0f2a1a; color: #5aad6a; border: 1px solid #1f5a35; }}
  .vbadge-fail  {{ background: #2a0f0f; color: #d05050; border: 1px solid #5a2020; }}
  .vbadge-error {{ background: #1a1a0a; color: #d5a55b; border: 1px solid #5a4020; }}
  .vbadge-unknown {{ background: #0d0f14; color: #3a3f50; border: 1px solid #2a2f3a; }}
  .validity-banner {{
    margin-top: 8px; padding: 8px 10px; border-radius: 4px; font-size: 11px;
    display: flex; flex-direction: column; gap: 3px;
  }}
  .vbanner-fail  {{ background: #2a0f0f; border: 1px solid #5a2020; }}
  .vbanner-error {{ background: #1a1508; border: 1px solid #5a4010; }}
  .vb-title      {{ font-weight: 700; color: #e07070; text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; }}
  .vbanner-error .vb-title {{ color: #d5a55b; }}
  .vb-violations {{ color: #c06060; font-size: 11px; }}
  .vb-rationale  {{ color: #8a5050; font-size: 11px; font-style: italic; }}

  /* ── eval block ── */
  .eval-block {{ padding: 14px 16px; border-bottom: 1px solid #1e2230; background: #0a0e16; }}
  .score-grid {{
    display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 12px;
  }}
  .score-item {{
    background: #0d0f14; border: 1px solid #1e2230; border-radius: 6px;
    padding: 8px; text-align: center;
  }}
  .si-label {{ font-size: 9px; color: #5b6270; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }}
  .si-value {{ font-size: 18px; font-weight: 700; }}
  .eval-error {{ color: #d05050; font-size: 11px; padding: 4px 0; }}
  .diag-row {{ display: flex; gap: 12px; margin-bottom: 5px; align-items: baseline; }}
  .diag-label {{
    font-size: 10px; font-weight: 700; color: #5b6270;
    text-transform: uppercase; letter-spacing: 0.05em; min-width: 110px; flex-shrink: 0;
  }}
  .diag-label.diag-reg {{ color: #8a4040; }}
  .diag-val {{ font-size: 12px; color: #a0a8b8; line-height: 1.5; }}
  .case-summary {{ font-size: 12px; color: #8b949e; margin-top: 8px; line-height: 1.6; }}

  /* ── notes ── */
  .notes-block {{ padding: 12px 16px; background: #0f1118; }}
  .notes-block label {{
    display: block; font-size: 11px; color: #5b6270; margin-bottom: 5px;
    text-transform: uppercase; letter-spacing: 0.06em;
  }}
  .notes-block textarea {{
    width: 100%; background: #0d0f14; border: 1px solid #2a2f3a; border-radius: 4px;
    color: #c0c6d4; font-size: 12px; padding: 7px 10px; resize: vertical; font-family: inherit;
  }}

  /* ── summary section ── */
  .summary {{
    background: #13161d; border: 1px solid #1e2230;
    border-radius: 8px; padding: 24px; margin-top: 48px;
  }}
  .summary h2 {{
    font-size: 14px; font-weight: 600; color: #e8eaf0;
    margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #1e2230;
  }}
  .kpi-row {{
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px;
  }}
  .kpi-card {{
    background: #0d0f14; border: 1px solid #1e2230; border-radius: 6px; padding: 12px; text-align: center;
  }}
  .kpi-value {{ font-size: 22px; font-weight: 700; display: block; margin-bottom: 2px; }}
  .kpi-label {{ font-size: 10px; color: #5b6270; }}

  /* ── consistency table ── */
  .consistency-section {{ margin-top: 20px; }}
  .section-label {{
    font-size: 10px; font-weight: 700; color: #5b6270;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;
  }}
  table {{ border-collapse: collapse; width: 100%; font-size: 12px; }}
  th {{ background: #0a0c12; padding: 7px 10px; text-align: left; font-weight: 600; color: #6b7280; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }}
  td {{ padding: 6px 10px; border-top: 1px solid #1a1e28; }}
  tbody tr:hover {{ background: #111418; }}

  /* ── failures table ── */
  .failures-table-section {{
    margin-top: 16px; padding: 14px;
    background: #0d0f14; border: 1px solid #1e2230; border-radius: 6px;
  }}
  .ft-header {{
    font-size: 11px; font-weight: 700; color: #5b6270;
    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;
  }}
  .ft-none {{ color: #3a3f50; font-size: 12px; font-style: italic; }}
  .failures-table {{ width: 100%; border-collapse: collapse; font-size: 11px; }}
  .failures-table th, .failures-table td {{ padding: 6px 10px; border-bottom: 1px solid #1a1e28; text-align: left; }}
  .failures-table th {{ background: #0a0c12; color: #5b6270; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px; }}
  .failures-table tbody tr:hover {{ background: #111418; }}
  .ftv-badge {{ display: inline-block; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 3px; letter-spacing: 0.06em; }}
  .ftv-fail  {{ background: #2a0f0f; color: #d05050; border: 1px solid #5a2020; }}
  .ft-violations {{ color: #8a6060; max-width: 280px; }}
  .ft-rationale  {{ color: #6b7280; font-style: italic; max-width: 320px; }}

  /* ── optimization advice ── */
  .optimization-advice-section {{ margin-top: 24px; padding-top: 20px; border-top: 1px solid #222730; }}
  .advice-content-box {{
    background: #0a0c12; border: 1px solid #1a2230; border-radius: 8px; padding: 24px; margin-top: 10px;
  }}
  .advice-content-box pre {{
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px; line-height: 1.6; color: #a0a8b8;
    white-space: pre-wrap; word-break: break-word;
  }}
</style>
</head>
<body>

<header>
  <h1>Moodboard Validation — Balanced V5.1</h1>
  <div class="meta">
    Run: {manifest['run_id']} &nbsp;·&nbsp;
    {manifest['timestamp'][:19].replace('T', ' ')} &nbsp;·&nbsp;
    {pipe_label} &nbsp;·&nbsp;
    {len(cases)} cases &nbsp;·&nbsp; {len(ok_cases)} evaluated
  </div>
</header>

<div class="container">

{cases_html}

<div class="summary" id="summary">
  <h2>Final Summary</h2>

  <div class="kpi-row">
    <div class="kpi-card">
      <span class="kpi-value" style="color:#60a5fa">{avg_sd:.2f}</span>
      <div class="kpi-label">Avg Style Dominance</div>
    </div>
    <div class="kpi-card">
      <span class="kpi-value" style="color:#60a5fa">{avg_mp:.2f}</span>
      <div class="kpi-label">Avg MB Presence</div>
    </div>
    <div class="kpi-card">
      <span class="kpi-value" style="color:{scp_color}">{scope_pass}/{len(ok_cases)}</span>
      <div class="kpi-label">Scope Compliance</div>
    </div>
    <div class="kpi-card">
      <span class="kpi-value" style="color:{si_color}">{si_pass}/{len(cases)}</span>
      <div class="kpi-label">Structural Integrity</div>
    </div>
    <div class="kpi-card">
      <span class="kpi-value" style="color:{cr_color}">{cr_pass}/{len(ok_cases)}</span>
      <div class="kpi-label">Conflict Res. PASS</div>
    </div>
  </div>

  <div class="consistency-section">
    <div class="section-label">Consistency Analysis — Cross-Moodboard Repeated Styles</div>
    <table>
      <thead>
        <tr><th>Style</th><th>Moodboards Compared</th><th style="text-align:center">SD Range</th><th style="text-align:center">MP Range</th><th>Verdict</th></tr>
      </thead>
      <tbody>
        {con_rows or '<tr><td colspan="5" style="color:#3a3f50;font-style:italic;padding:10px">No consistency data available.</td></tr>'}
      </tbody>
    </table>
  </div>

  {failures_html}
  {advice_html}
</div>

</div>
</body>
</html>"""

    report_path = run_dir / "report.html"
    report_path.write_text(html, encoding="utf-8")
    print(f"Report   → {report_path}")
    return report_path

# ── main ──────────────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-ai",     action="store_true")
    parser.add_argument("--report-only", metavar="RUN_DIR")
    parser.add_argument("--eval-only",   metavar="RUN_DIR")
    parser.add_argument("--advice-only", metavar="RUN_DIR")
    args = parser.parse_args()

    cfg = load_config()

    if args.advice_only:
        run_dir  = Path(args.advice_only)
        manifest = json.loads((run_dir / "manifest.json").read_text())
        run_optimization_advice(run_dir, manifest, cfg)
        build_report(run_dir, manifest, cfg)
        return

    if args.report_only:
        run_dir  = Path(args.report_only)
        manifest = json.loads((run_dir / "manifest.json").read_text())
        build_report(run_dir, manifest, cfg)
        return

    if args.eval_only:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("ERROR: ANTHROPIC_API_KEY not set.")
            sys.exit(1)
        import anthropic
        client   = anthropic.Anthropic(api_key=api_key)
        run_dir  = Path(args.eval_only)
        manifest = json.loads((run_dir / "manifest.json").read_text())
        run_validity_classification(client, run_dir, manifest, cfg)
        run_ai_evaluation(client, run_dir, manifest, cfg)
        run_consistency_analysis(manifest, cfg)
        (run_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
        run_optimization_advice(run_dir, manifest, cfg)
        build_report(run_dir, manifest, cfg)
        return

    if not verify_and_summarize_config(cfg):
        sys.exit(1)

    proc = start_backend(cfg["api_base"])
    try:
        run_dir, manifest = run_tests(cfg)

        if not args.skip_ai:
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                print("\nWARNING: ANTHROPIC_API_KEY not set — skipping AI evaluation")
            else:
                try:
                    import anthropic
                    client = anthropic.Anthropic(api_key=api_key)
                    run_validity_classification(client, run_dir, manifest, cfg)
                    run_ai_evaluation(client, run_dir, manifest, cfg)
                    run_consistency_analysis(manifest, cfg)
                    (run_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
                    run_optimization_advice(run_dir, manifest, cfg)
                except ImportError:
                    print("\nWARNING: anthropic package not installed — skipping AI evaluation")

        build_report(run_dir, manifest, cfg)
    finally:
        if proc:
            proc.terminate()
            print("Backend stopped.")


if __name__ == "__main__":
    main()
