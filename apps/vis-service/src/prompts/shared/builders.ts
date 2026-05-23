import type { ResolvedRenovationSelections } from '../../shared/types/index.js';
import type {
    ConstraintHierarchyBuilder,
    MoodboardScopeBuilder,
    RenovationAnchorsBuilder,
} from './contracts.js';
import {
    buildConstraintHierarchyBlock as buildV5Hierarchy,
    buildMoodboardScopeBlock as buildV5MoodboardScope,
    buildRenovationAnchorsBlock as buildV5RenovationAnchors,
} from '../balanced_v5/visualization.constants.js';

export const buildCanonicalConstraintHierarchy: ConstraintHierarchyBuilder = ({
    injectedItemCount,
    hasRenovationAnchors,
}) => buildV5Hierarchy(injectedItemCount, hasRenovationAnchors);

export const buildCanonicalMoodboardScope: MoodboardScopeBuilder = (
    styleName,
    stagingDensity,
) => buildV5MoodboardScope(styleName, stagingDensity);

export const buildCanonicalRenovationAnchors: RenovationAnchorsBuilder = (
    selections: ResolvedRenovationSelections,
) => buildV5RenovationAnchors(selections);



