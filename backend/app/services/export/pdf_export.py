import io
import logging
from typing import List, Dict, Any
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

logger = logging.getLogger(__name__)

PAGE_W, PAGE_H = landscape(letter)


def build_pdf(
    title: str,
    slides_data: List[Dict[str, Any]],
    theme: Dict[str, str]
) -> bytes:
    """Build a PDF document from structured slide data."""
    output = io.BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=landscape(letter),
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    primary = theme.get("primary", "#0077B6")
    text_color = theme.get("text", "#03045E")
    muted = theme.get("muted", "#64748B")

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "SlideTitle", parent=styles["Title"],
        fontSize=28, leading=34, textColor=HexColor(primary),
        spaceAfter=12, alignment=TA_LEFT,
    )
    subtitle_style = ParagraphStyle(
        "SlideSubtitle", parent=styles["Normal"],
        fontSize=14, leading=18, textColor=HexColor(muted),
        spaceAfter=16,
    )
    bullet_style = ParagraphStyle(
        "SlideBullet", parent=styles["Normal"],
        fontSize=13, leading=20, textColor=HexColor(text_color),
        leftIndent=20, spaceAfter=6, bulletIndent=8,
    )
    notes_style = ParagraphStyle(
        "SpeakerNotes", parent=styles["Normal"],
        fontSize=9, leading=12, textColor=HexColor(muted),
        spaceBefore=20, leftIndent=10,
    )

    story = []

    for idx, slide_data in enumerate(slides_data):
        # Slide number header
        story.append(Paragraph(
            f'<font color="{muted}" size="9">SLIDE {idx + 1} / {len(slides_data)}  •  {slide_data.get("layout", "bullets").upper()}</font>',
            ParagraphStyle("SlideNum", parent=styles["Normal"], fontSize=9, textColor=HexColor(muted), spaceAfter=4)
        ))

        # Title
        story.append(Paragraph(slide_data.get("title", ""), title_style))

        # Subtitle
        if slide_data.get("subtitle"):
            story.append(Paragraph(slide_data["subtitle"], subtitle_style))

        # Body / Bullets
        bullets = slide_data.get("bullets", [])
        if not bullets and slide_data.get("body"):
            bullets = [b.strip() for b in slide_data["body"].split("\n") if b.strip()]

        for bullet in bullets[:8]:
            story.append(Paragraph(f"•  {bullet}", bullet_style))

        # Metrics
        metrics = slide_data.get("metrics", [])
        if metrics:
            metric_text = "   |   ".join([f'<b>{m.get("value","")}</b> {m.get("label","")}' for m in metrics])
            story.append(Spacer(1, 10))
            story.append(Paragraph(metric_text, ParagraphStyle(
                "Metrics", parent=styles["Normal"], fontSize=16,
                textColor=HexColor(primary), alignment=TA_CENTER, spaceAfter=10
            )))

        # Two column
        left_col = slide_data.get("left_column", {})
        right_col = slide_data.get("right_column", {})
        if left_col.get("points") or right_col.get("points"):
            story.append(Spacer(1, 8))
            story.append(Paragraph(f'<b>{left_col.get("title","")}</b>', bullet_style))
            for pt in left_col.get("points", [])[:4]:
                story.append(Paragraph(f"  ✓  {pt}", bullet_style))
            story.append(Spacer(1, 6))
            story.append(Paragraph(f'<b>{right_col.get("title","")}</b>', bullet_style))
            for pt in right_col.get("points", [])[:4]:
                story.append(Paragraph(f"  →  {pt}", bullet_style))

        # Quote
        if slide_data.get("quote"):
            story.append(Spacer(1, 10))
            story.append(Paragraph(
                f'<i>"{slide_data["quote"]}"</i>',
                ParagraphStyle("Quote", parent=styles["Normal"], fontSize=16,
                               textColor=HexColor(text_color), alignment=TA_CENTER, spaceAfter=6)
            ))
            if slide_data.get("quote_author"):
                story.append(Paragraph(
                    f'— {slide_data["quote_author"]}',
                    ParagraphStyle("Author", parent=styles["Normal"], fontSize=11,
                                   textColor=HexColor(primary), alignment=TA_CENTER)
                ))

        # Speaker notes
        if slide_data.get("speaker_notes"):
            story.append(Paragraph(f"🎙️ {slide_data['speaker_notes']}", notes_style))

        # Page break between slides
        if idx < len(slides_data) - 1:
            story.append(Spacer(1, 30))
            story.append(Paragraph(
                '<font color="#CCCCCC">————————————————————————————————————————————</font>',
                ParagraphStyle("Divider", parent=styles["Normal"], fontSize=8, alignment=TA_CENTER, spaceAfter=20)
            ))

    doc.build(story)
    output.seek(0)
    return output.read()