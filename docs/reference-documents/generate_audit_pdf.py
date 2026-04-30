from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import os

OUTPUT_PATH = r"C:\Users\cjlea\AI-Projects\Visualization_Engine\ReformAI_Visualization_Audit_2026-04-22.pdf"

# ── Colours ──────────────────────────────────────────────────────────────────
BRAND_DARK   = colors.HexColor("#0D1117")
BRAND_BLUE   = colors.HexColor("#1A6FE8")
BRAND_LIGHT  = colors.HexColor("#E8F0FD")
GREY_MID     = colors.HexColor("#6B7280")
GREY_LIGHT   = colors.HexColor("#F3F4F6")
RED_SOFT     = colors.HexColor("#FEE2E2")
RED_DARK     = colors.HexColor("#DC2626")
YELLOW_SOFT  = colors.HexColor("#FEF9C3")
YELLOW_DARK  = colors.HexColor("#CA8A04")
GREEN_SOFT   = colors.HexColor("#DCFCE7")
GREEN_DARK   = colors.HexColor("#16A34A")
CODE_BG      = colors.HexColor("#1E2430")
CODE_FG      = colors.HexColor("#E2E8F0")

# ── Styles ────────────────────────────────────────────────────────────────────
base = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

styles = {
    "cover_title": S("cover_title",
        fontSize=28, leading=34, textColor=colors.white,
        fontName="Helvetica-Bold", alignment=TA_LEFT),
    "cover_sub": S("cover_sub",
        fontSize=13, leading=18, textColor=colors.HexColor("#CBD5E1"),
        fontName="Helvetica", alignment=TA_LEFT),
    "cover_meta": S("cover_meta",
        fontSize=10, leading=14, textColor=colors.HexColor("#94A3B8"),
        fontName="Helvetica", alignment=TA_LEFT),
    "h1": S("h1",
        fontSize=18, leading=24, textColor=BRAND_BLUE,
        fontName="Helvetica-Bold", spaceBefore=20, spaceAfter=6),
    "h2": S("h2",
        fontSize=13, leading=18, textColor=BRAND_DARK,
        fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=4),
    "h3": S("h3",
        fontSize=11, leading=15, textColor=GREY_MID,
        fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=3),
    "body": S("body",
        fontSize=10, leading=15, textColor=BRAND_DARK,
        fontName="Helvetica", spaceAfter=6, alignment=TA_JUSTIFY),
    "bullet": S("bullet",
        fontSize=10, leading=14, textColor=BRAND_DARK,
        fontName="Helvetica", leftIndent=16, spaceAfter=3,
        bulletIndent=6),
    "code": S("code",
        fontSize=8.5, leading=13, textColor=CODE_FG,
        fontName="Courier", backColor=CODE_BG,
        leftIndent=10, rightIndent=10,
        spaceBefore=4, spaceAfter=4,
        borderPadding=(6, 8, 6, 8)),
    "label": S("label",
        fontSize=9, leading=12, textColor=GREY_MID,
        fontName="Helvetica-Bold"),
    "finding_title": S("finding_title",
        fontSize=11, leading=15, textColor=BRAND_DARK,
        fontName="Helvetica-Bold", spaceAfter=2),
    "caption": S("caption",
        fontSize=8.5, leading=12, textColor=GREY_MID,
        fontName="Helvetica-Oblique", alignment=TA_CENTER),
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def H1(text): return Paragraph(text, styles["h1"])
def H2(text): return Paragraph(text, styles["h2"])
def H3(text): return Paragraph(text, styles["h3"])
def B(text):  return Paragraph(f"&#8226;&nbsp;&nbsp;{text}", styles["bullet"])
def P(text):  return Paragraph(text, styles["body"])
def Code(text):
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(escaped, styles["code"])
def SP(n=6):  return Spacer(1, n)
def HR():     return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceAfter=4)

def badge(text, bg, fg):
    return Table([[Paragraph(text, ParagraphStyle("b", fontSize=8,
        fontName="Helvetica-Bold", textColor=fg))]],
        colWidths=[None],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), bg),
            ("TOPPADDING", (0,0), (-1,-1), 3),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
            ("LEFTPADDING", (0,0), (-1,-1), 6),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
            ("ROUNDEDCORNERS", [3]),
        ]))

def info_box(text, bg=BRAND_LIGHT, border=BRAND_BLUE):
    tbl = Table([[Paragraph(text, ParagraphStyle("ib", fontSize=9.5, leading=14,
            fontName="Helvetica", textColor=BRAND_DARK))]],
        colWidths=[6.5*inch],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), bg),
            ("LINEAFTER", (0,0), (0,-1), 3, border),
            ("TOPPADDING", (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("LEFTPADDING", (0,0), (-1,-1), 12),
            ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ]))
    return tbl

def warning_box(text):
    return info_box(text, bg=RED_SOFT, border=RED_DARK)

def note_box(text):
    return info_box(text, bg=YELLOW_SOFT, border=YELLOW_DARK)

def success_box(text):
    return info_box(text, bg=GREEN_SOFT, border=GREEN_DARK)

def data_table(headers, rows, col_widths=None):
    data = [headers] + rows
    col_widths = col_widths or [6.5*inch / len(headers)] * len(headers)
    tbl = Table(data, colWidths=col_widths)
    ts = TableStyle([
        ("BACKGROUND", (0,0), (-1,0), BRAND_DARK),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,0), 9),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE", (0,1), (-1,-1), 8.5),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 7),
        ("RIGHTPADDING", (0,0), (-1,-1), 7),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GREY_LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("WORDWRAP", (0,0), (-1,-1), True),
    ])
    tbl.setStyle(ts)
    return tbl

def make_cell(text, bold=False):
    fn = "Helvetica-Bold" if bold else "Helvetica"
    return Paragraph(text, ParagraphStyle("tc", fontSize=8.5, leading=12,
        fontName=fn, textColor=BRAND_DARK))

# ── Cover page ────────────────────────────────────────────────────────────────
def cover_page():
    cover_bg = Table(
        [[Paragraph("Reform-AI Image Visualization Service", styles["cover_title"]),
          Paragraph("Deep Technical Audit", ParagraphStyle("ct2",
            fontSize=22, leading=28, textColor=colors.HexColor("#93C5FD"),
            fontName="Helvetica-Bold")),
          SP(8),
          Paragraph("Root-cause analysis of spatial preservation, window handling,<br/>"
                    "style instability, moodboard weighting, furniture deformation,<br/>"
                    "and error resilience failures.", styles["cover_sub"]),
          SP(20),
          Paragraph("Date: 2026-04-22", styles["cover_meta"]),
          Paragraph("Repository: Aakash-Asymmetri/reform-ai-image-visualization-service", styles["cover_meta"]),
          Paragraph("Stack: Node.js / TypeScript · Fastify · Google Gemini 2.5 Flash Image", styles["cover_meta"]),
          Paragraph("Prepared by: Claude Code (Anthropic) for Reform-AI", styles["cover_meta"]),
        ]],
        colWidths=[6.5*inch],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), BRAND_DARK),
            ("TOPPADDING", (0,0), (-1,-1), 48),
            ("BOTTOMPADDING", (0,0), (-1,-1), 48),
            ("LEFTPADDING", (0,0), (-1,-1), 36),
            ("RIGHTPADDING", (0,0), (-1,-1), 36),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
        ])
    )
    return [cover_bg, PageBreak()]

# ── Document builder ──────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        leftMargin=0.9*inch, rightMargin=0.9*inch,
        topMargin=0.8*inch, bottomMargin=0.8*inch,
        title="Reform-AI Visualization Audit 2026-04-22",
        author="Claude Code / Anthropic",
    )

    story = []

    # ── Cover ─────────────────────────────────────────────────────────────────
    story += cover_page()

    # ── Executive Summary ─────────────────────────────────────────────────────
    story += [H1("Executive Summary"), HR()]
    story += [warning_box(
        "<b>Critical finding:</b> The visualization engine is entirely text-prompt driven. "
        "Every structural guarantee the product promises — spatial preservation, window integrity, "
        "furniture identity, style control — is enforced only through advisory text instructions "
        "to a generative model. There are no masks, no segmentation, no depth conditioning, "
        "no candidates, and no output validation. The system behaves more like scene generation "
        "than constrained renovation transformation."), SP(8)]

    story += [P("Six primary failure categories were identified through code analysis, "
               "each traced to specific root causes in the pipeline:")]

    summary_rows = [
        [make_cell("Failure", bold=True), make_cell("Root Cause", bold=True), make_cell("Severity", bold=True)],
        [make_cell("Spatial preservation"), make_cell("Soft text constraints only; no structural anchor"), make_cell("Critical")],
        [make_cell("Window/background handling"), make_cell("Constraint covers count only, not position/content"), make_cell("Critical")],
        [make_cell("Style instability"), make_cell("Style name is text; imageUrl is unused dead code"), make_cell("High")],
        [make_cell("Moodboard weighting"), make_cell("3 discrete text states; images ordered after prompt"), make_cell("High")],
        [make_cell("Furniture deformation"), make_cell("No region lock; furniture placed last in parts array"), make_cell("Medium")],
        [make_cell("Error handling"), make_cell("No retry, no timeout, no output validation, generic 500"), make_cell("Medium")],
    ]
    tbl = Table(summary_rows, colWidths=[2.2*inch, 3.2*inch, 1.1*inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), BRAND_DARK),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 9),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GREY_LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
        ("TEXTCOLOR", (2,1), (2,2), RED_DARK), ("FONTNAME", (2,1), (2,2), "Helvetica-Bold"),
        ("TEXTCOLOR", (2,3), (2,4), YELLOW_DARK), ("FONTNAME", (2,3), (2,4), "Helvetica-Bold"),
        ("TEXTCOLOR", (2,5), (2,6), GREY_MID), ("FONTNAME", (2,5), (2,6), "Helvetica-Bold"),
    ]))
    story += [tbl, PageBreak()]

    # ── A. Architecture ───────────────────────────────────────────────────────
    story += [H1("A. Current System Architecture"), HR()]
    story += [H2("Stack")]
    story += [B("Runtime: Node.js / TypeScript, Fastify v5"),
              B("AI model: Google Gemini 2.5 Flash Image via @google/genai v1.30.0"),
              B("Validation: Zod v4"), B("Transport: multipart/form-data"),
              B("Deployment: Google Cloud Run"), SP(8)]

    story += [H2("Full Request Pipeline")]
    story += [Code(
"""POST /generate-visualization (multipart/form-data)
  │
  ▼  src/index.ts  — Fastify + multipart (10 MB files, 15 files max)
  │
  ▼  src/controllers/main.ts :: generateVisualizationController()
  │   • Guards multipart content-type
  │   • Calls processVisualizationFormData()
  │   • Calls generateVisualization()
  │   • Returns { image: base64, metadata }
  │
  ├── src/utils/formdata.utils.ts :: processVisualizationFormData()
  │    • Iterates & buffers all multipart parts into memory
  │    • Validates roomImage presence & MIME type
  │    • Validates moodBoardImages count (max 10)
  │    • Parses styleInfluence (number), isRefinement (bool), stylePreset (JSON)
  │    • Runs Zod schema validation
  │
  ├── src/prompts/visualization.prompt.ts
  │    • buildInfluencePrompt()   → one of 3 discrete text strings
  │    • buildFurniturePrompt()   → text block or empty string
  │    • buildVisualizationPrompt() → template string substitution
  │
  └── src/services/geminiService.ts :: generateVisualization()
       • Assembles multimodal parts array
       • Calls ai.models.generateContent() — ONE call, ONE candidate
       • Returns candidates[0].content.parts[0].inlineData.data (base64)"""
    ), SP(8)]

    story += [H2("Data Shape: What Is Preserved vs Lost")]
    rows = [
        [make_cell("Stage"), make_cell("Arrives"), make_cell("Used"), make_cell("Dropped")],
        [make_cell("FormData in"), make_cell("All fields + files"),
         make_cell("All buffered"), make_cell("Nothing yet")],
        [make_cell("After Zod"), make_cell("Same + validated types"),
         make_cell("All"), make_cell("None")],
        [make_cell("Prompt build"), make_cell("stylePreset.name, roomType, styleInfluence, hasFurniture"),
         make_cell("Text only"), make_cell("stylePreset.imageUrl — PERMANENTLY DISCARDED")],
        [make_cell("Gemini request"), make_cell("roomImage, previousResultImage?, textPrompt, moodBoardImages[], furnitureImage?"),
         make_cell("Images + text"), make_cell("stylePreset.imageUrl (fetched nowhere)")],
        [make_cell("Response"), make_cell("One candidate, one image part"),
         make_cell("base64 string"), make_cell("All other candidates (none generated)")],
    ]
    tbl = Table(rows, colWidths=[1.3*inch, 1.9*inch, 1.5*inch, 1.8*inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), BRAND_DARK),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GREY_LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TEXTCOLOR", (3,3), (3,3), RED_DARK),
    ]))
    story += [tbl, PageBreak()]

    # ── B. Where Pipeline Loses Control ───────────────────────────────────────
    story += [H1("B. Where the Pipeline Is Losing Control"), HR()]
    story += [warning_box(
        "<b>The entire engine is text-prompt driven.</b> There are zero non-text control "
        "mechanisms in production. Every structural guarantee depends on asking a generative "
        "model to comply via natural language."), SP(8)]

    mech_rows = [
        [make_cell("Mechanism"), make_cell("Exists?"), make_cell("Notes")],
        [make_cell("img2img strength / denoise control"), make_cell("No"), make_cell("Image sent as reference; blend strength not adjustable")],
        [make_cell("Inpainting / masking"), make_cell("No"), make_cell("No region preservation of any kind")],
        [make_cell("Segmentation"), make_cell("No"), make_cell("Windows, walls, floors not segmented")],
        [make_cell("Depth conditioning"), make_cell("No"), make_cell("")],
        [make_cell("Edge conditioning"), make_cell("No"), make_cell("")],
        [make_cell("ControlNet equivalents"), make_cell("No"), make_cell("")],
        [make_cell("Negative prompts"), make_cell("No"), make_cell("No 'avoid' list of any kind")],
        [make_cell("Seed control"), make_cell("No"), make_cell("No reproducibility; every run is random")],
        [make_cell("Multiple candidates + reranking"), make_cell("No"), make_cell("Exactly one generation per request")],
        [make_cell("Output spatial validation"), make_cell("No"), make_cell("Bad outputs returned identically to good ones")],
        [make_cell("Retry on failure"), make_cell("No"), make_cell("")],
        [make_cell("Timeout on generation call"), make_cell("No"), make_cell("Hung call hangs the request indefinitely")],
    ]
    tbl = Table(mech_rows, colWidths=[2.5*inch, 0.8*inch, 3.2*inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), BRAND_DARK),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8.5),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GREY_LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TEXTCOLOR", (1,1), (1,-1), RED_DARK),
        ("FONTNAME", (1,1), (1,-1), "Helvetica-Bold"),
    ]))
    story += [tbl, PageBreak()]

    # ── C. Root-Cause Analysis ────────────────────────────────────────────────
    story += [H1("C. Root-Cause Analysis by Failure Mode"), HR()]

    # Failure A
    story += [KeepTogether([
        H2("Failure A — Spatial Preservation"),
        P("<b>Symptom:</b> Outputs show changed room geometry, shifted camera angle, different "
          "wall/window layout — behaves like scene regeneration rather than controlled transformation."),
        H3("Technical Cause"),
        P("The only spatial constraints are advisory text instructions:"),
        Code('"Do NOT change the room\'s core structure, such as walls, windows, or doors position."\n'
             '"Maintain the original room\'s geometry and proportions."\n'
             '"Mantain the picture perspective"'),
        P("Gemini 2.5 Flash Image is a generative model trained to produce plausible images, not "
          "to structurally preserve input geometry. When a style request strongly implies a different "
          "spatial aesthetic, the model's generative prior overrides soft text constraints. There is "
          "no depth map, no edge lock, no structural anchor."),
        H3("Code Evidence"),
        B("src/prompts/visualization.constants.ts — lines 22–27 (both prompt templates)"),
        B("src/services/geminiService.ts — no preprocessing, no mask, no control image"),
        H3("Fix Location"), B("src/services/geminiService.ts — add control structures (Tier 3)"),
        B("src/prompts/visualization.constants.ts — harden constraint language (Tier 1)"),
        H3("Risk / Effort / Impact"),
        P("Prompt hardening: Low effort, partial improvement on conservative styles. "
          "Real fix requires structural conditioning (Tier 3, high effort, high impact)."),
    ])]
    story += [SP(8), HR()]

    # Failure B
    story += [KeepTogether([
        H2("Failure B — Window / Background Handling"),
        P("<b>Symptom:</b> Background visible through windows is replaced; windows are obstructed; "
          "window shape and position drift between input and output."),
        H3("Technical Cause"),
        P("The window constraint in both prompt templates is:"),
        Code('"Do NOT change the room\'s core structure, such as walls, windows, or doors position."\n'
             '"Mantain the amount of windows."'),
        P("This only protects window <i>count</i>. It says nothing about position, shape, scale, "
          "or the view through the window. There is no masking or segmentation of window regions. "
          "The model has full freedom to alter what is seen through windows, change their shape, "
          "or obstruct them with design elements."),
        H3("Code Evidence"),
        B("src/prompts/visualization.constants.ts — window constraint is weaker than geometry constraint"),
        B("No window segmentation, mask, or region-lock anywhere in the codebase"),
        H3("Fix Location"),
        B("src/prompts/visualization.constants.ts — immediate prompt fix (Tier 1)"),
        B("New preprocessing stage — window segmentation mask (Tier 3)"),
    ])]
    story += [SP(4), note_box(
        "<b>Recommended replacement constraint (Tier 1):</b><br/>"
        '"Windows MUST remain in their exact original position, shape, and size. '
        'The view through each window — the background, light, and exterior — must be completely preserved. '
        'Do NOT obstruct windows with furniture or decor. Do NOT alter what is visible through windows."'
    ), SP(8), HR()]

    # Failure C
    story += [KeepTogether([
        H2("Failure C — Style Instability"),
        P("<b>Symptom:</b> Some styles produce reliable spatial results; others override all "
          "constraints and produce scene regeneration."),
        H3("Technical Cause"),
        P("A style preset is defined as:"),
        Code("export const stylePresetSchema = z.object({\n"
             "    name: z.string().min(1, ...),\n"
             "    imageUrl: z.string().url(...),  // validated but NEVER USED\n"
             "});"),
        P("The style name is passed as the text token {{STYLE_NAME}} in the prompt. "
          "The imageUrl is validated but <b>never fetched, never sent to Gemini, and never used "
          "anywhere in the pipeline.</b> All styles receive identical treatment in code — the same "
          "prompt template, the same constraint blocks, the same generation parameters."),
        P("Aggressive styles (whose Gemini training representation implies dramatic spatial "
          "transformations) simply outcompete soft text constraints. The model's learned prior "
          "for 'Industrial Loft' includes spatial reorganization — and there is nothing in the "
          "system to override it."),
        H3("Code Evidence"),
        B("src/services/geminiService.ts line 64 — only stylePreset.name is used"),
        B("stylePreset.imageUrl is validated in schema but referenced nowhere in the service layer"),
        B("No style-specific constraint variation anywhere in the codebase"),
        H3("Fix Location"),
        B("src/services/geminiService.ts — fetch imageUrl and include as reference image (Tier 1)"),
        B("New src/config/styles.config.ts — style tier definitions (Tier 1–2)"),
        B("src/prompts/visualization.prompt.ts — inject tier-specific constraint blocks (Tier 2)"),
    ])]
    story += [SP(8), HR()]

    # Failure D
    story += [KeepTogether([
        H2("Failure D — Moodboard Weighting Inconsistency"),
        P("<b>Symptom:</b> Moodboards work well with neutral styles; they appear ignored "
          "in aggressive styles. The slider feels non-functional."),
        H3("Technical Cause 1 — Only 3 Discrete States"),
        P("The styleInfluence slider is 0–100 continuous, but buildInfluencePrompt() "
          "collapses it to three text strings:"),
        Code("if (styleInfluence < 33)  → 'Heavily prioritize the preset style...'\n"
             "else if (styleInfluence > 66) → 'Heavily prioritize the provided mood board images...'\n"
             "else → 'Blend the preset style and mood board images evenly.'"),
        P("A slider at 1 and a slider at 32 produce identical prompts. "
          "A slider at 67 and 99 produce identical prompts."),
        H3("Technical Cause 2 — Parts Ordering"),
        P("In geminiService.ts, mood board images are pushed to the parts array "
          "<b>after</b> the text prompt:"),
        Code("parts.push({ text: fullPrompt });   // text FIRST\nparts.push(...moodBoardParts);      // mood board images AFTER text"),
        P("For multimodal models, reference images placed after an instruction may receive "
          "less contextual weight than images placed before it."),
        H3("Technical Cause 3 — Style Dominance Is Emergent"),
        P("When an aggressive style name carries strong generative weight in Gemini's training "
          "data, the text instruction to blend with a moodboard loses against the model's learned "
          "style representation. There is no mechanism to force moodboard influence at the model level."),
        H3("Fix Location"),
        B("src/services/geminiService.ts — reorder: moodboard images before text prompt (Tier 1)"),
        B("src/prompts/visualization.prompt.ts — continuous weighting language (Tier 2)"),
    ])]
    story += [SP(8), HR(), PageBreak()]

    # Failure E
    story += [KeepTogether([
        H2("Failure E — Furniture Deformation"),
        P("<b>Symptom:</b> Uploaded furniture is usually included but gets structurally deformed, "
          "especially headboards. Object identity is not reliably preserved."),
        H3("Technical Cause"),
        P("Furniture is passed as a raw image with text instructions to 'incorporate this exact "
          "piece of furniture.' There is no region locking, no segmentation of the furniture from "
          "its background in the upload, and no mechanism to force the model to treat the furniture "
          "as an immutable object. When an aggressive style is active, Gemini's style transformation "
          "impulse deforms the furniture to match the style aesthetic."),
        P("Additionally, the furnitureImage is pushed <b>last</b> in the parts array, after all "
          "mood board images — reducing its positional influence relative to the room image and prompt."),
        H3("Code Evidence"),
        B("src/services/geminiService.ts lines 86–89 — furniture pushed last"),
        B("src/prompts/visualization.constants.ts lines 65–82 — furniture constraint is advisory text only"),
        H3("Fix Location"),
        B("src/services/geminiService.ts — move furniture before text prompt (Tier 1)"),
        B("src/prompts/visualization.constants.ts — add structural identity preservation language (Tier 1)"),
    ])]
    story += [SP(8), HR()]

    # Failure F
    story += [KeepTogether([
        H2("Failure F — Error Handling and Resilience"),
        P("<b>Symptom:</b> Upload failures return generic 500; generation failures are silent; "
          "no retry; no fallback; no output quality gate."),
        H3("Technical Cause 1 — No Timeout"),
        Code("// src/services/geminiService.ts\nconst response = await ai.models.generateContent({ ... });\n// No timeout wrapper — a hung call hangs the request indefinitely"),
        H3("Technical Cause 2 — Generic 500 Catch"),
        Code("// src/controllers/main.ts\nconsole.log(error)  // debug artifact still in production\n...\nreturn reply.status(500).send({\n    error: 'Internal Server Error',\n    message: 'Ocurrido un error al procesar la solicitud',\n});"),
        P("The actual Gemini error (content blocked, rate limit, model error) is logged only. "
          "The debug console.log() before the ValidationError check is a leftover artifact."),
        H3("Technical Cause 3 — No Output Validation"),
        Code("if (firstPart && firstPart.inlineData && firstPart.inlineData.data) {\n"
             "    return firstPart.inlineData.data;  // no quality check\n"
             "} else {\n    throw new Error('No image was generated...');\n}"),
        P("Bad outputs — wrong geometry, broken windows, deformed furniture — are returned to "
          "the user identically to good outputs. There is no quality threshold."),
        H3("Additional Missing Mechanisms"),
        B("No retry logic — one Gemini failure fails the whole request"),
        B("No multiple candidate generation — single shot with no safety net"),
        B("No content validation on uploads — a valid JPEG of a dog passes all checks"),
        H3("Fix Location"),
        B("src/services/geminiService.ts — add Promise.race() timeout + retry (Tier 1)"),
        B("src/controllers/main.ts — remove console.log, surface error type to client (Tier 1)"),
        B("src/services/geminiService.ts — add basic output validation (Tier 2)"),
    ])]
    story += [PageBreak()]

    # ── D. Style System Assessment ─────────────────────────────────────────────
    story += [H1("D. Style System Assessment"), HR()]
    story += [warning_box(
        "<b>Current state:</b> Style is a name string. The style reference image URL is dead code. "
        "All styles are treated identically in the pipeline. There is no tier system, no risk profile, "
        "no style-specific constraint, no intensity control, and no demo-safe curation."), SP(8)]

    story += [H2("The Dead Code Finding — stylePreset.imageUrl")]
    story += [Code(
        "// stylePreset.imageUrl is validated in schema...\n"
        "export const stylePresetSchema = z.object({\n"
        "    name: z.string().min(1, ...),\n"
        "    imageUrl: z.string().url(...),  // ← validated\n"
        "});\n\n"
        "// ...but only name survives to the generation service\n"
        "const fullPrompt = buildVisualizationPrompt({\n"
        "    stylePresetName: stylePreset.name,  // only name used\n"
        "    // imageUrl never referenced again\n"
        "});"
    ), SP(8)]

    story += [H2("What Is Missing")]
    missing = [
        "Style tier (conservative / moderate / aggressive / experimental)",
        "Style risk flag",
        "Style-specific constraint overrides",
        "Demo-safe style curation",
        "Production vs experimental mode gate",
        "Style intensity knob separate from moodboard influence",
        "Style reference image sent to generation model",
    ]
    for m in missing:
        story += [B(m)]

    story += [SP(8), H2("Where to Introduce Style Tiering")]
    story += [P("A new <b>src/config/styles.config.ts</b> should define:")]
    story += [Code(
        "type StyleTier = 'conservative' | 'moderate' | 'aggressive' | 'experimental';\n\n"
        "interface StyleConfig {\n"
        "    name: string;\n"
        "    tier: StyleTier;\n"
        "    additionalConstraints: string[];\n"
        "    maxStyleInfluence: number;  // cap slider at model level\n"
        "    demoSafe: boolean;\n"
        "}"
    ), SP(8)]
    story += [P("buildVisualizationPrompt() should accept a StyleConfig and inject "
               "tier-specific constraint blocks into the prompt. Conservative styles get no "
               "extra constraints. Aggressive styles get reinforced spatial lock and window "
               "integrity language."), PageBreak()]

    # ── E. Multi-Input Blending ────────────────────────────────────────────────
    story += [H1("E. Multi-Input Blending Assessment"), HR()]

    blend_rows = [
        [make_cell("Input"), make_cell("How Blended"), make_cell("Real Weight Control"), make_cell("Problem")],
        [make_cell("Room image"), make_cell("First in parts array"), make_cell("Implicit (positional)"), make_cell("Adequate")],
        [make_cell("Style preset name"), make_cell("Text string in prompt"), make_cell("None"), make_cell("Only soft text")],
        [make_cell("Style preset imageUrl"), make_cell("NEVER SENT"), make_cell("N/A"), make_cell("Dead code — biggest missed opportunity")],
        [make_cell("Moodboard images"), make_cell("Pushed after text prompt"), make_cell("3 discrete text states"), make_cell("Ordering hurts influence; 3 states ≠ continuous")],
        [make_cell("Furniture image"), make_cell("Last in parts array"), make_cell("None"), make_cell("Positional de-emphasis")],
        [make_cell("textPrompt"), make_cell("Embedded in template"), make_cell("None"), make_cell("Competes with style/moodboard")],
        [make_cell("previousResultImage"), make_cell("Second in array (refinement)"), make_cell("None"), make_cell("Adequate position")],
    ]
    tbl = Table(blend_rows, colWidths=[1.4*inch, 1.5*inch, 1.5*inch, 2.1*inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), BRAND_DARK),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GREY_LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#D1D5DB")),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TEXTCOLOR", (1,3), (3,3), RED_DARK),
    ]))
    story += [tbl, SP(10)]

    story += [H2("Correct Parts Ordering")]
    story += [note_box(
        "<b>Current (broken) order:</b> [room image] → [previousResult?] → [text prompt] → [moodboard images] → [furniture image]<br/><br/>"
        "<b>Recommended order:</b> [room image] → [style reference image] → [moodboard images] → [furniture image] → [text prompt]"
    ), SP(8)]

    story += [P("There is no conflict resolution logic in the system. No rule such as 'if furniture "
               "image is present, cap style transformation intensity.' No protection against style "
               "overriding furniture identity. No priority hierarchy between inputs."), PageBreak()]

    # ── F. Validation / Fallback ──────────────────────────────────────────────
    story += [H1("F. Validation / Fallback / Recovery Assessment"), HR()]
    story += [warning_box(
        "The system has none of the following: multiple candidate generation, spatial consistency "
        "check, window preservation check, furniture presence check, quality scoring, retry with "
        "adjusted parameters, fallback prompt, bad-output suppression, generation timeout, or "
        "meaningful client-facing error detail. Every generation is a single shot with no safety net."
    ), SP(8)]

    story += [H2("Consequence")]
    story += [P("A bad generation — wrong geometry, broken windows, deformed furniture — "
               "is returned to the user identically to a good one. A Gemini content block "
               "returns a 500 with no explanation. A hung Gemini call hangs the HTTP connection "
               "until Fastify's connection timeout fires. The user receives no actionable feedback."), PageBreak()]

    # ── G. Recommended Fixes ──────────────────────────────────────────────────
    story += [H1("G. Recommended Fixes by Priority Tier"), HR()]

    story += [H2("Tier 1 — 1–2 Sprints, Highest Impact")]

    tier1 = [
        ("T1-1: Fix parts ordering in geminiService.ts",
         "Move moodboard images and furniture image before the text prompt. This alone will "
         "improve moodboard influence measurably and reduce furniture de-emphasis.",
         "src/services/geminiService.ts — reorder the parts.push() calls"),
        ("T1-2: Fetch and use stylePreset.imageUrl as a reference image",
         "The style preset has a reference image URL that is validated but never used. "
         "Fetching it and including it in the parts array before the text prompt gives the model "
         "a visual reference for the style — far more powerful than the name string alone. "
         "This is the single highest-leverage fix in the codebase.",
         "src/services/geminiService.ts — add fetch(stylePreset.imageUrl) → buffer → insert before text"),
        ("T1-3: Strengthen window constraint",
         'Change from "maintain count" to: "Windows MUST remain in their exact original position, '
         'shape, and size. The view through each window must be completely preserved. Do NOT '
         'obstruct windows with furniture or decor."',
         "src/prompts/visualization.constants.ts — both prompt templates"),
        ("T1-4: Add timeout and retry logic",
         "Wrap generateContent() in Promise.race() with a 30-second timeout. Add retry "
         "up to 2 attempts with exponential backoff on failure.",
         "src/services/geminiService.ts"),
        ("T1-5: Surface meaningful error messages",
         "Catch Gemini error types (content block vs rate limit vs model error) and return "
         "distinct client-facing error codes. Remove the debug console.log(error) artifact.",
         "src/controllers/main.ts"),
        ("T1-6: Introduce style tier config and inject tier-specific constraints",
         "Create src/config/styles.config.ts classifying styles as conservative / moderate / "
         "aggressive. For aggressive styles inject an extra constraint block reinforcing spatial "
         "preservation and window integrity. Fastest path to making style behavior unequal.",
         "New src/config/styles.config.ts, src/prompts/visualization.prompt.ts"),
        ("T1-7: Strengthen furniture identity prompt",
         "Add instruction that the furniture's structural form must not be redesigned to match "
         "the room style — only placement and lighting should adapt.",
         "src/prompts/visualization.constants.ts — INSTRUCTION_INTEGRATE_FURNITURE"),
    ]

    for title, desc, loc in tier1:
        story += [KeepTogether([
            Paragraph(f"<b>{title}</b>",
                ParagraphStyle("t1t", fontSize=10, fontName="Helvetica-Bold",
                    textColor=BRAND_BLUE, spaceBefore=8, spaceAfter=2)),
            P(desc),
            Paragraph(f"<i>File: {loc}</i>",
                ParagraphStyle("loc", fontSize=9, fontName="Helvetica-Oblique",
                    textColor=GREY_MID, spaceAfter=4)),
        ])]
    story += [SP(8)]

    story += [H2("Tier 2 — Moderate Refactoring")]
    tier2 = [
        ("T2-1: True continuous moodboard weighting",
         "Replace 3 discrete text strings with language that communicates the actual slider value. "
         'E.g., "The moodboard images should account for approximately {styleInfluence}% of the '
         'stylistic direction." More expressive than the current ternary.',
         "src/prompts/visualization.prompt.ts — buildInfluencePrompt()"),
        ("T2-2: Style-specific constraint injection system",
         "Extend style config to carry per-style constraint blocks injected into both prompt "
         "templates. Conservative styles: no extra constraints. Aggressive styles: reinforced "
         "spatial lock and window integrity language.",
         "src/config/styles.config.ts, src/prompts/visualization.prompt.ts"),
        ("T2-3: Basic output validation",
         "After receiving the generated base64 image, decode it and check: (a) is it a valid image? "
         "(b) do dimensions approximately match the input? If not, retry once before returning an error.",
         "src/services/geminiService.ts"),
        ("T2-4: Upload content validation",
         "After MIME check, run a basic image decode to confirm the file is a real image with valid "
         "dimensions. Reject images below minimum resolution.",
         "src/utils/validation.utils.ts"),
        ("T2-5: Structured design spec (replace template string substitution)",
         "Replace the {{VARIABLE}} string-substitution system with buildDesignSpec() returning a "
         "structured object, then buildPrompt(spec) serializing it. Makes prompt logic testable "
         "and extensible without string manipulation.",
         "src/prompts/visualization.prompt.ts — full refactor"),
    ]
    for title, desc, loc in tier2:
        story += [KeepTogether([
            Paragraph(f"<b>{title}</b>",
                ParagraphStyle("t2t", fontSize=10, fontName="Helvetica-Bold",
                    textColor=colors.HexColor("#7C3AED"), spaceBefore=8, spaceAfter=2)),
            P(desc),
            Paragraph(f"<i>File: {loc}</i>",
                ParagraphStyle("loc2", fontSize=9, fontName="Helvetica-Oblique",
                    textColor=GREY_MID, spaceAfter=4)),
        ])]
    story += [SP(8), PageBreak()]

    story += [H2("Tier 3 — Target State Architecture")]
    tier3 = [
        ("T3-1: Window masking / segmentation pass",
         "Before sending to Gemini: run segmentation (Cloud Vision, SAM, or dedicated preprocessing) "
         "to identify window regions. Pass window mask as separate control image or inpainting mask. "
         "This is the only way to guarantee window content preservation — text instructions cannot."),
        ("T3-2: Structural anchor conditioning",
         "Detect walls, floor, ceiling, and structural edges using depth or edge detection. "
         "Use as control signals to guide generation within structural constraints. "
         "Requires a preprocessing service."),
        ("T3-3: Multiple candidate generation + reranking",
         "Generate 2–3 candidates per request. Score each for: (a) spatial consistency, "
         "(b) window preservation, (c) furniture presence. Return highest-scoring candidate. "
         "Reranking can be done with a secondary Gemini vision call."),
        ("T3-4: Production vs experimental mode gate",
         "Runtime flag VISUALIZATION_MODE=production|experimental. In production mode, only "
         "conservative and moderate tier styles are enabled. Aggressive styles require "
         "experimental mode. Gives product team control over what reaches demos and customers."),
        ("T3-5: Structured constraint compiler",
         "Replace entire prompt-building system with a constraint hierarchy: spatial > window > "
         "furniture > style > user request. Compiler enforces lower-priority constraints cannot "
         "override higher-priority ones. Style intensity for aggressive styles is automatically "
         "capped when spatial constraints are active."),
    ]
    for title, desc in tier3:
        story += [KeepTogether([
            Paragraph(f"<b>{title}</b>",
                ParagraphStyle("t3t", fontSize=10, fontName="Helvetica-Bold",
                    textColor=GREEN_DARK, spaceBefore=8, spaceAfter=2)),
            P(desc),
        ])]
    story += [PageBreak()]

    # ── H. Target Architecture ────────────────────────────────────────────────
    story += [H1("H. Target-State Architecture"), HR()]
    story += [Code(
"""POST /generate-visualization
        │
        ▼
Input Validation Layer
  • MIME type + content validation
  • Room image dimension check
  • Style tier lookup → demoSafe flag
        │
        ▼
Preprocessing Layer  (NEW)
  • Fetch stylePreset.imageUrl → style reference image
  • (Future) Window segmentation mask
  • (Future) Structural edge map
        │
        ▼
Constraint Compiler  (NEW)
  • Priority: spatial > window > furniture > style > user request
  • Style tier → inject tier-specific constraint block
  • Style influence → continuous language (not 3 states)
  • Production mode → cap aggressive styles
        │
        ▼
Multimodal Request Assembly
  • [room image] → [style ref image] → [moodboard images] → [furniture image] → [compiled prompt]
        │
        ▼
Generation Service  (timeout + retry)
  • N candidates (2–3 in target state)
  • Timeout: 30s per attempt, max 2 retries
        │
        ▼
Output Validation Layer  (NEW)
  • Dimension check
  • Basic spatial consistency check
  • Reranking if multiple candidates
        │
        ▼
Response
  • Best-scored image
  • Metadata: style tier, constraint flags applied
  • Meaningful error codes on failure"""
    ), PageBreak()]

    # ── I. Open Questions ─────────────────────────────────────────────────────
    story += [H1("I. Open Questions / Unverified Areas"), HR()]
    questions = [
        ("gemini-2.5-flash-image model capabilities",
         "The model ID used is not a standard publicly documented Gemini model name. "
         "Confirm this is the correct model string and whether it supports any form of image "
         "conditioning, masks, or reference image weighting not yet explored."),
        ("stylePreset.imageUrl asset ownership",
         "If these are hosted images, fetching them server-side at generation time needs CORS, "
         "latency, and caching consideration. Origin and caching strategy need to be defined."),
        ("Frontend style catalog",
         "The frontend (reformai_vis_react) likely has a known list of style names. The StyleConfig "
         "tier definitions should originate there — needs cross-repo coordination."),
        ("prompt.backup.txt",
         "This file is identical to visualization.constants.ts and appears to be a stale checkpoint. "
         "It should be deleted or versioned properly — having it in-repo as a stale reference "
         "is a maintenance liability."),
        ("Vertex AI vs public Gemini API",
         "The Cloud Run deployment context suggests GCP. Vertex AI alternatives may offer better "
         "SLAs, additional model control parameters, or image conditioning features not available "
         "via the public API."),
        ("Test coverage",
         'package.json scripts: "test": "echo \\"Error: no test specified\\" && exit 1". '
         "The entire pipeline — prompt building, influence weighting, parts assembly — is untested. "
         "Any Tier 1 fix should be accompanied by unit tests for buildInfluencePrompt(), "
         "buildVisualizationPrompt(), and buildFurniturePrompt()."),
    ]
    for q, detail in questions:
        story += [KeepTogether([
            Paragraph(f"<b>{q}</b>",
                ParagraphStyle("qq", fontSize=10, fontName="Helvetica-Bold",
                    textColor=BRAND_DARK, spaceBefore=8, spaceAfter=2)),
            P(detail),
        ])]

    story += [SP(16), HR()]
    story += [Paragraph(
        "Generated by Claude Code (Anthropic) · 2026-04-22 · reform-ai-image-visualization-service",
        ParagraphStyle("footer", fontSize=8, textColor=GREY_MID,
            fontName="Helvetica", alignment=TA_CENTER)
    )]

    doc.build(story)
    print(f"PDF written to: {OUTPUT_PATH}")

build()
