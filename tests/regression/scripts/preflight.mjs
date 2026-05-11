import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const configArgIdx = args.findIndex((a) => a === '--config');
const configRelativePath =
  configArgIdx >= 0 && args[configArgIdx + 1]
    ? args[configArgIdx + 1]
    : path.join('tests', 'regression', 'profiles', 'config.fast.yaml');

const configPath = path.isAbsolute(configRelativePath)
  ? configRelativePath
  : path.join(root, configRelativePath);
const assumptionsPath = path.join(root, 'tests', 'regression', 'assumptions', 'runtime_assumptions.json');

const configRaw = fs.readFileSync(configPath, 'utf8');
const assumptions = JSON.parse(fs.readFileSync(assumptionsPath, 'utf8'));

const parsePipelineEntries = (yamlText) => {
  const lines = yamlText.split(/\r?\n/);
  const entries = [];
  let inPipelines = false;
  let current = null;

  for (const line of lines) {
    if (!inPipelines) {
      if (/^\s*pipelines:\s*$/.test(line)) inPipelines = true;
      continue;
    }

    if (/^\S/.test(line) && !/^\s*-\s*mode:/.test(line)) break;

    const modeMatch = line.match(/^\s*-\s*mode:\s*([A-Za-z0-9_]+)/);
    if (modeMatch) {
      if (current) entries.push(current);
      current = { mode: modeMatch[1], role: undefined };
      continue;
    }

    const roleMatch = line.match(/^\s*role:\s*([A-Za-z0-9_]+)/);
    if (roleMatch && current) {
      current.role = roleMatch[1];
    }
  }

  if (current) entries.push(current);
  return entries;
};

const pipelineEntries = parsePipelineEntries(configRaw);
const configuredModes = pipelineEntries.map((e) => e.mode);
const configuredModeSet = new Set(configuredModes);

const required = assumptions.required_mode_matrix.flatMap((entry) => entry.modes);
const missing = required.filter((mode) => !configuredModeSet.has(mode));

const semanticMismatches = pipelineEntries
  .filter((entry) => assumptions.semantic_roles[entry.mode])
  .filter((entry) => entry.role !== assumptions.semantic_roles[entry.mode])
  .map((entry) => ({
    mode: entry.mode,
    expected: assumptions.semantic_roles[entry.mode],
    actual: entry.role ?? '(missing)',
  }));

const apiBaseMatch = configRaw.match(/^\s*api_base:\s*"([^"]+)"/m);
const apiBase = apiBaseMatch?.[1] ?? assumptions.default_api_base;
const healthUrl = `${apiBase.replace(/\/$/, '')}${assumptions.default_health_path}`;

console.log('Regression Preflight (Node, no Python)');
console.log(`Config: ${configPath}`);
console.log(`Assumptions: ${assumptionsPath}`);
console.log(`Configured modes: ${configuredModes.join(', ')}`);
console.log(`Health URL: ${healthUrl}`);
console.log(`Canonical active candidate: ${assumptions.comparison_assumptions.canonical_active_candidate}`);
if (semanticMismatches.length === 0) {
  console.log('Semantic roles: valid for configured modes');
}

if (missing.length > 0) {
  const msg = `Missing required benchmark/comparison modes: ${missing.join(', ')}`;
  if (strict) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(`WARNING ${msg}`);
  console.log('Preflight completed in non-strict mode.');
  process.exit(0);
}

if (semanticMismatches.length > 0) {
  const msg = `Semantic role mismatch(es): ${semanticMismatches
    .map((m) => `${m.mode} expected=${m.expected} actual=${m.actual}`)
    .join('; ')}`;
  if (strict) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(`WARNING ${msg}`);
}

console.log('Preflight passed: benchmark/comparison mode assumptions satisfied.');
console.log('Note: parser is intentionally lightweight and only supports current pipelines list shape (mode/role fields).');
