# ReformAI Visualization Engine — Lessons Learned
**Last Updated:** 2026-04-24
**Sessions Covered:** Phase Anchoring → Style Registry → A/B Sandbox → Prompt Optimization → Template Engine (v3.0)

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

---

### ✅ Template-Driven Architecture Eliminates Prompt Duplication
The "hybrid state" problem: v2.x built the style part by constructing strings in code, which duplicated style data (already in styleObject) into the rendered prompt. This created two sources of truth and made the prompt structure opaque.

**v3.0 solution:** A static template with `{{PLACEHOLDERS}}` — the only data in the rendered prompt is what the injection layer injects. The template is a contract; the styleObject/registries are the data sources.

**Rule:** If you can generate the same information two ways, you have a bug waiting to happen. Pick one source of truth.

---

### ✅ Hard-Fail Validation Is the Right Default for Injection Layers
**What we considered:** Silent fallbacks (empty string injection, default values for unknown fields).
**What we built:** `PromptInjectionError` — a named error class, thrown immediately, with field path in the message.

Silent fallbacks produce malformed prompts that appear to work but generate wrong output. A hard failure surfaces the bug at the system boundary, not at image review time.

**Rule:** Injection layers should fail loudly at the injection step. Never silently produce a partial prompt.

---

### ✅ Conditional Blocks Require Explicit Whitespace Contracts
Two blocks in the v3.0 template are conditional: `{{HIGH_DENSITY_GROUP_BLOCK}}` and `{{STYLE_DONTS_BLOCK}}`. When empty, a naive `replace('{{X}}', '')` leaves orphaned blank lines that corrupt spacing.

The fix: different replacement patterns for populated vs empty:
```typescript
// Populated: inject content + trailing \n
rendered = rendered.replace('{{HIGH_DENSITY_GROUP_BLOCK}}', content + '\n');

// Empty: remove placeholder AND its trailing \n
rendered = rendered.replace('{{HIGH_DENSITY_GROUP_BLOCK}}\n', '');
```

**Rule:** For each conditional block, define and document the exact whitespace behavior for both the populated and empty cases before writing the injection layer.

---

### ✅ `structural_protocol` Is the Routing Key
The three protocols represent real, distinct behaviors:
- `rigid_base` — Full geometry lock.
- `rigid_aperture_lock` — Full lock + explicit window/opening protection.
- `surface_only_transform` — Applies materials to surfaces only; avoids structural changes.

---

### ✅ Post-Injection Validation Is Non-Negotiable
After all placeholder replacements, scan the rendered string for any remaining `{{...}}` tokens:

```typescript
const UNRESOLVED_PLACEHOLDER_RE = /\{\{[A-Z_]+\}\}/g;
```

Any match means a placeholder was added to the template but not handled by the injection layer. This catches template/code drift immediately.

---

### ❌ Don't Branch Logic Inside Shared Files
**What failed earlier:** `if (pipelineMode === 'baseline') { ... }` branching inside a shared service caused metadata bleed between pipelines.

**Rule:** Physically isolate distinct pipelines into separate files. The dispatcher is the only shared code.

---

### ✅ Registries Are the Right Pattern for Variable Content
Room-type fields and density blocks are now in standalone registry files (`roomTypes.ts`, `densityBlocks.ts`) with typed entries, normalization helpers, and null-returning lookup functions. This means:
- Adding a new room type or density tier is a one-file change
- The injection layer never hardcodes content
- Failed lookups are detectable and can throw before any prompt is rendered

---

## 3. Process Lessons

### ✅ Use a Physical Clone as the Baseline, Not a Recreated One
When you need a "before" snapshot, use git. When git isn't available, clone the remote repo directly and never touch it.

---

### ⚠️ Multipart Form-Data Fields Are Unreliable for Routing
Using `pipelineMode` as a multipart form field caused repeated routing failures.

**Rule:** Use URL query parameters for routing signals (`?mode=balanced_v3_0`).

---

### ✅ No Git in the Workspace = High Risk
This project has no git repository initialized in `reform-ai-vis-sandbox`. Initialize before any large refactor:
```bash
cd reform-ai-vis-sandbox
git init && git add . && git commit -m "checkpoint"
```

---

### ✅ Validate the Spec Before Writing Code
The v3.0 implementation was preceded by:
1. A prompt audit (lossless cleanup)
2. A second-pass redundancy audit
3. A wording optimization pass
4. An architecture evaluation (6-question critique)
5. A migration plan validation
6. A complete formal specification

Writing code against a validated spec produced zero rework. Every file was correct on first write.

**Rule:** For a system with multiple interacting layers (template + registry + injection + service + dispatcher), write the full spec first. The implementation is the easy part.

---

### ✅ Density Block Regression Testing Is Pending
The `BALANCED` (medium) and `LAYERED` (high) density blocks were ported from v2.3 with wording optimizations but have not been regression-tested against v3.0 baseline images. They are marked TODO in `densityBlocks.ts`.

**Do not declare v3.0 production-ready until these pass behavioral regression against v2.2 for the same density tier.**
