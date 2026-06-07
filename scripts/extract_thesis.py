import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = Path(r"C:\skripsi\Draft Skripsi F1E122037 Fix.docx")
OUT_PATH = ROOT / "src" / "data" / "thesis.json"
PUBLIC_OUT_PATH = ROOT / "public" / "data" / "thesis.json"

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
}


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def para_text(paragraph) -> str:
    parts = []
    for node in paragraph.iter():
        if node.tag == f"{{{NS['w']}}}t":
            parts.append(node.text or "")
        elif node.tag == f"{{{NS['w']}}}tab":
            parts.append("\t")
        elif node.tag == f"{{{NS['w']}}}br":
            parts.append("\n")
    return clean_text("".join(parts))


def style_id(paragraph) -> str:
    ppr = paragraph.find("w:pPr", NS)
    if ppr is None:
        return ""
    style = ppr.find("w:pStyle", NS)
    if style is None:
        return ""
    return style.attrib.get(f"{{{NS['w']}}}val", "")


def heading_level(text: str, style: str) -> int:
    lowered = style.lower()
    if "heading1" in lowered or re.match(r"^(bab|chapter)\b", text, re.I):
        return 1
    if "heading2" in lowered or re.match(r"^\d+\.\d+\s+", text):
        return 2
    if "heading3" in lowered or re.match(r"^\d+\.\d+\.\d+\s+", text):
        return 3
    return 0


def tokens(text: str):
    return sorted(set(t.lower() for t in re.findall(r"[A-Za-zÀ-ÿ0-9]+", text) if len(t) > 2))


def cell_text(cell) -> str:
    values = [para_text(p) for p in cell.findall(".//w:p", NS)]
    return clean_text(" ".join(v for v in values if v))


def extract():
    if not DOCX_PATH.exists():
        raise FileNotFoundError(DOCX_PATH)
    blocks = []
    tables = []
    current_section = ""
    paragraph_index = 0
    table_index = 0
    with zipfile.ZipFile(DOCX_PATH) as docx:
        document = ET.fromstring(docx.read("word/document.xml"))
    body = document.find("w:body", NS)
    for child in list(body):
        if child.tag == f"{{{NS['w']}}}p":
            text = para_text(child)
            if not text:
                continue
            paragraph_index += 1
            style = style_id(child)
            level = heading_level(text, style)
            if level:
                current_section = text
            blocks.append(
                {
                    "id": f"p-{paragraph_index:04d}",
                    "kind": "paragraph",
                    "index": paragraph_index,
                    "style": style,
                    "headingLevel": level,
                    "section": current_section,
                    "text": text,
                    "searchText": clean_text(f"{current_section} {text}"),
                    "tokens": tokens(text),
                }
            )
        elif child.tag == f"{{{NS['w']}}}tbl":
            table_index += 1
            rows = []
            for row in child.findall("w:tr", NS):
                rows.append([cell_text(cell) for cell in row.findall("w:tc", NS)])
            flat = clean_text(" ".join(" ".join(row) for row in rows))
            tables.append(
                {
                    "id": f"t-{table_index:03d}",
                    "kind": "table",
                    "index": table_index,
                    "section": current_section,
                    "rows": rows,
                    "searchText": flat,
                    "tokens": tokens(flat),
                }
            )
    required_terms = [
        "konflik ruang tatap muka",
        "penalti",
        "fuzzy",
        "crossover",
        "mutation",
        "greedy",
    ]
    full_text = " ".join([b["text"] for b in blocks] + [t["searchText"] for t in tables]).lower()
    summary = {
        "source": str(DOCX_PATH),
        "paragraphCount": len(blocks),
        "headingCount": sum(1 for b in blocks if b["headingLevel"]),
        "tableCount": len(tables),
        "requiredTerms": {term: term.lower() in full_text for term in required_terms},
    }
    payload = json.dumps({"summary": summary, "blocks": blocks, "tables": tables}, ensure_ascii=False, indent=2)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(payload, encoding="utf-8")
    PUBLIC_OUT_PATH.write_text(payload, encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    extract()
