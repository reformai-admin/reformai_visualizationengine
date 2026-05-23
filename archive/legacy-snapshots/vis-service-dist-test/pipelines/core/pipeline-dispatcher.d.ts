import { GenerateVisualizationParams } from '../../shared/types/index.js';
import { type PipelineMode } from './pipeline-routing.js';
type PipelineHandler = (params: GenerateVisualizationParams) => Promise<{
    image: string;
    debug: any;
}>;
export declare const getPipelineHandlerForMode: (mode: PipelineMode) => PipelineHandler;
export declare const dispatchWithHandlers: (params: GenerateVisualizationParams, handlers: Record<PipelineMode, PipelineHandler>) => Promise<{
    image: string;
    debug: any;
}>;
export declare const generateVisualization: (params: GenerateVisualizationParams) => Promise<{
    image: string;
    debug: any;
}>;
export {};
//# sourceMappingURL=pipeline-dispatcher.d.ts.map