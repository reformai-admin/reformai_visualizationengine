import { generateVisualization as generateV5 } from '../balanced-v5/index.js';
export const generateVisualization = async (params) => {
    const result = await generateV5(params);
    return {
        ...result,
        debug: {
            ...result.debug,
            pipelineMode: 'balanced_v6',
            templateVersion: '6.1.0',
        },
    };
};
//# sourceMappingURL=index.js.map