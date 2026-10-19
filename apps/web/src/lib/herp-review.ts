// Parses Herpetological Review Natural History Note citations, e.g.
// "Smith, J. A., and B. Jones. 2015. Natural history notes. CROTALUS HORRIDUS (Timber Rattlesnake). DIET. Herpetological Review 46(2):235–236."

export const HR_PAGE = "https://ssarherps.org/publications/herpetological-review/";

export type HrNote = {
  authors: string | null;
  year: number;
  taxon: string; // as printed, normalized case: "Crotalus horridus"
  binomial: string; // first two words, for species matching
  commonName: string;
  topic: string;
  volume: number;
  issue: number | null;
  pages: string;
  title: string;
  citation: string;
  key: string;
};

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const NOTE =
  /^(?:(.+?)\s+(\d{4})[a-z]?\.\s+)?(?:Natural history notes[.:]?\s+)?([A-Z][A-Za-z]+(?:\s+[A-Za-z]+){1,2})\s*\(([^)]+)\)\.\s*(.+?)\.?\s*Herp(?:etological|\.)\s*Rev(?:iew|\.)\s*(\d+)\s*(?:\((\d+)\))?\s*:\s*(\d+(?:\s*[–-]\s*\d+)?)/i;

export function parseHrCitation(line: string): HrNote | null {
  const m = line.trim().replace(/\s+/g, " ").match(NOTE);
  if (!m) return null;
  const [, rawAuthors, rawYear, rawTaxon, commonName, rawTopic, vol, iss, rawPages] = m;
  const words = rawTaxon.split(" ");
  const taxon = [sentence(words[0]), ...words.slice(1).map((w) => w.toLowerCase())].join(" ");
  const volume = Number(vol);
  const issue = iss ? Number(iss) : null;
  const pages = rawPages.replace(/\s*[–-]\s*/, "–");
  // Volume 1 was 1967 (issues then ran more than one per year); from the 1970s on, volume = year − 1969.
  const year = rawYear ? Number(rawYear) : volume + 1969;
  const topic = rawTopic.replace(/\.$/, "").trim().split(/\.\s+/).map(sentence).join(". ");
  const citation = `Herpetological Review ${volume}${issue ? `(${issue})` : ""}: ${pages}`;
  return {
    // Keep the period after a final initial ("Goldberg, S. R."), drop the one after a surname.
    authors: rawAuthors?.trim().replace(/,$/, "").replace(/([a-z])\.$/, "$1") || null,
    year,
    taxon,
    binomial: words.slice(0, 2).join(" ").toLowerCase(),
    commonName: commonName.trim(),
    topic,
    volume,
    issue,
    pages,
    title: `${taxon} (${commonName.trim()}). ${topic}.`,
    citation,
    key: `${volume}:${pages}:${taxon}:${topic}`.toLowerCase(),
  };
}
