// ============================================================
// CATALOGUE REGISTRY — V6.0
//
// In-memory contractor catalogue store for POC.
// Production: replace getCatalogueRegistry() body with a DB query.
//
// Structure: Record<contractorId, CatalogueItem[]>
//
// promptDescription rules:
//   - REQUIRED — no item may be activated without one
//   - model-facing only — optimized for Gemini anchor compliance
//   - target 15–20 words: material + tone + finish + one distinctive trait
//   - name is UI-facing only; never appears in prompts
// ============================================================

import { CatalogueItem } from '../shared/types/index.js';

const CATALOGUE_REGISTRY: Record<string, CatalogueItem[]> = {

    contractor_demo: [

        // ── Flooring ─────────────────────────────────────────────────────────
        {
            id: 'floor_01',
            contractorId: 'contractor_demo',
            category: 'flooring',
            name: 'Light Oak Hardwood',
            promptDescription: 'Light warm-toned oak hardwood with a matte finish and natural wood grain',
            attributes: { material: 'oak', tone: 'light', warmth: 'warm', finish: 'matte', pattern: 'natural grain' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'floor_02',
            contractorId: 'contractor_demo',
            category: 'flooring',
            name: 'Dark Walnut Hardwood',
            promptDescription: 'Deep dark-toned walnut hardwood with a satin finish and rich linear grain',
            attributes: { material: 'walnut', tone: 'dark', warmth: 'warm', finish: 'satin', pattern: 'linear grain' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'floor_03',
            contractorId: 'contractor_demo',
            category: 'flooring',
            name: 'Light Grey Porcelain Tile',
            promptDescription: 'Light cool-toned grey large-format porcelain tile with a polished finish and subtle veining',
            attributes: { material: 'porcelain tile', tone: 'light', warmth: 'cool', finish: 'polished', pattern: 'subtle veining' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'floor_04',
            contractorId: 'contractor_demo',
            category: 'flooring',
            name: 'White Oak Herringbone',
            promptDescription: 'Medium warm-toned white oak hardwood in a herringbone pattern with a matte lacquer finish',
            attributes: { material: 'white oak', tone: 'medium', warmth: 'warm', finish: 'matte', pattern: 'herringbone' },
            active: true,
            contractorVisible: true,
        },

        // ── Walls ─────────────────────────────────────────────────────────────
        {
            id: 'wall_01',
            contractorId: 'contractor_demo',
            category: 'walls',
            name: 'Warm White',
            promptDescription: 'Warm white latex paint with a slightly warm undertone and flat finish',
            attributes: { material: 'latex paint', tone: 'light', warmth: 'warm', finish: 'flat', color: 'warm white' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'wall_02',
            contractorId: 'contractor_demo',
            category: 'walls',
            name: 'Warm Greige',
            promptDescription: 'Warm greige paint with a balanced beige-grey tone, slight warm undertone, and eggshell finish',
            attributes: { material: 'latex paint', tone: 'medium', warmth: 'warm', finish: 'eggshell', color: 'greige' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'wall_03',
            contractorId: 'contractor_demo',
            category: 'walls',
            name: 'Soft Sage Green',
            promptDescription: 'Soft muted sage green paint with cool-neutral undertones and a matte finish',
            attributes: { material: 'latex paint', tone: 'medium', warmth: 'cool', finish: 'matte', color: 'sage green' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'wall_04',
            contractorId: 'contractor_demo',
            category: 'walls',
            name: 'Charcoal Matte',
            promptDescription: 'Deep charcoal grey paint with a matte finish and cool neutral undertone',
            attributes: { material: 'latex paint', tone: 'dark', warmth: 'cool', finish: 'matte', color: 'charcoal grey' },
            active: true,
            contractorVisible: true,
        },

        // ── Countertops ───────────────────────────────────────────────────────
        {
            id: 'counter_01',
            contractorId: 'contractor_demo',
            category: 'countertops',
            name: 'Black Granite',
            promptDescription: 'Deep charcoal black granite with subtle natural veining and a honed matte finish',
            attributes: { material: 'granite', tone: 'dark', warmth: 'neutral', finish: 'honed', pattern: 'subtle veining', color: 'black' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'counter_02',
            contractorId: 'contractor_demo',
            category: 'countertops',
            name: 'Carrara Marble',
            promptDescription: 'White Carrara marble with fine grey veining and a polished finish',
            attributes: { material: 'marble', tone: 'light', warmth: 'cool', finish: 'polished', pattern: 'grey veining', color: 'white' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'counter_03',
            contractorId: 'contractor_demo',
            category: 'countertops',
            name: 'Warm Quartz',
            promptDescription: 'Medium warm-toned quartz with a uniform surface and soft sheen, minimal veining',
            attributes: { material: 'quartz', tone: 'medium', warmth: 'warm', finish: 'satin', pattern: 'minimal veining' },
            active: true,
            contractorVisible: true,
        },

        // ── Cabinets ──────────────────────────────────────────────────────────
        {
            id: 'cabinet_01',
            contractorId: 'contractor_demo',
            category: 'cabinets',
            name: 'Walnut Flat Panel',
            promptDescription: 'Warm dark walnut flat-panel cabinet doors with horizontal grain and a satin finish',
            attributes: { material: 'walnut', tone: 'dark', warmth: 'warm', finish: 'satin', pattern: 'horizontal grain' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'cabinet_02',
            contractorId: 'contractor_demo',
            category: 'cabinets',
            name: 'Crisp White Shaker',
            promptDescription: 'Crisp white shaker-style cabinet doors with a recessed panel and semi-gloss finish',
            attributes: { material: 'painted MDF', tone: 'light', warmth: 'neutral', finish: 'semi-gloss', color: 'white' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'cabinet_03',
            contractorId: 'contractor_demo',
            category: 'cabinets',
            name: 'Navy Blue Shaker',
            promptDescription: 'Deep navy blue shaker-style cabinet doors with a recessed panel and satin finish',
            attributes: { material: 'painted MDF', tone: 'dark', warmth: 'cool', finish: 'satin', color: 'navy blue' },
            active: true,
            contractorVisible: true,
        },
        {
            id: 'cabinet_04',
            contractorId: 'contractor_demo',
            category: 'cabinets',
            name: 'Light Oak Slab',
            promptDescription: 'Light warm-toned oak slab cabinet doors with a flat profile and matte lacquer finish',
            attributes: { material: 'oak veneer', tone: 'light', warmth: 'warm', finish: 'matte', pattern: 'natural grain' },
            active: true,
            contractorVisible: true,
        },

    ],

};

export const getCatalogueRegistry = (): Record<string, CatalogueItem[]> => CATALOGUE_REGISTRY;


