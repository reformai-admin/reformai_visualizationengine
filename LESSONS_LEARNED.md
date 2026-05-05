# ReformAI Visualization Engine — Lessons Learned
**Last Updated:** 2026-05-04
**Sessions Covered:** Phase Anchoring → Style Registry → A/B Sandbox → Prompt Optimization → Template Engine (v3.0) → V4.0–V5.2.1 → V6.0 Renovation Anchors → Netlify + Cloud Run Deployment

---

## 1. Prompt Engineering Lessons

### ✅ Concrete Visual Tokens > Abstract Style Labels
**What we tried:** Sending `style: "Industrial"` as a label.
**What failed:** Gemini applies its own "Industrial" prior, which is inconsistent across calls.
**What works:** Sending explicit material tokens: `exposed brick`, `black steel`, `poured concrete`, `hard directional daylight`. The model responds much more reliably to concrete nouns.

**Rule:** Every style should be defined as a set of noun-based visual tokens, not adjectives or category names.

---

### ✅ Structural Sandwich Prevents Spatial Drift
**What failed:** Single-pass prompts allowed Gemini to reinterpret the room's geometry when placing furniture.
**What works:** Wrapping the generation in two structural blocks (before and after the style block) locks the model to treat the room as a fixed architectural template.

```
[room image] → [structural part] → [style part] → [moodboard] → [furniture] → [room image again]
```

The terminal room image re-anchor is load-bearing — do not remove it.

---

### ✅ Image Role Labels Are Required for Multi-Image Requests
**What failed:** Sending multiple images without labels caused the model to infer roles positionally. Role inference is inconsistent, especially in production environments.
**What works:** Every image in a request is preceded by an explicit role label text part (`[BASE ROOM IMAGE]`, `[MOODBOARD REFERENCE N]`, `[INJECTED ITEM N]`, `[PREVIOUS RESULT]`, `[BASE ROOM IMAGE — RE-ANCHOR]`).

**Rule:** Never rely on image position for role declaration. Label every image explicitly. This is especially important when binary data may be reconstructed through proxy layers.

---

### ✅ Behavioral Constraints Must Be System-Level, Not Prompt-Level
**What failed:** Embedding behavioral rules as "suggestions" inside the style description.
**What works:** Placing constraints in a dedicated block with `**bold**` formatting and explicit `MUST` / `DO NOT` language. The model treats this as a hard boundary.

---

### ✅ Void Integrity Constraint Fixes Window Corruption
Windows being filled in was one of the most persistent failure modes. The fix:
> *Architectural openings (windows, doors, archways) must remain as open voids. Do not fill them with solid objects or furniture.*

v3.0 extended this to a full **WINDOW SYSTEM INTEGRITY** block covering: total glazing span, opening continuity, spacing, relationship between frame/wall/trim/exterior view.

---

### ✅ Glazing Failure Modes Are Distinct — Do Not Compress the List
During the v3.0 prompt optimization, a compression pass proposed simplifying:
> `reduce, compress, redistribute, or fragment`

to:
> `reduce or fragment`

**This was rejected.** "Redistribute" (moving glazing laterally without reducing area) is a real, distinct failure mode not covered by "reduce or fragment". All four terms were restored globally.

**Rule:** When a failure-mode list uses multiple terms, check whether each term catches something the others don't before collapsing it.

---

### ✅ Material Hierarchy Must Be Explicit
Without zoning rules, the model applies a single dominant material to every surface. The v3.0 fix:
> *Primary surfaces (walls, floor, ceiling, dominant furniture) must contrast in value, tone, or material identity. Do not collapse surfaces into the same neutral tone even if individually correct.*

Paired with an explicit **failure condition** that triggers a self-audit before generation.

---

### ✅ Self-Audit Blocks Work — Place Them Last
The `PHASE 2 SELF-AUDIT — REVIEW BEFORE GENERATING` block at the end of the style prompt reliably catches style fidelity failures, material hierarchy collapse, and density mismatches before the model commits to generating. It functions as a pre-flight checklist.

**Rule:** Put the self-audit as the terminal block in the style part. The model processes it last, immediately before generating.

---

## 2. Architecture Lessons

### ✅ Style Objects > Style Labels
Style as a centralized `StyleObject` with `model_inputs` (what Gemini sees) and `pipeline_config` (what the system does) is the correct architecture.

```typescript
{
  model_inputs: {
    core_materials: string[];   // concrete visual tokens
    color_palette: string[];
    lighting_style: string;
    material_finish: string;
    aperture_look: string;      // sanitized before use; no injection point in v3.0
    dont: string[];
  };
  pipeline_config: {
    structural_protocol: 'rigid_base' | 'rigid_aperture_lock' | 'surface_only_transform';
    staging_density?: 'low' | 'medium' | 'high';
  };
}
```

**Rule:** The style registry (`data/styles.ts`) is the single source of truth. The default preset in the UI must match a name in this registry. Any unknown style name falls back to name-only (no model_inputs enrichment), which will break prompt construction.

---

### ✅ Template-Driven Architecture Eliminates Prompt Duplication
The "hybrid state" problem: v2.x built the style part by constructing strings in code, which duplicated style data (already in styleObject) into the rendered prompt.

**v3.0 solution:** A static template with `{{PLACEHOLDERS}}` — the only data in the rendered prompt is what the injection layer injects. The template is a contract; the styleObject/registries are the data sources.

**Rule:** If you can generate the same information two ways, you have a bug waiting to happen. Pick one source of truth.

---

### ✅ Hard-Fail Validation Is the Right Default for Injection Layers
**What we considered:** Silent fallbacks (empty string injection, default values for unknown fields).
**What we built:** `PromptInjectionError` — a named error class, thrown immediately, with field path in the message.

Silent fallbacks produce malformed prompts that appear to work but generate wrong output. A hard failure surfaces the bug at the system boundary, not at image review time.

---

### ✅ Conditional Blocks Require Explicit Whitespace Contracts
Two blocks in the v3.0 template are conditional: `{{HIGH_DENSITY_GROUP_BLOCK}}` and `{{STYLE_DONTS_BLOCK}}`. When empty, a naive `replace('{{X}}', '')` leaves orphaned blank lines.

**Rule:** For each conditional block, define and document the exact whitespace behavior for both the populated and empty cases before writing the injection layer.

---

### ✅ `structural_protocol` Is the Routing Key
The three protocols represent real, distinct behaviors:
- `rigid_base` — Full geometry lock.
- `rigid_aperture_lock` — Full lock + explicit window/opening protection.
- `surface_only_transform` — Applies materials to surfaces only; avoids structural changes.

---

### ✅ Post-Injection Validation Is Non-Negotiable
After all placeholder replacements, scan the rendered string for any remaining `{{...}}` tokens. Any match means a placeholder was added to the template but not handled by the injection layer.

---

### ❌ Don't Branch Logic Inside Shared Files
**What failed earlier:** `if (pipelineMode === 'baseline') { ... }` branching inside a shared service caused metadata bleed between pipelines.

**Rule:** Physically isolate distinct pipelines into separate files. The dispatcher is the only shared code.

---

### ✅ Registries Are the Right Pattern for Variable Content
Room-type fields and density blocks are now in standalone registry files with typed entries, normalization helpers, and null-returning lookup functions. Adding a new room type or density tier is a one-file change.

---

## 3. Process Lessons

### ✅ Use a Physical Clone as the Baseline, Not a Recreated One
When you need a "before" snapshot, use git. When git isn't available, clone the remote repo directly and never touch it.

---

### ⚠️ Multipart Form-Data Fields Are Unreliable for Routing
Using `pipelineMode` as a multipart form field caused repeated routing failures.

**Rule:** Use URL query parameters for routing signals (`?mode=balanced_v5`).

---

### ✅ Validate the Spec Before Writing Code
The v3.0 implementation was preceded by: a prompt audit, redundancy audit, wording optimization, architecture evaluation, migration plan validation, and a complete formal specification. Writing code against a validated spec produced zero rework.

---

## 4. Deployment Lessons (Netlify + Cloud Run)

### ✅ Netlify Function Proxies Must Forward the Full Query String
**What failed:** The initial `api.mjs` reconstructed the target URL using only `url.pathname`, stripping `?mode=...` and any other query parameters.

**Result:** Every production request hit Cloud Run without a `mode` param. The backend defaulted to `improved_current` regardless of what the user selected in the UI. Responses came back as `NO_IMAGE` because the pipeline routing was wrong.

**Fix:**
```javascript
const url = new URL(event.rawUrl);
const targetUrl = `${CLOUD_RUN_URL}${url.pathname}${url.search}`; // include search (query string)
```

**Rule:** When building a proxy function, always reconstruct the full URL including query string. Test with a pipeline that requires a non-default mode and verify the mode appears in Cloud Run logs.

---

### ✅ Binary Multipart Bodies Require Careful Proxy Handling
Netlify Functions receive POST request bodies as base64-encoded strings when the body contains binary data (`event.isBase64Encoded = true`). If `isBase64Encoded` is `false`, the body arrives as a string. Using `Buffer.from(body)` (UTF-8 default) on binary data silently corrupts image bytes — invalid UTF-8 sequences are replaced, changing the actual byte values.

**Fix:**
```javascript
body = event.isBase64Encoded
  ? Buffer.from(event.body, 'base64')
  : Buffer.from(event.body, 'binary'); // latin1 = lossless byte-for-byte
```

**Symptom:** `NO_IMAGE` finish reason from Gemini with very short elapsed time (1–3s). This indicates Gemini received the request but immediately rejected it — usually because the image bytes were corrupted and undecodable.

**Rule:** For any binary body in a Netlify Function proxy, always use `'binary'` (latin1) as the fallback encoding, never `'utf-8'`. Add explicit `content-length` after decoding so the target server's multipart parser gets the correct byte count.

---

### ✅ The Health Endpoint Is a Critical Diagnostic Tool
When debugging a proxy, test `/health` first. If the health ping returns "backend ok", you have confirmed:
- The Netlify function is executing
- OIDC token generation is working
- The Cloud Run service is running and reachable
- The proxy can complete a full round-trip

If health passes but generation fails, the issue is isolated to the POST body handling (binary, multipart, headers) — not auth or connectivity.

---

### ✅ Elapsed Time Is a Diagnostic Signal
`NO_IMAGE` with ~1–3s elapsed → Gemini received the request but rejected it immediately. Usually corrupted image data or wrong prompt structure.
`NO_IMAGE` with ~10–40s elapsed → Gemini processed but returned no image. Usually a safety filter or prompt configuration issue.

Real image generation takes 10–40s. Anything shorter than 5s is an immediate rejection.

---

### ✅ Cloud Run Requires `K_SERVICE` Check for `.env` Loading
Cloud Run sets the `K_SERVICE` environment variable. The backend uses this to skip `loadEnvFile()` (which would fail because there's no `.env` file in the container). All secrets must be injected as Cloud Run environment variables, not baked into the container.

```typescript
if (!process.env.K_SERVICE) {
  try { loadEnvFile(); } catch { /* expected in some local setups */ }
}
```

**Rule:** Never rely on a `.env` file in a deployed container. Always set secrets via the platform's environment variable configuration (Cloud Run console, Netlify dashboard).

---

### ✅ Netlify Redirects Must Cover All Backend Routes
The initial `netlify.toml` was missing a redirect for `/api/catalogue`. Any route not covered by a redirect returns a 404 from Netlify's CDN — the function is never invoked.

**Rule:** For every backend endpoint (`/generate-visualization`, `/health`, `/api/catalogue`, etc.), there must be a corresponding `[[redirects]]` block in `netlify.toml`.

---

## 5. V6.0 Lessons — Renovation Material Anchors

### ✅ Tier Numbering: Insert Between, Don't Renumber
Use a sub-designation ("Tier 2B") rather than renumbering. Renumbering breaks all existing documentation and any prompt text that references tier numbers by name.

---

### ✅ Prompt-Only Semantic Anchoring Requires Surface-Specific Boundary Language
A general "use this material" instruction bleeds across surfaces. Reliable anchoring requires three explicit sub-instructions per surface:
- **APPLY TO:** Exactly which surface planes are in scope
- **BOUNDARY:** Where to stop
- **NON-NEGOTIABLE:** A hard override statement that preempts style

---

### ✅ VISIBILITY GATE Prevents Hallucinated Surfaces
When a surface may not be visible in a given room image, the model will hallucinate it if the anchor block is unconditional. Gate every anchor with: *"If this surface type is not visible in the room image, skip this anchor entirely. Do not hallucinate the surface."*

---

### ✅ Translation Layer Is the Only Point of Trust for Prompt Strings
The client sends catalogue item IDs, never prompt strings. The translation layer is the sole point that resolves IDs to `promptDescription` strings. This prevents prompt injection.

**Rule:** Anything that reaches a model prompt must pass through a validation + resolution layer. Never allow client-supplied strings to reach the prompt directly.

---

### ✅ Async-First Translation Layer Enables Drop-In DB Replacement
Make data-fetching functions `async` from day one, even for in-memory POC implementations. When a real database replaces the in-memory registry, only the implementation changes — all call sites are unchanged.

---

### ✅ Gate Feature Data on Pipeline Mode, Not Just on Data Presence
Feature data must be gated on the active pipeline/mode, not just on state presence. Renovation data persisting in state could accidentally be sent on non-V6 requests if not explicitly gated.

---

### ✅ Default Parameters Preserve Backward Compatibility at Call Sites
Extend function signatures with default parameters rather than adding new functions or requiring callers to update. The prior behavior becomes the default.
