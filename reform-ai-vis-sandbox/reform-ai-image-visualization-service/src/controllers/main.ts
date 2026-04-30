import { FastifyRequest, FastifyReply } from 'fastify';
import { processVisualizationFormData } from '../utils/formdata.utils.js';
import { ValidationError } from '../utils/validation.utils.js';
import { generateVisualization } from '../services/geminiService.js';

export async function generateVisualizationController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!request.isMultipart()) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'El contenido debe ser multipart/form-data',
      });
    }

    const parts = request.parts();
    const queryMode = (request.query as any)?.mode as 'baseline_original' | 'balanced_v1' | 'balanced_v2' | 'balanced_v2_1' | 'balanced_v2_2' | 'balanced_v3_0' | 'balanced_v4_0' | 'balanced_v4_1' | 'improved_current' | undefined;
    const data = await processVisualizationFormData(parts, queryMode);
    const result = await generateVisualization(data);

    return reply.status(200).send({
      message: 'Visualización generada exitosamente',
      data: {
        image: result.image,
        metadata: {
          roomType: data.roomType,
          stylePreset: data.stylePreset.name,
          isRefinement: data.isRefinement,
        },
        debug: result.debug,
      },
    });

  } catch (error) {
    if (error instanceof ValidationError) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
      });
    }

    // Surface Gemini API errors with enough detail to debug
    const geminiError = extractGeminiError(error);
    if (geminiError) {
      request.log.error({ geminiError }, 'Gemini API error');
      return reply.status(502).send({
        error: 'Gemini API Error',
        message: geminiError.message,
        code: geminiError.code,
        status: geminiError.status,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function extractGeminiError(error: unknown): { message: string; code?: number; status?: string } | null {
  if (!error || typeof error !== 'object') return null;

  // @google/genai throws ApiError with a JSON string as message
  const err = error as Record<string, unknown>;
  const name = err['name'] as string | undefined;
  if (name !== 'ApiError') return null;

  try {
    const raw = JSON.parse(err['message'] as string) as {
      error?: { message?: string; code?: number; status?: string };
    };
    return {
      message: raw?.error?.message ?? String(err['message']),
      code: raw?.error?.code,
      status: raw?.error?.status,
    };
  } catch {
    return { message: String(err['message']) };
  }
}
