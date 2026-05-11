import { createHash } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { GoogleGenAI, Modality } from '@google/genai';
import type { MultipartFile } from '@fastify/multipart';
import type {
    ArchitecturalGroundTruth,
    ConfidenceTier,
    WindowInstance,
    DoorInstance,
} from '../../types.js';

if (!process.env.K_SERVICE) {
    try { loadEnvFile(); } catch { /* rely on env */ }
}

const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error('API_KEY environment variable is not set.');

const ai = new GoogleGenAI({ apiKey: API_KEY });

// ── In-memory content-addressed cache ────────────────────────────────────────
// Key: SHA-256 hex of image buffer. TTL: 5 minutes.

interface CacheEntry { agt: ArchitecturalGroundTruth; expiresAt: number; }
const AGT_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key: string): ArchitecturalGroundTruth | null {
    const entry = AGT_CACHE.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { AGT_CACHE.delete(key); return null; }
    return entry.agt;
}

function setCache(key: string, agt: ArchitecturalGroundTruth): void {
    if (AGT_CACHE.size >= 100) {
        // Evict oldest entry
        const firstKey = AGT_CACHE.keys().next().value;
        if (firstKey) AGT_CACHE.delete(firstKey);
    }
    AGT_CACHE.set(key, { agt, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Fallback ──────────────────────────────────────────────────────────────────

export const FALLBACK_AGT: ArchitecturalGroundTruth = {
    window_count:                  { value: 0, confidence: 'low' },
    door_count:                    { value: 0, confidence: 'low' },
    has_ceiling_fixture:           { value: false, confidence: 'low' },
    has_built_in_niches:           { value: false, confidence: 'low' },
    camera_perspective:            { value: 'straight_on', confidence: 'low' },
    extraction_confidence_overall: 'low',
    uncertain_fields:              ['window_count', 'door_count', 'has_ceiling_fixture', 'has_built_in_niches', 'camera_perspective'],
};

// ── Extraction prompt ─────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are analyzing an interior photograph to extract architectural facts.
Count and classify only the fixed architectural elements listed below.
Do not describe style, materials, furniture, or decor.
Do not give recommendations or suggestions.
Return a single JSON object and nothing else — no markdown, no explanation, no prose.

DEFINITIONS:
- window: an external glazed opening in a wall or ceiling (includes bay windows and skylights).
  NOT a window: mirrors, framed artwork, glass cabinet doors, interior glass partitions, display cases, or aquariums.
- door: a solid door or open archway (exclude glass sliders already counted as windows; include closet and interior doors if clearly visible).
- ceiling_fixture: any light source mounted directly on or recessed into the ceiling (recessed cans, pendants, chandeliers, flush mounts, track lighting). NOT floor lamps, table lamps, or wall sconces.
- built_in_niches: recessed alcoves, built-in shelving cavities, or storage cabinets structurally part of the wall. NOT freestanding furniture, bookshelves, or standalone wardrobes.

WINDOW CLASSIFICATION GUIDANCE:
- If you cannot confirm an opening is external-facing (leads to outdoors or exterior view), report confidence "medium" not "high".
- A large mirror that could be confused with a window must NOT be counted as a window.
- Prefer reporting lower confidence over inventing a confident wrong count.

JSON SCHEMA (return exactly this shape):
{
  "window_count": {
    "value": <integer ≥ 0>,
    "confidence": <"high"|"medium"|"low">,
    "instances": [
      { "location": "<brief wall/position descriptor>", "type": <"external_glazed"|"skylight"> }
    ]
  },
  "door_count": {
    "value": <integer ≥ 0>,
    "confidence": <"high"|"medium"|"low">,
    "instances": [
      { "location": "<brief descriptor>", "type": <"solid_door"|"open_archway"> }
    ]
  },
  "has_ceiling_fixture": { "value": <true|false>, "confidence": <"high"|"medium"|"low"> },
  "has_built_in_niches": { "value": <true|false>, "confidence": <"high"|"medium"|"low"> },
  "camera_perspective":  { "value": <"straight_on"|"corner"|"angled">, "confidence": <"high"|"medium"|"low"> }
}

CONFIDENCE RULES:
- "high": element is fully visible, count is unambiguous, no reasonable doubt.
- "medium": partially visible, possibly occluded, or classification is uncertain.
- "low": element not clearly visible or count is genuinely unclear.
- camera_perspective: "straight_on" = camera faces one wall directly; "corner" = two walls at roughly equal prominence; "angled" = oblique view.
- instances array: include one entry per counted window/door. If confidence is "low", instances may be an empty array.
- When uncertain between "high" and "medium", choose "medium". A wrong high-confidence fact is more harmful than an uncertain medium fact.`;

// ── Parser ────────────────────────────────────────────────────────────────────

function parseAGTResponse(raw: string): ArchitecturalGroundTruth {
    // Strip markdown fences if model wraps in ```json
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned);

    const toConfidence = (v: unknown): ConfidenceTier => {
        if (v === 'high' || v === 'medium' || v === 'low') return v;
        return 'low';
    };

    const windowInstances: WindowInstance[] = Array.isArray(parsed.window_count?.instances)
        ? parsed.window_count.instances
            .filter((i: any) => i.type === 'external_glazed' || i.type === 'skylight')
            .map((i: any) => ({ location: String(i.location ?? ''), type: i.type as WindowInstance['type'] }))
        : [];

    const doorInstances: DoorInstance[] = Array.isArray(parsed.door_count?.instances)
        ? parsed.door_count.instances
            .filter((i: any) => i.type === 'solid_door' || i.type === 'open_archway')
            .map((i: any) => ({ location: String(i.location ?? ''), type: i.type as DoorInstance['type'] }))
        : [];

    const windowConf  = toConfidence(parsed.window_count?.confidence);
    const doorConf    = toConfidence(parsed.door_count?.confidence);
    const fixtureConf = toConfidence(parsed.has_ceiling_fixture?.confidence);
    const nicheConf   = toConfidence(parsed.has_built_in_niches?.confidence);
    const camConf     = toConfidence(parsed.camera_perspective?.confidence);

    const uncertain: string[] = [];
    if (windowConf  === 'low') uncertain.push('window_count');
    if (doorConf    === 'low') uncertain.push('door_count');
    if (fixtureConf === 'low') uncertain.push('has_ceiling_fixture');
    if (nicheConf   === 'low') uncertain.push('has_built_in_niches');
    if (camConf     === 'low') uncertain.push('camera_perspective');

    const tiers: ConfidenceTier[] = [windowConf, doorConf, fixtureConf, nicheConf];
    const overallConf: ConfidenceTier =
        tiers.every(t => t === 'high') ? 'high' :
        tiers.some(t => t === 'high' || t === 'medium') ? 'medium' : 'low';

    return {
        window_count: {
            value:      Math.max(0, Math.round(Number(parsed.window_count?.value ?? 0))),
            confidence: windowConf,
            instances:  windowInstances,
        },
        door_count: {
            value:      Math.max(0, Math.round(Number(parsed.door_count?.value ?? 0))),
            confidence: doorConf,
            instances:  doorInstances,
        },
        has_ceiling_fixture: {
            value:      Boolean(parsed.has_ceiling_fixture?.value),
            confidence: fixtureConf,
        },
        has_built_in_niches: {
            value:      Boolean(parsed.has_built_in_niches?.value),
            confidence: nicheConf,
        },
        camera_perspective: {
            value: (['straight_on', 'corner', 'angled'].includes(parsed.camera_perspective?.value)
                ? parsed.camera_perspective.value
                : 'straight_on') as 'straight_on' | 'corner' | 'angled',
            confidence: camConf,
        },
        extraction_confidence_overall: overallConf,
        uncertain_fields: uncertain,
    };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function extractArchitecturalGroundTruth(
    image: MultipartFile & { buffer: Buffer },
): Promise<ArchitecturalGroundTruth> {
    const cacheKey = createHash('sha256').update(image.buffer).digest('hex');
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const ext  = (image.filename ?? '').split('.').pop()?.toLowerCase() ?? '';
    const mime = image.mimetype ?? (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png');

    try {
        const response = await Promise.race([
            ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: {
                    parts: [
                        { text: EXTRACTION_PROMPT },
                        { inlineData: { data: image.buffer.toString('base64'), mimeType: mime } },
                    ],
                },
                config: { responseModalities: [Modality.TEXT] },
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('AGT extraction timeout')), 800),
            ),
        ]);

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (!text) throw new Error('Empty response from AGT extraction model');

        const agt = parseAGTResponse(text);
        setCache(cacheKey, agt);
        return agt;

    } catch (err) {
        console.warn('[AGT] Extraction failed — using FALLBACK_AGT:', (err as Error).message);
        return FALLBACK_AGT;
    }
}
