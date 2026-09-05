import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def generate_impact_pdf(
    donor_name: str,
    month_str: str,
    total_kg: float,
    meals_served: int,
    co2_offset_kg: float,
    completed_pickups: int
) -> bytes:
    """
    Generates a clean, branded single-page PDF ESG & Impact Certificate in memory.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # ShareMeal Palette
    DARK_SLATE = colors.HexColor("#0F172A")    # slate-900 header/main text
    EMERALD = colors.HexColor("#059669")       # emerald-600 accent
    LIGHT_BG = colors.HexColor("#F8FAFC")      # slate-50 background
    BORDER_COLOR = colors.HexColor("#CBD5E1")  # slate-300 border
    TEXT_MUTED = colors.HexColor("#64748B")    # slate-500 muted text

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    header_sub_style = ParagraphStyle(
        'HeaderSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=EMERALD,
        alignment=TA_CENTER
    )

    cert_for_style = ParagraphStyle(
        'CertFor',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    )

    donor_style = ParagraphStyle(
        'DonorName',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=DARK_SLATE,
        alignment=TA_CENTER
    )

    period_style = ParagraphStyle(
        'ReportingPeriod',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=DARK_SLATE,
        alignment=TA_CENTER
    )

    card_label_style = ParagraphStyle(
        'CardLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    )

    card_value_style = ParagraphStyle(
        'CardValue',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=EMERALD,
        alignment=TA_CENTER
    )

    card_sub_style = ParagraphStyle(
        'CardSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    )

    footer_title_style = ParagraphStyle(
        'FooterTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=DARK_SLATE,
        alignment=TA_CENTER
    )

    footer_style = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    )

    elements = []

    # 1. Dark Slate Header Banner
    header_data = [
        [Paragraph("SHAREMEAL COMMERCIAL FOOD RECOVERY NETWORK", header_sub_style)],
        [Spacer(1, 4)],
        [Paragraph("CERTIFICATE OF FOOD RECOVERY & ESG IMPACT", title_style)]
    ]
    header_table = Table(header_data, colWidths=[540])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), DARK_SLATE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 24))

    # 2. Donor Presentation Box
    elements.append(Paragraph("THIS CERTIFICATE IS PROUDLY PRESENTED TO", cert_for_style))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(donor_name, donor_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Reporting Period: <b>{month_str}</b>", period_style))
    elements.append(Spacer(1, 20))

    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=20, spaceBefore=0))

    # 3. 2x2 Metric Cards Grid
    c1 = [
        Paragraph("TOTAL FOOD DIVERTED", card_label_style),
        Spacer(1, 6),
        Paragraph(f"<b>{total_kg:,.1f} kg</b>", card_value_style),
        Spacer(1, 4),
        Paragraph("Surplus food rescued from waste stream", card_sub_style)
    ]
    c2 = [
        Paragraph("NUTRITIOUS MEALS PROVIDED", card_label_style),
        Spacer(1, 6),
        Paragraph(f"<b>{meals_served:,} meals</b>", card_value_style),
        Spacer(1, 4),
        Paragraph("Calculated at 0.42 kg / meal", card_sub_style)
    ]
    c3 = [
        Paragraph("GHG EMISSIONS PREVENTED", card_label_style),
        Spacer(1, 6),
        Paragraph(f"<b>{co2_offset_kg:,.1f} kg CO<sub>2</sub>e</b>", card_value_style),
        Spacer(1, 4),
        Paragraph("Calculated at 2.5 kg CO<sub>2</sub>e / kg food", card_sub_style)
    ]
    c4 = [
        Paragraph("SUCCESSFUL DISPATCHES", card_label_style),
        Spacer(1, 6),
        Paragraph(f"<b>{completed_pickups} pickups</b>", card_value_style),
        Spacer(1, 4),
        Paragraph("Verified PIN-authenticated pickups", card_sub_style)
    ]

    metrics_table_data = [
        [c1, c2],
        [c3, c4]
    ]

    metrics_table = Table(metrics_table_data, colWidths=[262, 262])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (0, 0), 1, BORDER_COLOR),
        ('BOX', (1, 0), (1, 0), 1, BORDER_COLOR),
        ('BOX', (0, 1), (0, 1), 1, BORDER_COLOR),
        ('BOX', (1, 1), (1, 1), 1, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 14),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))

    elements.append(metrics_table)
    elements.append(Spacer(1, 28))

    elements.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=20, spaceBefore=0))

    # 4. Official Verification Footer
    gen_time = datetime.utcnow().strftime("%B %d, %Y %H:%M UTC")
    footer_p1 = Paragraph("OFFICIAL ESG IMPACT VERIFICATION", footer_title_style)
    footer_p2 = Paragraph(f"Issued by ShareMeal Commercial Food Recovery Network &bull; Generated on {gen_time}", footer_style)
    footer_p3 = Paragraph("This document verifies compliance with commercial food recovery and ESG environmental impact reporting standard guidelines.", card_sub_style)

    footer_table = Table([[footer_p1], [Spacer(1, 4)], [footer_p2], [Spacer(1, 3)], [footer_p3]], colWidths=[540])
    footer_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(footer_table)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
