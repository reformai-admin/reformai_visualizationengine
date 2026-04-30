GCP Build

---

## Prompt System

### Active Version

`balanced_v5` → Template **5.1** (current production candidate)

V5.1 is a compression-only update to V5.0 (Lean Moodboard). No behavioral changes.
~36–40% smaller than V5.0/V4.1. See `docs/V5_COMPRESSION_CHANGELOG.md`.

### Pipeline Modes

| Mode | Template | Description |
|---|---|---|
| `balanced_v5` | **5.1** | Lean V5 — moodboard integration + Phase 1/2 compression |
| `balanced_v4_1` | 4.1 | Signature elements + lighting merge + ~21% compression |
| `balanced_v4_0` | 4.0 | Constraint hierarchy + image role labels + injected item identity |
| `balanced_v3_0` | 3.1 | Template injection layer + registry lookups + hard-fail validation |
| `balanced_v2_2` | — | Window immutability + aperture sanitizer + priority hierarchy |
| `balanced_v2_1` | — | Object placement + semantic furnishing rules |
| `balanced_v2` | — | Renovation framing + lighting preservation |
| `balanced_v1` | — | Structured anchoring + shell framing |
| `baseline_original` | — | Untouched production baseline |
| `improved_current` | — | Full structural sandwich (default) |

### Docs

- `docs/CURRENT_STATE.md` — active version tracker, open items
- `docs/V5_COMPRESSION_CHANGELOG.md` — V5.1 compression details, regression notes, future engineer guide
