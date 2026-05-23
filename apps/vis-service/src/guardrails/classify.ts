import type {
    ArchitecturalGroundTruth,
    ClassifiedAGT,
    ClassifiedCountField,
    ClassifiedBooleanField,
    ClassifiedPerspectiveField,
    ConfidenceLevel,
    FieldEnforcement,
} from '../shared/types/agt.js';

const classifyCountField = (
    field: ArchitecturalGroundTruth['window_count'],
): ClassifiedCountField => {
    let enforcement: FieldEnforcement;

    if (field.confidence === 'high' && field.instances.length === field.value) {
        enforcement = 'hard';
    } else if (field.confidence === 'low') {
        enforcement = 'suppressed';
    } else {
        enforcement = 'advisory';
    }

    const spatialAnchors = field.instances.length > 0
        ? field.instances.map(i => `${i.location} (${i.type})`)
        : undefined;

    return {
        enforcement,
        displayValue: String(field.value),
        spatialAnchors,
    };
};

const classifyBooleanField = (
    field: ArchitecturalGroundTruth['has_ceiling_fixture'],
): ClassifiedBooleanField => {
    let enforcement: FieldEnforcement;

    if (field.confidence === 'high') {
        enforcement = 'hard';
    } else if (field.confidence === 'low') {
        enforcement = 'suppressed';
    } else {
        enforcement = 'advisory';
    }

    return {
        enforcement,
        displayValue: field.value ? 'PRESENT' : 'ABSENT',
    };
};

const classifyPerspectiveField = (
    field: ArchitecturalGroundTruth['camera_perspective'],
): ClassifiedPerspectiveField => {
    // Camera perspective is never enforced as hard — always advisory or suppressed.
    // It informs composition guidance but never overrides model judgment.
    const enforcement: FieldEnforcement = field.confidence === 'low' ? 'suppressed' : 'advisory';

    return {
        enforcement,
        displayValue: field.value,
    };
};

export const classifyAGTConfidence = (agt: ArchitecturalGroundTruth): ClassifiedAGT => {
    const window_count = classifyCountField(agt.window_count);
    const door_count = classifyCountField(agt.door_count);
    const has_ceiling_fixture = classifyBooleanField(agt.has_ceiling_fixture);
    const has_built_in_niches = classifyBooleanField(agt.has_built_in_niches);
    const camera_perspective = classifyPerspectiveField(agt.camera_perspective);

    const allFields: Array<{ name: string; enforcement: FieldEnforcement }> = [
        { name: 'window_count', enforcement: window_count.enforcement },
        { name: 'door_count', enforcement: door_count.enforcement },
        { name: 'has_ceiling_fixture', enforcement: has_ceiling_fixture.enforcement },
        { name: 'has_built_in_niches', enforcement: has_built_in_niches.enforcement },
        { name: 'camera_perspective', enforcement: camera_perspective.enforcement },
    ];

    const hard_fact_fields = allFields.filter(f => f.enforcement === 'hard').map(f => f.name);
    const advisory_fields = allFields.filter(f => f.enforcement === 'advisory').map(f => f.name);
    const suppressed_fields = allFields.filter(f => f.enforcement === 'suppressed').map(f => f.name);

    const rawConfidences: ConfidenceLevel[] = [
        agt.window_count.confidence,
        agt.door_count.confidence,
        agt.has_ceiling_fixture.confidence,
        agt.has_built_in_niches.confidence,
        agt.camera_perspective.confidence,
    ];

    const confidence_distribution = rawConfidences.reduce(
        (acc, c) => { acc[c] = (acc[c] ?? 0) + 1; return acc; },
        {} as Record<ConfidenceLevel, number>,
    );

    return {
        window_count,
        door_count,
        has_ceiling_fixture,
        has_built_in_niches,
        camera_perspective,
        hard_fact_fields,
        advisory_fields,
        suppressed_fields,
        confidence_distribution,
    };
};



