// Shared text helpers for the research functions (kept in sync across functions).

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

// Plain text from a title or abstract that may contain (escaped) HTML.
export function plain(s: string | null | undefined) {
  if (!s) return "";
  return decodeEntities(decodeEntities(s).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

const MAX_CHUNK = 1200;

function sentences(text: string) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z(\[])/);
}

// Split paragraphs into passages of up to ~1200 characters (gte-small reads
// at most 512 tokens). Each passage is prefixed with the document title and
// section heading so it still makes sense on its own.
export function chunk(title: string, sections: { heading?: string; paragraphs: string[] }[]) {
  const out: string[] = [];
  for (const section of sections) {
    const prefix = `${title}${section.heading ? `\n${section.heading}` : ""}\n\n`;
    const room = MAX_CHUNK - prefix.length;
    let current = "";
    const flush = () => {
      if (current.trim()) out.push(prefix + current.trim());
      current = "";
    };
    for (const para of section.paragraphs) {
      const pieces = para.length > room ? sentences(para) : [para];
      pieces.forEach((text, j) => {
        let piece = text.trim();
        while (piece.length > room) {
          flush();
          out.push(prefix + piece.slice(0, room));
          piece = piece.slice(room);
        }
        if (!piece) return;
        if (current && current.length + 2 + piece.length > room) flush();
        current += current ? (j === 0 ? "\n\n" : " ") + piece : piece;
      });
    }
    flush();
  }
  return out;
}
