"""
adapters/window_fix.py — Window preservation post-processor.

Mechanism:
  1. Backend generates a styled image (identical call to baseline).
  2. We load the window mask for the source image.
  3. We composite the ORIGINAL pixels back over the generated image
     wherever the mask is non-zero.

Result:
  - Exterior background: fully restored (mask=255 hard zone)
  - Window frame: fully restored
  - Feathered edges: blend (mask=1–254)
  - Room interior / curtain hanging zones: fully generated (mask=0)

Known Phase-1 limitation:
  Generated curtains that extend into the hard glass zone will be
  overwritten by the original exterior. Curtains in the curtain zone
  (outside the mask) will survive. Full curtain-aware compositing
  is deferred to a later phase.
"""

import io
from pathlib import Path
import numpy as np
from PIL import Image

MASKS_DIR = Path(__file__).parent.parent / "masks"


def _load_mask(source_image_path: Path) -> Image.Image | None:
    """
    Try to find a window mask for the given source image.
    Naming convention: masks/{stem}_window.png
    Falls back to None if not found (caller must handle gracefully).
    """
    stem = source_image_path.stem.lower()
    candidate = MASKS_DIR / f"{stem}_window.png"
    if candidate.exists():
        return Image.open(candidate).convert("L")
    return None


def composite(
    original_path: Path,
    generated_bytes: bytes,
) -> bytes:
    """
    Composite original window region back onto the generated image.

    Args:
        original_path:   path to the source room image
        generated_bytes: raw image bytes returned by the backend

    Returns:
        PNG bytes of the composited result.
        If no mask is found, returns generated_bytes unchanged.
    """
    mask = _load_mask(original_path)
    if mask is None:
        # no mask for this fixture → return generation as-is
        return generated_bytes

    original  = Image.open(original_path).convert("RGB")
    generated = Image.open(io.BytesIO(generated_bytes)).convert("RGB")

    # align generated to original dimensions
    if generated.size != original.size:
        generated = generated.resize(original.size, Image.LANCZOS)

    # align mask to original dimensions (should already match, but be safe)
    if mask.size != original.size:
        mask = mask.resize(original.size, Image.LANCZOS)

    # compositing:
    #   PIL.Image.composite(im1, im2, mask)
    #   → where mask=255 use im1, where mask=0 use im2
    # We want: mask=255 → original (protected), mask=0 → generated
    result = Image.composite(original, generated, mask)

    buf = io.BytesIO()
    result.save(buf, format="PNG")
    return buf.getvalue()
