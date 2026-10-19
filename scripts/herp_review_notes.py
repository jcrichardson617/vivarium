"""Imports Herpetological Review Natural History Notes citations from SSAR's
open-access PDFs into the HerpAtlas research library.

For each issue listed on SSAR's PDF page, downloads the Natural History Notes
section, splits it into notes by their headings ("GENUS SPECIES (Common Name).
TOPIC."), and saves a summary-only document per note whose species is in our
list: citation, topic and a link to the PDF, never the note text (same shape as
Admin -> NH notes). Safe to re-run: notes are keyed by volume, pages, taxon and
topic, and summaries written by hand are kept.

Usage: python scripts/herp_review_notes.py [--dry-run] [--issues N]
Writes need SUPABASE_SERVICE_ROLE_KEY; --dry-run only reads and prints.
"""

import argparse
import html
import io
import os
import re
import sys
import urllib.parse
from collections import Counter

import requests
from pdfminer.high_level import extract_pages
from pdfminer.layout import LAParams, LTTextContainer

SUPABASE_URL = "https://megvsfrjvmjpujarjksx.supabase.co"
PUBLISHABLE_KEY = "sb_publishable_H4uyBL0TXOgId15hh4l6Lg_JlUBS5R6"
PDF_PAGE = "https://ssarherps.org/herpetological-review-pdfs/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; HerpAtlas/1.0; +https://www.reptilytics.com)"}

ISSUE_LINK = re.compile(
    r"Herpetological Review (\d+)\((\d+)\)\. Natural History Notes \(<a href=\"([^\"]+)\"", re.I
)
# "CROTALUS HORRIDUS (Timber Rattlesnake). DIET." followed by the note's text.
# Up to four capitalized words so a group heading ("SALAMANDERS") that runs into
# the first note's name is caught and dropped (see GROUPS).
HEADING = re.compile(
    r"(?<![A-Za-z])([A-Z][A-Z\-]{2,}(?: [A-Z×][A-Z\-]{1,}){1,3}) ?\(([^()]{2,80})\)\. ?"
    r"([A-Z][A-Z0-9 ,;:/&'’\-–]{2,120}?)\. (?=[A-Z0-9“\"(])"
)
GROUPS = {
    "CAUDATA", "SALAMANDERS", "ANURA", "FROGS", "TOADS", "GYMNOPHIONA", "CAECILIANS", "TESTUDINES", "TURTLES",
    "CROCODYLIA", "CROCODILIANS", "SQUAMATA", "LIZARDS", "SNAKES", "AMPHISBAENIA", "AMPHISBAENIANS", "RHYNCHOCEPHALIA",
}
# Running header on every page; removed so it doesn't run into note text.
RUNNING_HEADER = re.compile(r"NATURAL HISTORY NOTES|Herpetological Review \d+\(\d\),? \d{4}", re.I)
PARTICLES = {"DE", "DA", "DOS", "DAS", "DO", "DI", "DEL", "LA", "VAN", "VON", "DER", "DEN", "LE"}
UPPER = "A-ZÀ-ÖØ-Þ"

# Authors' names in capitals, each followed by an address and usually an e-mail.
# Only initials carry a period, so "USA. JOHN SMITH" doesn't swallow the country.
NAME_PART = rf"(?:[{UPPER}]\.|[{UPPER}][{UPPER}'’\-]+)"
AUTHOR = re.compile(rf"(?<![A-Za-zÀ-ÿ.])({NAME_PART}(?: {NAME_PART}){{1,4}}), (?=[^;]{{0,300}}?e-?mail)")


def sentence(s: str) -> str:
    return s[:1].upper() + s[1:].lower()


def title_name(s: str) -> str:
    words = []
    for i, w in enumerate(s.split()):
        if i and w in PARTICLES:
            words.append(w.lower())
        elif re.fullmatch(r"I{2,3}|IV|JR\.?|SR\.?", w):
            words.append(w if w.startswith("I") else w.title())
        elif w.endswith(".") and len(w) <= 3:
            words.append(w)
        else:
            words.append("-".join(p[:1] + p[1:].lower() for p in w.split("-")))
    return " ".join(words)


def join_names(names):
    if len(names) <= 2:
        return " and ".join(names)
    return ", ".join(names[:-1]) + ", and " + names[-1]


def issues():
    page = requests.get(PDF_PAGE, headers=UA, timeout=60).text
    seen = set()
    for vol, iss, href in ISSUE_LINK.findall(page):
        if (vol, iss) in seen:
            continue
        seen.add((vol, iss))
        yield int(vol), int(iss), html.unescape(href)


def page_texts(pdf: bytes):
    """Text of each PDF page (columns kept in reading order)."""
    out = []
    for layout in extract_pages(io.BytesIO(pdf), laparams=LAParams()):
        out.append("\n".join(el.get_text() for el in layout if isinstance(el, LTTextContainer)))
    return out


def edge_lines(text, n=6):
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return lines[:n] + lines[-n:]


def journal_page_offset(pages):
    """Journal page = PDF page index + offset, by majority vote over printed page numbers
    (a line that is just a number, or a number beside the running header)."""
    votes = Counter()
    for i, text in enumerate(pages):
        for line in edge_lines(text):
            nums = []
            if re.fullmatch(r"\d{1,4}", line):
                nums = [int(line)]
            elif RUNNING_HEADER.search(line):
                rest = RUNNING_HEADER.sub(" ", line)
                nums = [int(x) for x in re.findall(r"(?<![\d(])(\d{1,4})(?![\d)])", rest)]
            for num in nums:
                votes[num - i] += 1
    if not votes:
        return None
    offset, count = votes.most_common(1)[0]
    return offset if count >= max(2, len(pages) // 3) else None


def normalize(text: str) -> str:
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)  # re-join hyphenated line breaks
    return re.sub(r"\s+", " ", text)


def parse_issue(vol, iss, pdf):
    pages = page_texts(pdf)
    offset = journal_page_offset(pages)
    full, starts = "", []
    for text in pages:
        starts.append(len(full))
        full += normalize(RUNNING_HEADER.sub(" ", text)) + " "

    def page_at(pos):
        i = max(k for k, s in enumerate(starts) if s <= pos)
        return i + offset if offset is not None else None

    heads = list(HEADING.finditer(full))
    notes = []
    for n, m in enumerate(heads):
        end = heads[n + 1].start() if n + 1 < len(heads) else len(full)
        body = full[m.end():end]
        words = m.group(1).split()
        while len(words) > 2 and words[0] in GROUPS:
            words = words[1:]
        if len(words) > 3:
            continue
        taxon = " ".join([sentence(words[0])] + [w.lower() for w in words[1:]])
        common = re.sub(r"\s+", " ", m.group(2)).strip()
        topic = ". ".join(sentence(t.strip()) for t in m.group(3).split(". ") if t.strip())
        # Last page = where the note's own text ends (not a page number printed after it).
        text_end = m.end() + len(body.rstrip(" 0123456789"))
        first, last = page_at(m.start()), page_at(max(m.start(), text_end - 1))
        pages_str = None if first is None else (str(first) if first == last else f"{first}–{last}")
        names = []
        for a in AUTHOR.findall(body):
            name = title_name(a.strip())
            if name not in names and len(name) > 4:
                names.append(name)
        key_pages = pages_str or f"{iss}-{n + 1}"
        notes.append({
            "taxon": taxon,
            "binomial": " ".join(words[:2]).lower(),
            "common": common,
            "topic": topic,
            "pages": pages_str,
            "authors": join_names(names) if names else None,
            "title": f"{taxon} ({common}). {topic}.",
            "citation": f"Herpetological Review {vol}({iss})" + (f": {pages_str}" if pages_str else ""),
            "key": f"{vol}:{key_pages}:{taxon}:{topic}".lower(),
        })
    return notes, len(pages), offset, pages


class Db:
    def __init__(self, key):
        self.h = {"apikey": key, "Content-Type": "application/json"}
        if not key.startswith("sb_"):  # legacy JWT keys also go in Authorization; new sb_ keys must not
            self.h["Authorization"] = f"Bearer {key}"

    def get(self, path):
        r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=self.h, timeout=60)
        r.raise_for_status()
        return r.json()

    def post(self, path, body, prefer):
        r = requests.post(f"{SUPABASE_URL}/rest/v1/{path}", headers={**self.h, "Prefer": prefer}, json=body, timeout=60)
        r.raise_for_status()
        return r.json() if r.text else None

    def patch(self, path, body):
        r = requests.patch(f"{SUPABASE_URL}/rest/v1/{path}", headers=self.h, json=body, timeout=60)
        r.raise_for_status()


def species_index(db):
    by_name = {}
    for s in db.get("species?select=id,scientific_name"):
        by_name[s["scientific_name"].lower()] = s["id"]
    for s in db.get("species_synonyms?select=species_id,synonym_name"):
        by_name.setdefault(s["synonym_name"].lower(), s["species_id"])
    return by_name


def save(db, note, species_id, year, pdf_url):
    doc = db.post(
        "research_documents?on_conflict=external_source,external_id&select=id,chunk_count,summary,title",
        {
            "title": note["title"],
            "source_url": f"{pdf_url}#{urllib.parse.quote(note['key'])}",
            "source_type": "journal_article",
            "content_rights": "summary_only",
            "evidence_level": "grey_literature",
            "open_access": True,
            "authors": [note["authors"]] if note["authors"] else [],
            "publisher": "Herpetological Review",
            "published_date": f"{year}-01-01",
            "external_source": "herp_review",
            "external_id": note["key"],
            "note_topic": note["topic"],
            "citation": note["citation"],
        },
        "resolution=merge-duplicates,return=representation",
    )[0]
    db.post(
        "research_document_species?on_conflict=document_id,species_id",
        {"document_id": doc["id"], "species_id": species_id},
        "resolution=ignore-duplicates,return=minimal",
    )
    if not doc["chunk_count"]:
        content = f"{doc['title']} {doc['summary']}" if doc["summary"] else doc["title"]
        db.post("research_chunks", {"document_id": doc["id"], "chunk_index": 0, "content": content}, "return=minimal")
        db.patch(f"research_documents?id=eq.{doc['id']}", {"chunk_count": 1})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--issues", type=int, default=0, help="only the N most recent issues")
    args = ap.parse_args()

    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    dry = args.dry_run or not service_key
    if not args.dry_run and not service_key:
        print("SUPABASE_SERVICE_ROLE_KEY not set: dry run only.")
    db = Db(service_key or PUBLISHABLE_KEY)
    by_name = species_index(db)

    found = sorted(issues(), reverse=True)
    if args.issues:
        found = found[: args.issues]
    print(f"{len(found)} issues with Natural History Notes PDFs")

    total = matched = 0
    for vol, iss, url in found:
        year = vol + 1969
        try:
            res = requests.get(url, headers=UA, timeout=180)
            res.raise_for_status()
            notes, n_pages, offset, pages = parse_issue(vol, iss, res.content)
        except Exception as e:  # one bad PDF shouldn't stop the rest
            print(f"HR {vol}({iss}): failed: {e}")
            continue
        view_url = re.sub(r"([?&])dl=1", r"\1dl=0", url)
        hits = 0
        for note in notes:
            sid = by_name.get(note["taxon"].lower()) or by_name.get(note["binomial"])
            if not sid:
                continue
            hits += 1
            if dry:
                print(f"    {note['citation']} · {note['title']} · {note['authors'] or 'no authors found'}")
            else:
                save(db, note, sid, year, view_url)
        total += len(notes)
        matched += hits
        print(f"HR {vol}({iss}): {n_pages} PDF pages, page offset {offset}, {len(notes)} notes, {hits} for our species")
        if dry and offset is None and (vol, iss) == found[0][:2]:
            for i in (1, 2):
                if i < len(pages):
                    print(f"    page {i} edges: {edge_lines(pages[i], 4)!r}")
        if dry:
            for note in notes[:5]:
                print(f"    sample: {note['citation']} · {note['title']} · {note['authors'] or 'no authors found'}")
    print(f"Done: {total} notes, {matched} for our species{' (dry run, nothing saved)' if dry else ' saved'}.")


if __name__ == "__main__":
    sys.exit(main())
