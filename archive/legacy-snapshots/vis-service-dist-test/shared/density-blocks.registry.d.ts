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
export declare const DENSITY_BLOCK_REGISTRY: Record<string, DensityBlockEntry>;
/**
 * Returns the density block entry for a given tier, or null if unrecognised.
 */
export declare const getDensityBlockEntry: (tier: string) => DensityBlockEntry | null;
//# sourceMappingURL=density-blocks.registry.d.ts.map