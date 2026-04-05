#!/usr/bin/env python3
"""Generate Athletic Development Skills Guide v2.docx with FITS ADS registry-aligned mappings."""

import re
import shutil
from collections import defaultdict
from copy import deepcopy
from pathlib import Path
from typing import List, Optional

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Pt

# Original Word file supplies fonts, Heading 1/2/3, Normal, and table styles.
TEMPLATE_DOCX = Path("/Users/thomaslam/Downloads/Athletic Development Skills Guide.docx")

# 0.00.DB — authoritative file list (reading pathway is generated only from this).
REGISTRY_HTML_CANDIDATES = [
    Path(
        "/Users/thomaslam/Library/CloudStorage/OneDrive-Personal/18.ISDS/"
        "1.4 GUIDES/ADS GUIDES/FITS ADS/0.00.DB FITS ADS File Registry.html"
    ),
]

PROCESS_ORDER = ("0", "1", "2", "3", "4", "5", "6", "7", "8", "ST")
PROCESS_HEADINGS = {
    "0": "ISPS Process 0 — System",
    "1": "ISPS Process 1 — Define",
    "2": "ISPS Process 2 — Specialize",
    "3": "ISPS Process 3 — Measure",
    "4": "ISPS Process 4 — Show",
    "5": "ISPS Process 5 — Develop",
    "6": "ISPS Process 6 — Test",
    "7": "ISPS Process 7 — Mind Wellness",
    "8": "ISPS Process 8 — Sports Medicine",
    "ST": "ST — Special Topics",
}


def unicode_unescape(s: str) -> str:
    return re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), s)


def parse_fits_ads_registry(html_path: Path) -> List[dict]:
    """Parse one-line-per-entry `files=[...]` objects from 0.00.DB HTML."""
    if not html_path.is_file():
        return []
    text = html_path.read_text(encoding="utf-8")
    entries: List[dict] = []
    seen: set[tuple[str, str, str]] = set()
    for line in text.splitlines():
        if "{ id:" not in line or "title:" not in line or "ext:" not in line:
            continue
        m_id = re.search(r'id:\s*"((?:[^"\\]|\\.)*)"', line)
        m_title = re.search(r'title:\s*"((?:[^"\\]|\\.)*)"', line)
        m_ext = re.search(r'ext:\s*"([^"]*)"', line)
        m_proc = re.search(r'process:\s*"([^"]*)"', line)
        if not (m_id and m_title and m_ext and m_proc):
            continue
        fid = unicode_unescape(m_id.group(1))
        title = unicode_unescape(m_title.group(1))
        ext = m_ext.group(1)
        proc = m_proc.group(1)
        key = (fid, title, ext)
        if key in seen:
            continue
        seen.add(key)
        entries.append({"id": fid, "title": title, "ext": ext, "process": proc})
    return entries


def registry_sort_key(e: dict) -> tuple:
    """Stable ordering within an ISPS process bucket."""
    return (e["id"].lower().replace("st.jump", "stjump"), e["title"].lower())


def emit_reading_pathway_from_registry(
    document: Document, registry_path: Optional[Path], entries: List[dict]
) -> None:
    add_heading_lvl(document, "ADS READING PATHWAY", 1)
    document.add_paragraph(
        "This pathway includes only assets indexed in 0.00.DB FITS ADS File Registry.html. "
        "It is generated from that registry when you run the build script; add files to FITS ADS, update the "
        "registry, and rebuild to refresh the list. Materials not yet in the registry (for example some folder-only "
        "PDFs) are intentionally omitted until they are registered."
    )
    if not registry_path or not registry_path.is_file() or not entries:
        document.add_paragraph(
            "Registry not found or could not be parsed. Expected file: 0.00.DB FITS ADS File Registry.html "
            "inside the FITS ADS folder. Copy or sync OneDrive, then re-run the build."
        )
        return
    document.add_paragraph(f"Source: {registry_path.name} — {len(entries)} registered entries.")
    by_proc = defaultdict(list)
    for e in entries:
        by_proc[e["process"]].append(e)
    for proc in PROCESS_ORDER:
        bucket = by_proc.get(proc)
        if not bucket:
            continue
        add_heading_lvl(document, PROCESS_HEADINGS.get(proc, proc), 2)
        for e in sorted(bucket, key=registry_sort_key):
            line = f'{e["id"]} {e["title"]}{e["ext"]}'
            document.add_paragraph(f"▸  {line}")
        document.add_paragraph()


def clear_document_body(document: Document) -> None:
    body = document.element.body
    for child in list(body):
        if child.tag != qn("w:sectPr"):
            body.remove(child)


def add_centered_title_line(document: Document, text: str, *, bold=True, italic=False, font_pt=11) -> None:
    """Match original cover: Arial, centered, spacing after ~10 pt."""
    p = document.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(10)
    run = p.add_run(text)
    run.font.name = "Arial"
    run.font.size = Pt(font_pt)
    if bold is not None:
        run.bold = bold
    run.italic = italic


def add_title_page(document: Document) -> None:
    document.add_paragraph()
    add_centered_title_line(document, "FITS ATHLETIC DEVELOPMENT SPECIALIST", bold=True, font_pt=18)
    add_centered_title_line(document, "SKILLS, COMPETENCIES & READING PATHWAY", bold=True, font_pt=16)
    add_centered_title_line(document, "A Development Guide for the FITS SPD Team", bold=None, font_pt=11)
    add_centered_title_line(document, "FITS Athletic Development System", bold=None, font_pt=11)
    add_centered_title_line(document, "Version 2.1  |  2026  |  FITS ADS registry–aligned", bold=None, font_pt=10)
    add_centered_title_line(document, "From the Foundation to Their Mind", bold=None, italic=True, font_pt=10)
    document.add_paragraph()


def add_reading_lines(document: Document, items: list) -> None:
    """Match original: 'Reading:' then one paragraph per ▸ line (Normal style)."""
    document.add_paragraph("Reading:")
    for line in items:
        document.add_paragraph(f"▸  {line}")


def paragraph_style_first(document: Document, style_name: str):
    """Resolve style by name; required when the .docx has duplicate style name entries."""
    for s in document.styles:
        if s.name == style_name and s.type == WD_STYLE_TYPE.PARAGRAPH:
            return s
    raise KeyError(f"No paragraph style {style_name!r}")


def add_heading_lvl(document: Document, text: str, level: int):
    """Heading 1–3; avoids Document.add_heading() when styles.xml has duplicate style names."""
    st = paragraph_style_first(document, f"Heading {level}")
    p = document.add_paragraph(text)
    p.style = st
    return p


def match_table_properties_to_template(table) -> None:
    """Copy tblPr (width, borders) from the first table in the template — no named table style in file."""
    ref = Document(str(TEMPLATE_DOCX))
    if not ref.tables or ref.tables[0]._tbl.tblPr is None:
        return
    tbl = table._tbl
    pr = deepcopy(ref.tables[0]._tbl.tblPr)
    old = tbl.tblPr
    if old is not None:
        tbl.remove(old)
    tbl.insert(0, pr)


def main():
    if not TEMPLATE_DOCX.is_file():
        raise FileNotFoundError(f"Template not found: {TEMPLATE_DOCX}")
    doc = Document(str(TEMPLATE_DOCX))
    clear_document_body(doc)

    add_title_page(doc)

    add_heading_lvl(doc, "DOCUMENT HUB", 1)
    doc.add_paragraph(
        "Authoritative library: OneDrive → 18.ISDS → 1.4 GUIDES → ADS GUIDES → FITS ADS. "
        "Search and filter all assets via 0.00.DB FITS ADS File Registry.html (ISPS ID, title, path)."
    )
    doc.add_paragraph()

    add_heading_lvl(doc, "PURPOSE", 1)
    doc.add_paragraph(
        "This document defines skills, competencies, and knowledge requirements for Athletic Development "
        "Specialists (ADS) operating within the FITS Integrated Sport Performance System. It serves three functions:"
    )
    doc.add_paragraph(
        "1. Skills Inventory — Nine domains; sub-skills blend knowledge (what you must understand) and "
        "application (what you must do on the training floor). Each sub-skill is tagged with the primary "
        "result(s) it serves (R1–R5)."
    )
    doc.add_paragraph(
        "2. Reading Pathway — A single list generated only from 0.00.DB FITS ADS File Registry.html (ISPS process "
        "buckets and registered file IDs). As you add assets under FITS ADS and refresh the registry, rebuild this "
        "guide to update the pathway; folder-only files stay out until they are registered."
    )
    doc.add_paragraph(
        "3. Development Tracker — Application benchmarks can be observed, assessed, and signed off by a Sport Director."
    )
    doc.add_paragraph(
        "The nine domains use sequential numbers 1–9 in the recommended development order: system and assessment "
        "(1–2); programming, coaching, and program delivery / QA (3–5); exercise construction (6); sport-specific work "
        "(7); readiness and injury prevention (8); and professional contribution (9). Domain numbers match this sequence "
        "throughout the guide."
    )
    doc.add_paragraph()

    add_heading_lvl(doc, "FIVE RESULTS (PURPOSES)", 1)
    doc.add_paragraph(
        "ADS work advances the integrated sport performance system from an athleticism perspective by developing:"
    )
    results = [
        "R1 — Athletic literacy",
        "R2 — Game speed intelligence",
        "R3 — Injury resilience and durability",
        "R4 — Athletic self-knowledge and championship mindset",
        "R5 — Championship habits",
    ]
    for r in results:
        doc.add_paragraph(r)
    doc.add_paragraph()

    tbl = doc.add_table(rows=6, cols=3)
    match_table_properties_to_template(tbl)
    hdr = tbl.rows[0].cells
    hdr[0].text = "Result"
    hdr[1].text = "Primary domains"
    hdr[2].text = "Emphasis"
    rows_data = [
        ("R1 Athletic literacy", "1, 2, 6", "ISPS language, scoring, nomenclature, demand literacy"),
        ("R2 Game speed intelligence", "1, 2, 3, 7", "Demand continuum, sport bridge, programming, sport/jump systems"),
        ("R3 Injury resilience & durability", "2, 3, 8", "CMD, Solution Matrix, progression, readiness, escalation"),
        ("R4 Self-knowledge & mindset", "4, 8", "Feedback loop, teaching language, mind wellness"),
        ("R5 Championship habits", "4, 5, 9", "Consistency, QA, compliance, contribution"),
    ]
    for i, (a, b, c) in enumerate(rows_data, start=1):
        row = tbl.rows[i].cells
        row[0].text = a
        row[1].text = b
        row[2].text = c
    doc.add_paragraph()

    add_heading_lvl(doc, "SKILL DOMAIN OVERVIEW", 1)
    doc.add_paragraph()
    doc.add_paragraph()
    t2 = doc.add_table(rows=10, cols=4)
    match_table_properties_to_template(t2)
    t2.rows[0].cells[0].text = "#"
    t2.rows[0].cells[1].text = "DOMAIN"
    t2.rows[0].cells[2].text = "SUB-SKILLS"
    t2.rows[0].cells[3].text = "TYPE BLEND"
    # Rows follow recommended development order; # column = domain 1–9
    overview = [
        ("1", "FITS System Knowledge & Philosophy", "6", "6K"),
        ("2", "Assessment, Profiling & Observation", "8", "8A"),
        ("3", "Programming & Session Design", "6", "4A / 2K+A"),
        ("4", "Coaching, Cueing & Feedback", "5", "1K / 3A / 1K+A"),
        ("5", "Program Delivery Management & QA", "5", "5A"),
        ("6", "Exercise Science & Construction", "5", "1K / 2A / 2K+A"),
        ("7", "Sport-Specific Application (Flight School / Jump)", "4", "1K / 3A"),
        ("8", "Training Readiness, Wellness & Injury Prevention", "4", "1K / 2A / 1K+A"),
        ("9", "Professional Development & Team Contribution", "5", "2K / 3A"),
    ]
    for i, (num, name, subs, blend) in enumerate(overview, start=1):
        t2.rows[i].cells[0].text = num
        t2.rows[i].cells[1].text = name
        t2.rows[i].cells[2].text = subs
        t2.rows[i].cells[3].text = blend
    doc.add_paragraph()
    doc.add_paragraph(
        "Total Sub-Skills: 48  |  K = Knowledge  |  A = Application  |  K+A = Knowledge + Application"
    )

    # --- DOMAIN 1 ---
    add_heading_lvl(doc, "DOMAIN 1: FITS SYSTEM KNOWLEDGE & PHILOSOPHY", 1)
    doc.add_paragraph(
        "Foundational vision, values, architecture, and governing principles. Primary results: R1, R2, R3, R4."
    )

    blocks = [
        (
            "1.1  Vision, Mission & Values Alignment",
            "Knowledge",
            "R1, R4",
            "Internalize FITS vision, mission, the five results, beliefs, and values. Understand why the system exists.",
            [
                "1. FITS VISION and Roles and Responsibilities Chart.pdf (18.ISDS)",
                "0.01 ISPS Guide.docx",
                "0.02 FITS Lenses.docx (optional)",
            ],
            "Articulate the FITS mission and five results to athletes and parents during onboarding. Align daily coaching to stated values.",
        ),
        (
            "1.2  Movement System Architecture (5 Layers)",
            "Knowledge",
            "R1, R2",
            "Five-layer hierarchy: L1 Hardware (Range, Core Support, Engine, Energy); L2 Coordination Functions; "
            "L3 Movement Skills; L4 Motor Programs; L5 Decision Making & Game Speed.",
            [
                "1.00.VIS FITS Movement System Visual.html",
                "1.00B.VIS Unified Architecture Guide.html",
                "X2 - IMPLEMENTATION/SKILL.md (Integrated Delivery System + pillars)",
            ],
            "Explain which layer an athlete limitation occupies and why that sets the intervention pathway.",
        ),
        (
            "1.3  Rule-Based Architecture (3 Tiers)",
            "Knowledge",
            "R1, R3",
            "Tier 1 Governing Laws, Tier 2 System Principles, Tier 3 Operating Logic; decisions trace upward.",
            ["0.05 Rule-Based Architecture.docx"],
            "For a programming or coaching decision, name the governing law and system principle that justify it.",
        ),
        (
            "1.4  Demand Continuum (4+3 Architecture)",
            "Knowledge",
            "R2, R3",
            "Exercise-level scoring (ML, MC, VED, CPL), session modifiers, environment modifier; demands stack.",
            [
                "2.02 Demand Continuum.docx",
                "2.02B Demand Continuum Scoring Tool.xlsx",
                "2.02.VIS Demand Continuum Visual Guide.html (optional)",
            ],
            "Score 10 exercises across demand dimensions; tag primary and secondary Movement System components.",
        ),
        (
            "1.5  Performance Level Gating & Diagnostic Matrix",
            "Knowledge",
            "R2, R3",
            "Performance levels, MOQ × PL scoring, quadrants (Target Profile, Hidden Risk, Engine Gap, Foundation Gap).",
            [
                "2.02 Demand Continuum.docx",
                "2.03 Demand Dimensions – Objectives and Sport Constraints.docx",
                "1.CMD.03 The Solution Matrix.docx",
            ],
            "Given scores, place components in quadrants and state training implications.",
        ),
        (
            "1.6  FITS Reference Lists & Terminology",
            "Knowledge",
            "R1",
            "Fluency with component names, CFs, scoring terms, ISPS document numbering.",
            ["0.03 FITS Reference Lists.xlsx", "0.04 FITS Glossary.md (if present)"],
            "Use correct FITS terminology in program notes, reports, and team communications.",
        ),
    ]
    for title, stype, tags, desc, reads, bench in blocks:
        add_heading_lvl(doc, title, 3)
        doc.add_paragraph(f"Type: {stype}  |  Primary results: {tags}")
        doc.add_paragraph(desc)
        add_reading_lines(doc, reads)
        doc.add_paragraph(f"Application Benchmark: {bench}")
        doc.add_paragraph()

    # --- DOMAIN 2 ---
    add_heading_lvl(doc, "DOMAIN 2: ASSESSMENT, PROFILING & OBSERVATION", 1)
    doc.add_paragraph("Observation and measurement using FITS tools. Primary results: R1, R2, R3.")

    d2 = [
        (
            "2.1  Motor Output Quality (MOQ) Scoring",
            "Application",
            "R1, R2",
            "Score MOQ 1–3 on Foundation Movements and Speed Skills.",
            [
                "3.01 Movement System Scoring Guide.docx",
                "6.01 Complete Feedback and Learning Loop.docx",
                "5.03 Exercise Guide.docx",
            ],
            "Live session: score 5 athletes on squat and landing; justify MOQ.",
        ),
        (
            "2.2  CMOQ Observation Lenses (5 Lenses)",
            "Application",
            "R1, R2",
            "Apply CMOQ lenses (shape, tracking, sequencing, COM, flow).",
            ["6.01 Complete Feedback and Learning Loop.docx", "5.03 Exercise Guide.docx"],
            "Lunge observation: one finding per lens; record in session notes.",
        ),
        (
            "2.3  Common Movement Dysfunction (CMD) Identification",
            "Application",
            "R3",
            "Identify CMDs by joint system; severity; manifestation in FM and Speed Skills.",
            ["1.CMD.01 Common Movement Dysfunctions.docx", "1.CMD.02 Signs-Symptoms-Injury Model.docx"],
            "Assessment: CMDs, severity, joint systems, affected CFs documented.",
        ),
        (
            "2.4  Core Support Quality (CSQ) Assessment",
            "Application",
            "R1, R3",
            "Triple C across joint systems; eighteen CSQs.",
            [
                "1.L1.03 Core Stability Qualities Guide.docx",
                "1.L1.03B CSQ Complete Scoring System.xlsx",
                "1.L1.04D PSI Comprehensive Guide.docx",
            ],
            "CSQ assessment for new athlete; scoring sheet; identify limiting system.",
        ),
        (
            "2.5  Range Assessment",
            "Application",
            "R1, R3",
            "Range 1–3 prerequisite scale; gating for coordination work.",
            ["1.L1.02 Range Development Principles.docx", "0.03 FITS Reference Lists.xlsx"],
            "Screen ankle DF, hip, t-spine, shoulder; flag gates to skill work.",
        ),
        (
            "2.6  Engine Profile Assessment",
            "Application",
            "R2, R3",
            "Six engine qualities; CMJ/force plate interpretation as applicable.",
            [
                "1.L1.04 Engine Development.pdf",
                "1.L1.04B Engine Quality Demands Guide.docx",
                "1.L1.04C Olympic Lifting and Power Development Guide.docx",
                "X9 - JUMP METRICS/ (folder) + ST.JUMP.* topic guides as assigned",
            ],
            "Interpret CMJ report; engine-limited vs technique-limited; communicate to team.",
        ),
        (
            "2.7  Speed Skills Assessment",
            "Application",
            "R2",
            "Speed Skills scoring; link to CFs and foundation base.",
            [
                "1.L3.02 Speed Movement Skills Guide.docx",
                "1.L3.02B Speed Skills Scoring System.xlsx",
                "3.02 Volleyball Standards.pdf (or sport-specific standards doc)",
            ],
            "Run speed-skills battery; MOQ and PL; map to profile.",
        ),
        (
            "2.8  Athlete Dashboard & Profile Construction",
            "Application",
            "R1, R2",
            "Consolidate profile across CSQ, foundation, speed, sport speed, engine.",
            ["6.01 Complete Feedback and Learning Loop.docx", "3.01 Movement System Scoring Guide.docx", "2.02 Demand Continuum.docx"],
            "Complete dashboard for new athlete in first block; present to Sport Director.",
        ),
    ]
    for title, stype, tags, desc, reads, bench in d2:
        add_heading_lvl(doc, title, 3)
        doc.add_paragraph(f"Type: {stype}  |  Primary results: {tags}")
        doc.add_paragraph(desc)
        add_reading_lines(doc, reads)
        doc.add_paragraph(f"Application Benchmark: {bench}")
        doc.add_paragraph()

    # --- DOMAIN 3 ---
    add_heading_lvl(doc, "DOMAIN 3: PROGRAMMING & SESSION DESIGN", 1)
    doc.add_paragraph("Profile to individualized programs. Primary results: R2, R3, R5.")

    d4 = [
        (
            "3.1  Programming Prompts (IA through IV)",
            "Knowledge + Application",
            "R2",
            "Apply prompts: CMD resolution, foundation/speed, engine, sport speed, cognitive/skill integration.",
            [
                "5.01 Programming System Guide.docx",
                "5.01.VIS Layered Programming Guide.html",
                "2.02 Demand Continuum.docx",
                "X3 - PROGRAMMING/ (Template System, Layers, Block Options, CMD + Solution Matrix PDFs)",
            ],
            "From a profile, name priority prompt and outline a block.",
        ),
        (
            "3.2  Profile-to-Program Bridge",
            "Application",
            "R2",
            "Match limiting components to exercises; verify demand vs level; modifiers; monitoring.",
            ["2.02 Demand Continuum.docx", "5.03 Exercise Guide.docx", "5.02 Programming Contextual Factors — Guide.docx"],
            "From dashboard, produce 4-week block with profile-justified selections.",
        ),
        (
            "3.3  Session Structure & Complex Design",
            "Application",
            "R2",
            "FDR, FDC, engine, potentiation, flight, bar, speed skill, ESD blocks per FITS architecture.",
            [
                "X3 - PROGRAMMING/ (Foundation Routines, Engine, Templated Day Details, etc.)",
                "1.GOV.01B Additional SC Principles.docx",
            ],
            "Design three sessions in a week with undulating emphasis.",
        ),
        (
            "3.4  Progression & Regression Logic",
            "Application",
            "R2, R3",
            "Return-to-development, PL gating, variation strategies.",
            ["5.04 Exercise Nomenclature and Taxonomy Guide.docx", "0.05 Rule-Based Architecture.docx"],
            "On quality breakdown, regress in-session on correct pathway.",
        ),
        (
            "3.5  CMD Resolution Programming",
            "Application",
            "R3",
            "Solution Matrix and decision tree; sequence interventions.",
            [
                "1.CMD.03 The Solution Matrix.docx",
                "1.CMD.04 CMD Resolution Decision Tree.docx",
                "1.CMD.01 Common Movement Dysfunctions.docx",
            ],
            "Moderate knee CMD: resolution pathway integrated into program.",
        ),
        (
            "3.6  Energy System Development Programming",
            "Knowledge + Application",
            "R2",
            "ESD as session variable: work, rest, order, volume.",
            ["1.GOV.01B Additional SC Principles.docx", "2.02 Demand Continuum.docx"],
            "ESD block for glycolytic emphasis using existing exercise menu.",
        ),
    ]
    for title, stype, tags, desc, reads, bench in d4:
        add_heading_lvl(doc, title, 3)
        doc.add_paragraph(f"Type: {stype}  |  Primary results: {tags}")
        doc.add_paragraph(desc)
        add_reading_lines(doc, reads)
        doc.add_paragraph(f"Application Benchmark: {bench}")
        doc.add_paragraph()

    # --- DOMAIN 4 ---
    add_heading_lvl(doc, "DOMAIN 4: COACHING, CUEING & FEEDBACK", 1)
    doc.add_paragraph("Training-floor delivery. Primary results: R1, R4, R5.")

    d5 = [
        (
            "4.1  The Feedback & Learning Loop",
            "Knowledge + Application",
            "R4, R5",
            "Six-element loop: standards, CMOQ, MOQ, cues, video/metrics, knowledge.",
            ["6.01 Complete Feedback and Learning Loop.docx"],
            "In session, deliver the loop element the athlete most needs; avoid overloading.",
        ),
        (
            "4.2  Cueing for Coordination Function Expression",
            "Application",
            "R2, R4",
            "External-focus cues biasing CF solutions.",
            ["1.L4.01 Motor Control Principles Guide.docx", "6.01 Complete Feedback and Learning Loop.docx"],
            "Per CF: 3–5 cues; know when to deploy.",
        ),
        (
            "4.3  Motor Control & Motor Learning Principles",
            "Knowledge",
            "R4",
            "Triple C, variability, contextual interference, feedback bandwidth, self-organization.",
            ["1.L4.01 Motor Control Principles Guide.docx", "1.L4.02 Additional Principles of MCAML.docx"],
            "Design constraints-led practice without over-prescription.",
        ),
        (
            "4.4  Video & Technology-Driven Feedback",
            "Application",
            "R4",
            "Video, kinograms, metrics; perception before explanation.",
            ["6.01 Complete Feedback and Learning Loop.docx"],
            "Video review: guide attention through CMOQ; perception leads.",
        ),
        (
            "4.5  Knowledge Delivery & Athlete Education",
            "Application",
            "R4, R1",
            "Teach foundation/engine/speed concepts at appropriate moments; build agency.",
            ["6.01 Complete Feedback and Learning Loop.docx", "6.03 Teaching Language for Coaches.docx", "1.GOV.01B Additional SC Principles.docx"],
            "Each block: 2–3 education moments in athlete-friendly language.",
        ),
    ]
    for title, stype, tags, desc, reads, bench in d5:
        add_heading_lvl(doc, title, 3)
        doc.add_paragraph(f"Type: {stype}  |  Primary results: {tags}")
        doc.add_paragraph(desc)
        add_reading_lines(doc, reads)
        doc.add_paragraph(f"Application Benchmark: {bench}")
        doc.add_paragraph()

    # --- DOMAIN 5 ---
    add_heading_lvl(doc, "DOMAIN 5: PROGRAM DELIVERY MANAGEMENT & QUALITY ASSURANCE", 1)
    doc.add_paragraph("Operations at FITS standard. Primary results: R5.")

    d8 = [
        (
            "5.1  Program Setup & Onboarding",
            "Application",
            "R5",
            "Assessment, profile, plan, accounts, scheduling per protocol.",
            ["Onboarding Protocol (Internal)", "2.02 Demand Continuum.docx"],
            "Onboard new athlete through first session; documentation complete.",
        ),
        (
            "5.2  Weekly Quality Assurance Checklist (WQACL)",
            "Application",
            "R5",
            "QA: accuracy, exercise vs profile, progression, observations.",
            ["QA Management Protocol (Internal)"],
            "Complete WQACL; Sport Director review.",
        ),
        (
            "5.3  Program Memos & Adjustment Notes",
            "Application",
            "R5",
            "FITS-language memos; component, demand, rationale.",
            ["5.03 Exercise Guide.docx", "2.02 Demand Continuum.docx"],
            "Each adjustment: memo with MS component, demand change, rationale.",
        ),
        (
            "5.4  Compliance Reporting & Athlete Experience",
            "Application",
            "R5",
            "Attendance, engagement, at-risk follow-up.",
            ["Athlete Experience Protocol (Internal)"],
            "Monthly compliance report; flag threshold athletes.",
        ),
        (
            "5.5  Facility & Technology Management",
            "Application",
            "R5",
            "Floor, equipment, force plates, video; report issues.",
            ["Facility Maintenance Protocol (Internal)"],
            "Pre-session check; technology functional.",
        ),
    ]
    for title, stype, tags, desc, reads, bench in d8:
        add_heading_lvl(doc, title, 3)
        doc.add_paragraph(f"Type: {stype}  |  Primary results: {tags}")
        doc.add_paragraph(desc)
        add_reading_lines(doc, reads)
        doc.add_paragraph(f"Application Benchmark: {bench}")
        doc.add_paragraph()

    # --- DOMAIN 6 ---
    add_heading_lvl(doc, "DOMAIN 6: EXERCISE SCIENCE & CONSTRUCTION", 1)
    doc.add_paragraph("Nomenclature, demand scoring, taxonomy. Primary results: R1, R2.")

    d3 = [
        (
            "6.1  Exercise Nomenclature Formula",
            "Knowledge + Application",
            "R1",
            "Five-element formula; name and parse exercises.",
            ["5.04 Exercise Nomenclature and Taxonomy Guide.docx"],
            "Write correct FITS names for 20 floor exercises.",
        ),
        (
            "6.2  Exercise Demand Scoring",
            "Application",
            "R2",
            "Score ML, MC, VED, CPL; tag components; track how variants shift demand.",
            [
                "5.04 Exercise Nomenclature and Taxonomy Guide.docx",
                "2.02 Demand Continuum.docx",
                "2.02B Demand Continuum Scoring Tool.xlsx",
            ],
            "Score a progression series; show demand shift across dimensions.",
        ),
        (
            "6.3  What Is an Exercise (Philosophical Understanding)",
            "Knowledge",
            "R1",
            "Exercise as demand into the Movement System; name, demand profile, target, gate, adaptation, context.",
            ["5.03 Exercise Guide.docx"],
            "For any programmed exercise, state all six information elements without notes.",
        ),
        (
            "6.4  Loading Parameters & Training Methods",
            "Knowledge + Application",
            "R2",
            "Loading method matrix, undulation, rest, tempo; programming-level variables.",
            [
                "1.L1.04C Olympic Lifting and Power Development Guide.docx",
                "1.GOV.01 Strength and Conditioning Principles.docx",
                "1.GOV.01B Additional SC Principles.docx",
                "1.GOV.02 Windows of Adaptation.docx",
            ],
            "Prescribe loading for strength/power/speed/capacity goals; justify rest and tempo.",
        ),
        (
            "6.5  Exercise Management System (EMS) Competency",
            "Application",
            "R1, R5",
            "Navigate EMS; add exercises with nomenclature, demand scores, tags.",
            ["5.04 Exercise Nomenclature and Taxonomy Guide.docx", "0.03 FITS Reference Lists.xlsx"],
            "Enter five variations with complete fields; peer verify.",
        ),
    ]
    for title, stype, tags, desc, reads, bench in d3:
        add_heading_lvl(doc, title, 3)
        doc.add_paragraph(f"Type: {stype}  |  Primary results: {tags}")
        doc.add_paragraph(desc)
        add_reading_lines(doc, reads)
        doc.add_paragraph(f"Application Benchmark: {bench}")
        doc.add_paragraph()

    # --- DOMAIN 7 ---
    add_heading_lvl(doc, "DOMAIN 7: SPORT-SPECIFIC APPLICATION (FLIGHT SCHOOL / JUMP DEVELOPMENT)", 1)
    doc.add_paragraph("Jump Formula, approach jump, metrics. Primary result: R2.")

    d6 = [
        (
            "7.1  The Jump Formula (Foundation × Technique × Engine)",
            "Knowledge",
            "R2",
            "Three pillars; principles mapped to Movement System.",
            [
                "2.JUMP.01 Jump Formula and Approach Jump Principles.docx",
                "2.JUMP.01B.VIS Jump Formula Interactive.html (or 2.JUMP.01C/D.VIS explainers)",
            ],
            "Explain Jump Formula; identify primary limiter from data.",
        ),
        (
            "7.2  Approach Jump Kinogram Analysis",
            "Application",
            "R2",
            "Frames, criteria, composite qualities; kinogram scorecard.",
            [
                "2.JUMP.03 Approach Jump Kinogram Guide.docx",
                "2.JUMP.03B.SC Original Approach Jump Kinogram Scorecard.xlsx",
                "2.JUMP.03D.SC Approach Jump Scorecard.html",
            ],
            "Film, frame, score, actionable summary.",
        ),
        (
            "7.3  Jump Metric Interpretation",
            "Application",
            "R2, R3",
            "CMJ, DJ, RSI, DSI, P1/P2, etc.; ST.JUMP topic guides; X9 folder.",
            [
                "ST.JUMP.* Understanding Jump Performance Metrics & related topic guides (1. The Movement System)",
                "X9 - JUMP METRICS/",
                "4.JUMP.06 Jump Report Guide.docx",
            ],
            "From a report: engine vs technique vs stiffness indicators; priorities.",
        ),
        (
            "7.4  Jump Report Communication",
            "Application",
            "R4, R2",
            "Athlete- and coach-facing reports; Jump Report framework.",
            ["4.JUMP.06 Jump Report Guide.docx", "4.JUMP.06B.VIS Jump Report Guide.html", "2.JUMP.04 Consistency and Vertical Jump Development.docx"],
            "Produce jump report that drives training buy-in.",
        ),
    ]
    for title, stype, tags, desc, reads, bench in d6:
        add_heading_lvl(doc, title, 3)
        doc.add_paragraph(f"Type: {stype}  |  Primary results: {tags}")
        doc.add_paragraph(desc)
        add_reading_lines(doc, reads)
        doc.add_paragraph(f"Application Benchmark: {bench}")
        doc.add_paragraph()

    # --- DOMAIN 8 ---
    add_heading_lvl(doc, "DOMAIN 8: TRAINING READINESS, WELLNESS & INJURY PREVENTION", 1)
    doc.add_paragraph("Readiness, escalation, prevention. Primary results: R3, R4.")

    d7 = [
        (
            "8.1  Training Readiness Monitoring",
            "Application",
            "R3, R5",
            "CMJ monitoring, wellness, sRPE × duration, baselines as per team protocol.",
            [
                "5.02 Programming Contextual Factors — Guide.docx",
                "X2 - IMPLEMENTATION/mind-wellness.md",
                "5.10.VIS Training Readiness Explainer - Flight School.html (if applicable)",
                "Internal: Training Readiness System (if maintained separately)",
            ],
            "Run weekly protocol; traffic-light interpretation; adjust session demand.",
        ),
        (
            "8.2  Signs, Symptoms & Injury Model",
            "Knowledge",
            "R3",
            "Risk signs; escalation; clinical pathway.",
            ["1.CMD.02 Signs-Symptoms-Injury Model.docx"],
            "On tracker flag: follow escalation; communicate with Sports Medicine.",
        ),
        (
            "8.3  Injury Prevention through Movement Quality",
            "Knowledge + Application",
            "R3",
            "Quality-before-performance; CMD; PL gating; return-to-development.",
            ["0.05 Rule-Based Architecture.docx", "1.CMD.01 Common Movement Dysfunctions.docx", "1.CMD.03 The Solution Matrix.docx"],
            "Hidden Risk quadrant: quality-first intervention before demand progression.",
        ),
        (
            "8.4  First Aid & Emergency Procedures",
            "Application",
            "R3",
            "Facility emergency protocols; current certification.",
            ["Facility Emergency Protocol (Internal)", "First Aid Certification"],
            "Demonstrate emergency response in facility drill.",
        ),
    ]
    for title, stype, tags, desc, reads, bench in d7:
        add_heading_lvl(doc, title, 3)
        doc.add_paragraph(f"Type: {stype}  |  Primary results: {tags}")
        doc.add_paragraph(desc)
        add_reading_lines(doc, reads)
        doc.add_paragraph(f"Application Benchmark: {bench}")
        doc.add_paragraph()

    # --- DOMAIN 9 ---
    add_heading_lvl(doc, "DOMAIN 9: PROFESSIONAL DEVELOPMENT & TEAM CONTRIBUTION", 1)
    doc.add_paragraph("Growth and system contribution. Primary results: R1, R5.")

    d9 = [
        (
            "9.1  FITS Knowledge Checklist Completion",
            "Knowledge",
            "R1",
            "Complete organizational Knowledge Checklist (foundation, engine, speed, advanced).",
            ["All registry-listed assets in this guide; ADS Reading Pathway section below", "0.00.DB FITS ADS File Registry.html"],
            "Pass Knowledge Checklist assessment across categories.",
        ),
        (
            "9.2  AD Rounds Participation",
            "Application",
            "R5",
            "Present; document; demonstrate; peer feedback.",
            ["Assigned topic materials from FITS ADS"],
            "One AD Round per quarter with practical demonstration.",
        ),
        (
            "9.3  ADS Contribution & System Building",
            "Application",
            "R5",
            "EMS, scoring validation, document feedback, tools.",
            ["5.04 Exercise Nomenclature and Taxonomy Guide.docx", "0.03 FITS Reference Lists.xlsx"],
            "One contribution task per month (e.g., score exercises, validate sheet).",
        ),
        (
            "9.4  Sport Science Literature Engagement",
            "Knowledge",
            "R1, R2",
            "Connect research to FITS architecture.",
            [
                "1.GOV.02 Windows of Adaptation.docx",
                "1.GOV.01B Additional SC Principles.docx",
                "ST.JUMP.06 Joint Coordination and Tendon Stiffness.docx (example topic doc)",
            ],
            "Monthly article at AD Rounds with FITS integration points.",
        ),
        (
            "9.5  Mentorship & Intern Development",
            "Application",
            "R5",
            "Structure observation and progressive responsibility.",
            ["6.01 Complete Feedback and Learning Loop.docx", "1.L4.01 Motor Control Principles Guide.docx"],
            "Supervise intern one block with structured pathway.",
        ),
    ]
    for title, stype, tags, desc, reads, bench in d9:
        add_heading_lvl(doc, title, 3)
        doc.add_paragraph(f"Type: {stype}  |  Primary results: {tags}")
        doc.add_paragraph(desc)
        add_reading_lines(doc, reads)
        doc.add_paragraph(f"Application Benchmark: {bench}")
        doc.add_paragraph()

    # Reading pathway (registry-only; see emit_reading_pathway_from_registry)
    doc.add_page_break()
    registry_path = next((p for p in REGISTRY_HTML_CANDIDATES if p.is_file()), None)
    registry_entries = parse_fits_ads_registry(registry_path) if registry_path else []
    emit_reading_pathway_from_registry(doc, registry_path, registry_entries)

    add_heading_lvl(doc, "ROLE-TO-DOMAIN MAPPING", 1)
    doc.add_paragraph(
        "Minimum competency expectation by role. ADS is expected to demonstrate the five results (R1–R5) in practice, not only domain competence."
    )
    t3 = doc.add_table(rows=10, cols=5)
    match_table_properties_to_template(t3)
    t3.rows[0].cells[0].text = "DOMAIN"
    t3.rows[0].cells[1].text = "INTERN"
    t3.rows[0].cells[2].text = "ADS"
    t3.rows[0].cells[3].text = "AD DIRECTOR"
    t3.rows[0].cells[4].text = "SPORT SCIENCE DIR."
    # Same sequence as guide body: domains 1–9 in development order
    rmap = [
        ("1. System Knowledge & Philosophy", "Learn", "Competent", "Expert", "Expert"),
        ("2. Assessment, Profiling & Observation", "Observe", "Competent", "Expert", "Expert"),
        ("3. Programming & Session Design", "Observe", "Developing", "Expert", "Expert"),
        ("4. Coaching, Cueing & Feedback", "Observe", "Developing", "Expert", "Expert"),
        ("5. Program Delivery & QA", "Contribute", "Competent", "Expert", "Expert"),
        ("6. Exercise Science & Construction", "Learn", "Competent", "Expert", "Expert"),
        ("7. Sport-Specific (Flight School)", "Exposure", "Developing", "Competent", "Expert"),
        ("8. Readiness, Wellness & Injury Prev.", "Learn", "Competent", "Expert", "Expert"),
        ("9. Professional Development & Team", "Participate", "Contribute", "Lead", "Build"),
    ]
    for i, row in enumerate(rmap, start=1):
        for j, val in enumerate(row):
            t3.rows[i].cells[j].text = val

    doc.add_paragraph()
    add_heading_lvl(doc, "DEVELOPMENT SIGN-OFF", 1)
    doc.add_paragraph(
        "The following sign-off confirms that the Athletic Development Specialist has reviewed this skills guide, "
        "understands the expectations for their role, and has established a development plan with their Sport Director."
    )
    doc.add_paragraph("Name: ___________________________________________     Role: ________________________")
    doc.add_paragraph("Sport Director: ___________________________________     Date: ________________________")
    doc.add_paragraph("Development Plan Start Date: ____________________     Target Completion: ________________")
    doc.add_paragraph()
    doc.add_paragraph("From the Foundation to Their Mind.")

    out_workspace = (
        "/Users/thomaslam/Library/Mobile Documents/iCloud~md~obsidian/Documents/FITS/.claude/worktrees/vigorous-satoshi/"
        "Athletic_Development_Skills_Guide_v2.docx"
    )
    out_downloads = "/Users/thomaslam/Downloads/Athletic_Development_Skills_Guide_v2.docx"
    doc.save(out_workspace)
    shutil.copy2(out_workspace, out_downloads)
    print("Wrote:", out_workspace)
    print("Copied:", out_downloads)


if __name__ == "__main__":
    main()
