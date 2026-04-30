"""
generate_mask.py — creates a window mask for a given fixture image.

CURRENT STRATEGY: exterior-pane preservation only.

Mask covers ONLY the exterior-visible glass area.
Does NOT cover window frame, trim, sill, curtain zones, or room-side treatment.

Why:
  Full-window compositing (previous approach) made the window look pasted/frozen.
  The frame, trim, sheers, blinds, and curtains should remain generative so the
  model can style them to match the room. Only the outside scene should be locked.

Mask values:
  255 = protect (restore original exterior pixels during compositing)
  0   = allow generation (model output is kept)

Usage:
  python generate_mask.py             # uses defaults
  python generate_mask.py --preview   # also saves a visual overlay
"""

import argparse
import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter

AB_ROOT = Path(__file__).parent


def detect_glass_bounds(
    arr: np.ndarray,
    threshold_pct: float = 0.65,
) -> tuple[int, int, int, int]:
    """
    Detect the exterior-visible glass region via brightness sampling.
    Returns (x1, y1, x2, y2) — the tightest box around bright exterior pixels.
    """
    H, W = arr.shape[:2]

    # horizontal sample at 30% from top — through the glass
    row = arr[int(H * 0.30)]
    bh  = row.mean(axis=1)
    cols = np.where(bh > bh.max() * threshold_pct)[0]
    x1 = int(cols[0])  if len(cols) else int(W * 0.35)
    x2 = int(cols[-1]) if len(cols) else int(W * 0.72)

    # vertical sample at horizontal centre
    col = arr[:, W // 2]
    bv  = col.mean(axis=1)
    rows = np.where(bv > bv.max() * threshold_pct)[0]
    y1 = int(rows[0])  if len(rows) else int(H * 0.25)
    y2 = int(rows[-1]) if len(rows) else int(H * 0.56)

    return x1, y1, x2, y2


def build_mask(
    image_path:  Path,
    output_path: Path,
    inset:          int   = 20,   # shrink inward from glass edge to avoid frame bleed
    feather_radius: int   = 8,    # small feather for natural glass-edge blending
    threshold_pct:  float = 0.65,
    preview:        bool  = False,
) -> None:
    img = Image.open(image_path).convert("RGB")
    arr = np.array(img)
    H, W = arr.shape[:2]

    gx1, gy1, gx2, gy2 = detect_glass_bounds(arr, threshold_pct)
    print(f"  Glass detected:  x=[{gx1}, {gx2}]  y=[{gy1}, {gy2}]")

    # Inset slightly to stay inside the glass, away from frame pixels
    mx1 = min(W, gx1 + inset)
    my1 = min(H, gy1 + inset)
    mx2 = max(0,  gx2 - inset)
    my2 = max(0,  gy2 - inset)
    print(f"  Mask (glass only, inset {inset}px): x=[{mx1}, {mx2}]  y=[{my1}, {my2}]")
    print(f"  As % of image:   x=[{mx1/W:.1%}, {mx2/W:.1%}]  y=[{my1/H:.1%}, {my2/H:.1%}]")
    print(f"  Feather radius:  {feather_radius}px")
    print(f"  Frame/trim:      NOT masked (fully generative)")

    # Hard rectangle over the glass area only
    mask_arr = np.zeros((H, W), dtype=np.uint8)
    mask_arr[my1:my2, mx1:mx2] = 255

    # Small feather — softens the glass edge so the composite blends naturally
    # where generated curtains/frame meet the preserved exterior
    mask_img = Image.fromarray(mask_arr, mode="L")
    if feather_radius > 0:
        mask_feathered = mask_img.filter(ImageFilter.GaussianBlur(radius=feather_radius))
    else:
        mask_feathered = mask_img

    # Re-enforce core glass area as hard 255 so exterior is always 100% preserved
    feathered_arr = np.array(mask_feathered)
    core_pad = inset + feather_radius
    cx1 = min(W, gx1 + core_pad)
    cy1 = min(H, gy1 + core_pad)
    cx2 = max(0,  gx2 - core_pad)
    cy2 = max(0,  gy2 - core_pad)
    if cx1 < cx2 and cy1 < cy2:
        feathered_arr[cy1:cy2, cx1:cx2] = 255

    final_mask = Image.fromarray(feathered_arr, mode="L")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    final_mask.save(output_path)
    print(f"  Mask saved:      {output_path}")

    if preview:
        overlay  = img.copy().convert("RGBA")
        tint_arr = np.zeros((H, W, 4), dtype=np.uint8)
        tint_arr[:, :, 0] = 255
        tint_arr[:, :, 3] = (feathered_arr * 0.5).astype(np.uint8)
        preview_out = output_path.with_suffix(".preview.png")
        Image.alpha_composite(overlay, Image.fromarray(tint_arr, "RGBA")) \
             .convert("RGB").save(preview_out)
        print(f"  Preview saved:   {preview_out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image",     default="fixtures/Bedroom_test.jpeg")
    parser.add_argument("--out",       default="masks/bedroom_test_window.png")
    parser.add_argument("--inset",     type=int,   default=20)
    parser.add_argument("--feather",   type=int,   default=8)
    parser.add_argument("--threshold", type=float, default=0.65)
    parser.add_argument("--preview",   action="store_true")
    args = parser.parse_args()

    build_mask(
        image_path     = AB_ROOT / args.image,
        output_path    = AB_ROOT / args.out,
        inset          = args.inset,
        feather_radius = args.feather,
        threshold_pct  = args.threshold,
        preview        = args.preview,
    )
