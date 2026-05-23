import type { GenerateVisualizationParams } from '../../shared/types/index.js';
export type PipelineMode = NonNullable<GenerateVisualizationParams['pipelineMode']>;
export declare const resolvePipelineMode: (pipelineMode?: GenerateVisualizationParams["pipelineMode"]) => PipelineMode;
export declare const resolveHandlerMode: (mode: PipelineMode) => PipelineMode;
export declare const resolveDispatchModes: (pipelineMode?: GenerateVisualizationParams["pipelineMode"]) => {
    logMode: PipelineMode;
    handlerMode: PipelineMode;
};
export declare const normalizePipelineModeInput: (pipelineMode: unknown) => PipelineMode;
//# sourceMappingURL=pipeline-routing.d.ts.map