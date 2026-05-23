import type { ResolvedRenovationSelections } from '../../shared/types/index.js';
import type { ClassifiedAGT } from '../../shared/types/index.js';

export interface ConstraintHierarchyOptions {
    injectedItemCount: number;
    hasRenovationAnchors: boolean;
    hasHardAGTFacts?: boolean;
}

export type ConstraintHierarchyBuilder = (
    options: ConstraintHierarchyOptions,
) => string;

export type RenovationAnchorsBuilder = (
    selections: ResolvedRenovationSelections,
) => string;

export type MoodboardScopeBuilder = (
    styleName: string,
    stagingDensity: 'low' | 'medium' | 'high',
) => string;

export type AGTConstraintBlockBuilder = (agt: ClassifiedAGT) => string;
export type AGTEchoBlockBuilder = (agt: ClassifiedAGT) => string;
export type ConflictClausesBlockBuilder = (clauses: string[] | undefined) => string;

export interface AGTInsertionContract {
    agtConstraintBlock?: string;
    agtEchoBlock?: string;
}



