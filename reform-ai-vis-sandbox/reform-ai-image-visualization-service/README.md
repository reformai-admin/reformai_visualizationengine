GCP Build

---

## Prompt System

### Active Versions

| Pipeline | Query Mode | Template | Status |
|---|---|---|---|
| Balanced V5.1 | `balanced_v5` | **5.2.1** | ✅ Production candidate — moodboard, no catalogue |
| Balanced V6.0 | `balanced_v6` (→ `balanced_v5` internally) | **6.0.0** | 🧪 POC — V5.2.1 + Tier 2B Renovation Material Anchors |

V6.0 runs on the same `balanced_v5` backend pipeline. The `balanced_v6` query mode is an alias — the catalogue path activates only when the `X-Contractor-Id` header and `renovationSelectionIds` FormData field are present.

### Pipeline Modes

| Mode | Template | Description |
|---|---|---|
| `balanced_v5` | **5.2.1** | Lean V5 — moodboard + 6-tier constraint hierarchy (V5.1 with Hybrid C micro-patch) |
| `balanced_v6` | **6.0.0** | V5.2.1 + Tier 2B Renovation Material Anchors (contractor catalogue POC) |
| `balanced_v4_1` | 4.1 | Signature elements + lighting merge + ~21% compression |
| `balanced_v4_0` | 4.0 | Constraint hierarchy + image role labels + injected item identity |
| `balanced_v3_0` | 3.1 | Template injection layer + registry lookups + hard-fail validation |
| `balanced_v2_2` | — | Window immutability + aperture sanitizer + priority hierarchy |
| `balanced_v2_1` | — | Object placement + semantic furnishing rules |
| `balanced_v2` | — | Renovation framing + lighting preservation |
| `balanced_v1` | — | Structured anchoring + shell framing |
| `baseline_original` | — | Untouched production baseline |
| `improved_current` | — | Full structural sandwich (default) |

### V6.0 Request Contract

```
POST /generate-visualization?mode=balanced_v5
Header: X-Contractor-Id: <contractorId>
Body (multipart):
  renovationSelectionIds: JSON string, e.g. {"flooring":"floor_01","countertops":"counter_02"}
```

```
GET /api/catalogue
Header: X-Contractor-Id: <contractorId>
→ { contractorId, items: CatalogueItem[] }
```

### Docs

- `docs/CURRENT_STATE.md` — active version tracker, open items
- `docs/V5_COMPRESSION_CHANGELOG.md` — V5.1 compression details, regression notes, future engineer guide
