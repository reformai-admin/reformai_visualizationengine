import { GenerateVisualizationParams } from '../types.js';
import * as baselineService from './baseline/geminiService.js';
import * as improvedService from './improved/geminiService.js';
import * as balancedService from './balanced/geminiService.js';
import * as balancedV2Service from './balanced_v2/geminiService.js';
import * as balancedV2_1Service from './balanced_v2_1/geminiService.js';
import * as balancedV2_2Service from './balanced_v2_2/geminiService.js';
import * as balancedV3_0Service from './balanced_v3_0/geminiService.js';
import * as balancedV4_0Service from './balanced_v4_0/geminiService.js';
import * as balancedV4_1Service from './balanced_v4_1/geminiService.js';
import * as balancedV5Service from './balanced_v5/geminiService.js';

/**
 * Main Dispatcher Service
 * Routes requests to the correct pipeline based on pipelineMode.
 *
 *   baseline_original → untouched production logic
 *   balanced_v1       → structured anchoring + shell framing + style expression
 *   balanced_v2       → structured anchoring + renovation framing + lighting preservation
 *   balanced_v2_1     → balanced_v2 + object placement logic + semantic furnishing rules
 *   balanced_v2_2     → balanced_v2_1 + window immutability + aperture sanitizer + priority hierarchy
 *   balanced_v3_0     → template-driven injection layer + registry lookups + hard-fail validation
 *   balanced_v4_0     → constraint hierarchy + image role labels + injected item identity preservation
 *   balanced_v4_1     → v4.0 + signature elements + lighting merge + prompt compression (~21%)
 *   balanced_v5       → v4.1 + moodboard scope block + conflict rule + updated moodboard role label (Lean V5)
 *   improved_current  → full structural sandwich (default)
 */
export const generateVisualization = async (params: GenerateVisualizationParams): Promise<{ image: string, debug: any }> => {
    const { pipelineMode } = params;

    if (pipelineMode === 'baseline_original') {
        console.log('[Dispatcher] Routing to BASELINE pipeline');
        return baselineService.generateVisualization(params);
    }

    if (pipelineMode === 'balanced_v1') {
        console.log('[Dispatcher] Routing to BALANCED V1 pipeline');
        return balancedService.generateVisualization(params);
    }

    if (pipelineMode === 'balanced_v2') {
        console.log('[Dispatcher] Routing to BALANCED V2 pipeline');
        return balancedV2Service.generateVisualization(params);
    }

    if (pipelineMode === 'balanced_v2_1') {
        console.log('[Dispatcher] Routing to BALANCED V2.1 pipeline');
        return balancedV2_1Service.generateVisualization(params);
    }

    if (pipelineMode === 'balanced_v2_2') {
        console.log('[Dispatcher] Routing to BALANCED V2.2 pipeline');
        return balancedV2_2Service.generateVisualization(params);
    }

    if (pipelineMode === 'balanced_v3_0') {
        console.log('[Dispatcher] Routing to BALANCED V3.0 pipeline');
        return balancedV3_0Service.generateVisualization(params);
    }

    if (pipelineMode === 'balanced_v4_0') {
        console.log('[Dispatcher] Routing to BALANCED V4.0 pipeline');
        return balancedV4_0Service.generateVisualization(params);
    }

    if (pipelineMode === 'balanced_v4_1') {
        console.log('[Dispatcher] Routing to BALANCED V4.1 pipeline');
        return balancedV4_1Service.generateVisualization(params);
    }

    if (pipelineMode === 'balanced_v5') {
        console.log('[Dispatcher] Routing to BALANCED V5 pipeline (Lean V5 — moodboard integration)');
        return balancedV5Service.generateVisualization(params);
    }

    console.log('[Dispatcher] Routing to IMPROVED pipeline');
    return improvedService.generateVisualization(params);
};
