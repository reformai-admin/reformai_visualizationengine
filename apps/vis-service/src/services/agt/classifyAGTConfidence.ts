import type {
    ArchitecturalGroundTruth,
    ClassifiedAGT,
    ClassifiedField,
    ConfidenceTier,
    EnforcementTier,
    WindowInstance,
    DoorInstance,
} from '../../types.js';

// ── Enforcement tier map ──────────────────────────────────────────────────────
// high   → hard fact (stated as measurement in AGT block)
// medium → advisory (soft guidance, can be overridden by model's visual judgment)
// low    → suppressed (field omitted from AGT block; V6.0 prose governs)

function toEnforcement(confidence: ConfidenceTier): EnforcementTier {
    if (confidence === 'high')   return 'hard';
    if (confidence === 'medium') return 'advisory';
    return 'suppressed';
}

// ── Conflict detection: downgrade high → medium when instances are missing/mixed ─

function deriveWindowEnforcement(
    raw: ArchitecturalGroundTruth['window_count'],
): { enforcement: EnforcementTier; confidence: ConfidenceTier } {
    if (raw.confidence !== 'high') {
        return { enforcement: toEnforcement(raw.confidence), confidence: raw.confidence };
    }
    // High confidence requires instance-level semantic validation
    if (!raw.instances || raw.instances.length === 0) {
        // High confidence but no instances to validate against — downgrade
        return { enforcement: 'advisory', confidence: 'medium' };
    }
    if (raw.instances.length !== raw.value) {
        // Instance count doesn't match declared count — inconsistency, downgrade
        return { enforcement: 'advisory', confidence: 'medium' };
    }
    // All instances present and typed — keep high
    return { enforcement: 'hard', confidence: 'high' };
}

function deriveDoorEnforcement(
    raw: ArchitecturalGroundTruth['door_count'],
): { enforcement: EnforcementTier; confidence: ConfidenceTier } {
    if (raw.confidence !== 'high') {
        return { enforcement: toEnforcement(raw.confidence), confidence: raw.confidence };
    }
    if (!raw.instances || raw.instances.length === 0) {
        return { enforcement: 'advisory', confidence: 'medium' };
    }
    if (raw.instances.length !== raw.value) {
        return { enforcement: 'advisory', confidence: 'medium' };
    }
    return { enforcement: 'hard', confidence: 'high' };
}

// ── Spatial anchor formatting ─────────────────────────────────────────────────

function formatWindowAnchors(instances: WindowInstance[]): string[] {
    return instances.map((inst, i) =>
        `Window ${i + 1}: ${inst.location}, ${inst.type === 'skylight' ? 'skylight opening' : 'external glazed opening'}`,
    );
}

function formatDoorAnchors(instances: DoorInstance[]): string[] {
    return instances.map((inst, i) =>
        `Door ${i + 1}: ${inst.location}, ${inst.type === 'open_archway' ? 'open archway' : 'solid door'}`,
    );
}

// ── Main classifier ───────────────────────────────────────────────────────────

export function classifyAGTConfidence(raw: ArchitecturalGroundTruth): ClassifiedAGT {
    const hardFacts:   string[] = [];
    const advisory:    string[] = [];
    const suppressed:  string[] = [];

    // ── window_count ──────────────────────────────────────────────────────────
    const windowResult = deriveWindowEnforcement(raw.window_count);
    const windowField: ClassifiedField = {
        enforcement:  windowResult.enforcement,
        displayValue: String(raw.window_count.value),
        spatialAnchors: windowResult.enforcement === 'hard' && raw.window_count.instances
            ? formatWindowAnchors(raw.window_count.instances)
            : undefined,
    };
    if (windowResult.enforcement === 'hard')       hardFacts.push('window_count');
    else if (windowResult.enforcement === 'advisory') advisory.push('window_count');
    else                                              suppressed.push('window_count');

    // ── door_count ────────────────────────────────────────────────────────────
    const doorResult = deriveDoorEnforcement(raw.door_count);
    const doorField: ClassifiedField = {
        enforcement:  doorResult.enforcement,
        displayValue: String(raw.door_count.value),
        spatialAnchors: doorResult.enforcement === 'hard' && raw.door_count.instances
            ? formatDoorAnchors(raw.door_count.instances)
            : undefined,
    };
    if (doorResult.enforcement === 'hard')       hardFacts.push('door_count');
    else if (doorResult.enforcement === 'advisory') advisory.push('door_count');
    else                                            suppressed.push('door_count');

    // ── has_ceiling_fixture ───────────────────────────────────────────────────
    const fixtureEnf = toEnforcement(raw.has_ceiling_fixture.confidence);
    const fixtureField: ClassifiedField = {
        enforcement:  fixtureEnf,
        displayValue: raw.has_ceiling_fixture.value ? 'PRESENT' : 'ABSENT',
    };
    if (fixtureEnf === 'hard')       hardFacts.push('has_ceiling_fixture');
    else if (fixtureEnf === 'advisory') advisory.push('has_ceiling_fixture');
    else                               suppressed.push('has_ceiling_fixture');

    // ── has_built_in_niches ───────────────────────────────────────────────────
    const nicheEnf = toEnforcement(raw.has_built_in_niches.confidence);
    const nicheField: ClassifiedField = {
        enforcement:  nicheEnf,
        displayValue: raw.has_built_in_niches.value ? 'PRESENT' : 'ABSENT',
    };
    if (nicheEnf === 'hard')       hardFacts.push('has_built_in_niches');
    else if (nicheEnf === 'advisory') advisory.push('has_built_in_niches');
    else                              suppressed.push('has_built_in_niches');

    // ── camera_perspective — never hard, always advisory at best ─────────────
    const camEnf: EnforcementTier = raw.camera_perspective.confidence === 'low'
        ? 'suppressed'
        : 'advisory';
    const camField: ClassifiedField = {
        enforcement:  camEnf,
        displayValue: raw.camera_perspective.value,
    };
    if (camEnf === 'advisory') advisory.push('camera_perspective');
    else                        suppressed.push('camera_perspective');

    return {
        window_count:        windowField,
        door_count:          doorField,
        has_ceiling_fixture: fixtureField,
        has_built_in_niches: nicheField,
        camera_perspective:  camField,
        hard_fact_fields:    hardFacts,
        advisory_fields:     advisory,
        suppressed_fields:   suppressed,
        confidence_distribution: {
            window_count:        raw.window_count.confidence,
            door_count:          raw.door_count.confidence,
            has_ceiling_fixture: raw.has_ceiling_fixture.confidence,
            has_built_in_niches: raw.has_built_in_niches.confidence,
            camera_perspective:  raw.camera_perspective.confidence,
        },
    };
}
