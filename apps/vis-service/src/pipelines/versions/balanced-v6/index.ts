import { GenerateVisualizationParams } from '../../../shared/types/index.js';
import { generateVisualization as generateV5 } from '../balanced-v5/index.js';

export const generateVisualization = async (
  params: GenerateVisualizationParams,
): Promise<{ image: string; debug: any }> => {
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

