import type { GeminiPart } from '../shared/generation-parts.js';
export interface GeminiResult {
    image: string;
}
export declare const callGemini: (parts: GeminiPart[]) => Promise<GeminiResult>;
//# sourceMappingURL=gemini.client.d.ts.map