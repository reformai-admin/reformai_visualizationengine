export const ENDPOINT = '/generate-visualization';
export const HEALTH   = '/health';

export const PRESET_SUGGESTIONS = [
  'Modern', 'Contemporary', 'Minimalist', 'Industrial', 'Midcentury Modern',
  'Farmhouse', 'Coastal', 'Japandi', 'Rustic', 'Bohemian',
  'Biophilic', 'French Country', 'Japanese', 'Neoclassic', 'Vintage'
];

export const ROOM_TYPES = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room',
  'Home Office', 'Studio', 'Hallway',
];

export const PIPELINE_LABELS = {
  'balanced_v7':      'Balanced V7.0 (Canonical Active Candidate)',
  'balanced_v6':      'Balanced V6.0 (Compatibility Path / Alias to V5 + Catalogue)',
  'balanced_v5':      'Balanced V5.2.1 (Frozen Benchmark - Moodboard Evolution)',
  'balanced_v4_1':    'Balanced V4.1 (Frozen Benchmark - Furniture/Control Evolution)',
  'balanced_v4_0':    'Balanced V4.0 (Frozen Benchmark - Furniture/Control Evolution)',
  'balanced_v3_0':    'Balanced V3.0 (Historical Benchmark)',
  'balanced_v2_2':    'Balanced V2.2 (Historical Benchmark)',
  'balanced_v2_1':    'Balanced V2.1 (Historical Benchmark)',
  'balanced_v2':      'Balanced V2 (Historical Benchmark)',
  'balanced_v1':      'Balanced V1 (Historical Benchmark)',
  'improved_current': 'Improved Current (Historical Comparison Path - Frozen Benchmark)',
};

export const CATEGORY_ORDER = ['flooring', 'walls', 'countertops', 'cabinets'];
