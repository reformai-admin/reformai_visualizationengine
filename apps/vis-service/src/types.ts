// Backward-compatible re-export surface.
// 38 files import from this path — many are frozen archived pipelines that cannot
// be updated. This shim must not be deleted. New code should import directly from
// types/core.ts, types/agt.ts, or types/catalogue.ts.

export type {
    ItemFidelityMode,
    InjectedItem,
    StylePreset,
    GenerateVisualizationParams,
} from './types/core.js';

export type {
    RenovationCategory,
    CatalogueItem,
    RenovationSelectionIds,
    ResolvedRenovationSelections,
} from './types/catalogue.js';

export type {
    ConfidenceLevel,
    CountFieldInstance,
    AGTCountField,
    AGTBooleanField,
    AGTPerspectiveField,
    ArchitecturalGroundTruth,
    FieldEnforcement,
    ClassifiedCountField,
    ClassifiedBooleanField,
    ClassifiedPerspectiveField,
    ClassifiedAGT,
} from './types/agt.js';
