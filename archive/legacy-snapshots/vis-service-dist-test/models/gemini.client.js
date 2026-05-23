// Shared Gemini execution layer.
// Every pipeline calls callGemini() — no pipeline imports the Gemini SDK directly.
// Model selection, API init, response parsing, and error handling live here.
// Future concerns that belong here: retry logic, model routing, latency telemetry.
import { loadEnvFile } from 'node:process';
import { GoogleGenAI, Modality } from '@google/genai';
if (!process.env.K_SERVICE) {
    try {
        loadEnvFile();
    }
    catch {
        // .env file not found — rely on environment variables already set
    }
}
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error('API_KEY environment variable is not set.');
}
const ai = new GoogleGenAI({ apiKey: API_KEY });
// The active image generation model.
// Update this constant to switch models across all pipelines.
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
export const callGemini = async (parts) => {
    const response = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart?.inlineData?.data) {
        return { image: firstPart.inlineData.data };
    }
    const finishReason = response.candidates?.[0]?.finishReason;
    throw new Error(`No image returned by Gemini.${finishReason ? ` Finish reason: ${finishReason}` : ' Response may have been blocked.'}`);
};
//# sourceMappingURL=gemini.client.js.map