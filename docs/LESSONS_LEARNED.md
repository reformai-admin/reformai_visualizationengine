# ReformAI Visualization Engine -- Lessons Learned
**Last Updated:** 2026-05-21

## 1. Product/Model Lessons (Still True)
- Concrete visual tokens outperform abstract style labels.
- Structural constraints must be explicit and front-loaded.
- Image role labels are mandatory for multi-image reliability.
- Prompt-only constraints reduce risk but do not guarantee structural compliance.

## 2. Architecture Lessons (New)
- Repo clarity improves velocity: feature work is faster when folders map to responsibilities.
- Mixed folders (`services`, `runner`, `request`, `data`) caused onboarding friction and hidden coupling.
- A calm top-level source model (`transport/pipelines/prompts/guardrails/models/catalog/shared`) makes request flow predictable.
- Pipeline version identity must be explicit. Silent aliasing creates confusion during debugging and quality review.

## 3. Reliability Lessons
- V6/V7 structural drift investigations confirmed that prompt wording alone is not enough for strict architectural guarantees.
- AGT-style hard-fact injection improves structural consistency, but post-generation structural verification is still the long-term robustness path.

## 4. Process Lessons
- Execute refactors in low-risk sequence:
  1. structure first
  2. mechanical moves
  3. naming normalization
  4. import cleanup
  5. behavior updates
- Keep compile and contract checks green between each stage.

## 5. Current Practical Rules
- Put files where ownership is obvious.
- Avoid dumping-ground directories.
- Keep version folders explicit and searchable.
- Update docs immediately when path/semantic truth changes.
