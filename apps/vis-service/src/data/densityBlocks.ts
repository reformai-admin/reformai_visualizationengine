// ============================================================
// DENSITY BLOCK REGISTRY
// Single source of truth for staging density prompt content.
// Blocks are pre-formatted strings injected by the v3.0 injection layer.
// Header line is in the template — blocks contain body content only.
//
// VALIDATION STATUS:
//   low  (SPARSE)   — validated against v3.0 baseline. APPROVED.
//   medium (BALANCED) — ported from v2.3 with v3.0 wording pass applied.
//                       TODO: requires behavioral regression testing before
//                       declaring production-ready for v3.0.
//   high (LAYERED)  — ported from v2.3 with v3.0 wording pass applied.
//                       TODO: requires behavioral regression testing before
//                       declaring production-ready for v3.0.
//                       TODO: HIGH DENSITY GROUP JUSTIFICATION block also
//                       requires regression validation at this tier.
// ============================================================

export interface DensityBlockEntry {
    /** Canonical tier value — matches stagingDensityTier input */
    tier: 'low' | 'medium' | 'high';
    /** Prompt-facing label injected into the STAGING DENSITY header */
    label: string;
    /** Body content of the staging density block. No leading or trailing newlines.
     *  The template header and surrounding whitespace are provided by the template. */
    block: string;
    /** Injected after OBJECT JUSTIFICATION RULE when tier = 'high'. Empty string otherwise.
     *  No leading or trailing newlines — injection layer handles surrounding whitespace. */
    highDensityGroupBlock: string;
}

// ── SPARSE ────────────────────────────────────────────────────────────────────
const SPARSE_BLOCK = `Restrained population; negative space is intentional.
- Supporting furniture: 1 piece per primary unit (not bilateral)
- Secondary furniture: none
- Surface objects: maximum 1 per surface; must be functional
- Grouped decor: not permitted
- Wall art: maximum 1 piece, anchored to primary furniture
- Textiles: rug + primary pillow set only; no throw; no accent pillows
- Secondary zones: none`;

// ── BALANCED ─────────────────────────────────────────────────────────────────
// TODO: Regression-test this block on BALANCED-tier styles before marking
// production-ready for v3.0. Content is functionally equivalent to v2.3
// STAGING_DENSITY_MEDIUM with v3.0 wording optimizations applied.
const BALANCED_BLOCK = `Intentional, clear-focal-point population. Moderate presence without clutter.
- Supporting furniture: standard bilateral placement
- Secondary furniture: 1 piece if spatially justified
- Surface objects: maximum 2 per surface; at least 1 must be functional
- Grouped decor: pairs only (maximum 2 items per surface)
- Wall art: maximum 2 pieces, each anchored to a furniture zone
- Textiles: rug + standard pillows + up to 2 accent pillows + 1 throw (natural drape only)
- Secondary zones: 1, with functional anchor and supporting furniture`;

// ── LAYERED ───────────────────────────────────────────────────────────────────
// TODO: Regression-test this block on LAYERED-tier styles before marking
// production-ready for v3.0. Content is functionally equivalent to v2.3
// STAGING_DENSITY_HIGH with v3.0 wording optimizations applied.
const LAYERED_BLOCK = `Rich, composed population with strong material identity. Professionally staged — not cluttered.
- Supporting furniture: full bilateral and contextual placement
- Secondary furniture: maximum 2, each independently justified
- Surface objects: 3–4 per dedicated surface; within a composed grouping, the group is the condition-3 justification unit
- Grouped decor: 3–5 items per dedicated surface (tray, console top, dresser surface)
- Wall art: maximum 3 pieces; gallery wall permitted if anchored to a furniture zone
- Textiles: full layered arrangement (rug + layered pillows + throw styled as design element)
- Secondary zones: maximum 2, each with functional anchor and supporting furniture`;

// ── HIGH DENSITY GROUP JUSTIFICATION ─────────────────────────────────────────
// Injected only when tier = 'high'. Placed after OBJECT JUSTIFICATION RULE.
// TODO: Regression-test alongside LAYERED_BLOCK before marking production-ready.
const HIGH_DENSITY_GROUP_BLOCK = `**HIGH DENSITY GROUP JUSTIFICATION (applies only when STAGING DENSITY — LAYERED is active):**
- A composed grouping on a dedicated surface (tray, console, dresser, shelf) may satisfy condition 3 as a unit; design contribution is evaluated for the group as a whole, not object by object.
- The group must still satisfy conditions 1 and 2.
- This does NOT increase density ceilings; object count limits from the active STAGING DENSITY block remain in force.
- Every object must be anchored to a valid surface or furniture zone; no floating or free-standing placements.`;

// ── REGISTRY ─────────────────────────────────────────────────────────────────

export const DENSITY_BLOCK_REGISTRY: Record<string, DensityBlockEntry> = {
    low: {
        tier: 'low',
        label: 'SPARSE',
        block: SPARSE_BLOCK,
        highDensityGroupBlock: '',
    },
    medium: {
        tier: 'medium',
        label: 'BALANCED',
        block: BALANCED_BLOCK,
        highDensityGroupBlock: '',
    },
    high: {
        tier: 'high',
        label: 'LAYERED',
        block: LAYERED_BLOCK,
        highDensityGroupBlock: HIGH_DENSITY_GROUP_BLOCK,
    },
};

/**
 * Returns the density block entry for a given tier, or null if unrecognised.
 */
export const getDensityBlockEntry = (tier: string): DensityBlockEntry | null => {
    return DENSITY_BLOCK_REGISTRY[tier] ?? null;
};
