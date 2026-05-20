# Archive

This directory holds pre-monorepo artifacts preserved for historical reference.
Nothing in this directory is imported or used by the current system.

## Contents

### `reform-ai-vis-sandbox/`
Pre-monorepo implementation. Contains the original React frontend (`src/App.jsx`)
and the original backend service (`reform-ai-image-visualization-service/`).
Superseded by `apps/vis-service/` (backend) and `apps/web-sandbox/` (frontend).
Preserved because several older test harnesses in `tests/moodboard_regression/`
originally targeted this service path.

### `Visualization_Engine_Baseline/`
Immutable snapshot of the original production service used as the historical
baseline anchor in regression comparisons. The `baseline_original` pipeline mode
in `apps/vis-service` corresponds to the behavior of this snapshot.
The snapshot itself is not running code — it exists as a reference only.

## Rules

Do not import from, modify, or depend on anything in this directory.
If a test harness needs updating to point at the current service, update
the harness — do not resurrect code from here.
