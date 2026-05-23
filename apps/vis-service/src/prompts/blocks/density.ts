// Block: density
// Introduced: V3.0
// Fires: within the style block builder (injected as {{STAGING_DENSITY_BLOCK}})
// Input: staging density tier ('low' | 'medium' | 'high')
// Source of truth: data/density.ts registry (formerly densityBlocks.ts)
// This file is a thin re-export so the blocks/ directory is the single navigation
// entry point for all prompt block content.

export const DENSITY_BLOCK_VERSION = 'density@1.0';

export {
    getDensityBlockEntry,
    DENSITY_BLOCK_REGISTRY,
} from '../../shared/density-blocks.registry.js';

export type { DensityBlockEntry } from '../../shared/density-blocks.registry.js';



