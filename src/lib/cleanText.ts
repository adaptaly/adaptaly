// src/lib/cleanText.ts

/**
 * Removes repeated headers/footers, page numbers, merges hyphenated line breaks,
 * and normalizes whitespace.
 *
 * This is heuristic and safe. It avoids aggressive content loss.
 */
export function cleanText(input: string): string {
    if (!input) return "";
  
    // Normalize line endings
    let text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
    // Merge hyphenated line breaks: example-
    // line -> exampleline
    text = text.replace(/([A-Za-z])-\n([A-Za-z])/g, "$1$2");
  
    // Remove simple page number lines (e.g., "Page 12", "12", "12 of 30")
    text = text.replace(/^\s*(?:Page\s+)?\d+(?:\s+of\s+\d+)?\s*$/gim, "");
  
    // Detect and remove repeated header/footer lines that appear on many pages
    text = stripRepeatedHeadersFooters(text);
  
    // Collapse excessive blank lines
    text = text.replace(/\n{3,}/g, "\n\n");
  
    // Trim spaces on line ends
    text = text.replace(/[ \t]+\n/g, "\n");
  
    // Collapse excessive spaces in-line but keep newlines intact
    text = text
      .split("\n")
      .map((line) => line.replace(/[ \t]{2,}/g, " ").trimEnd())
      .join("\n");
  
    // Final trim
    return text.trim();
  }
  
  function stripRepeatedHeadersFooters(text: string): string {
    const lines = text.split("\n");
  
    // Simple page segmentation guess: consider every ~40–80 lines as a "page"
    // This is a heuristic for sources without explicit page markers.
    const approxLinesPerPage = 60;
    const buckets: string[][] = [];
  
    for (let i = 0; i < lines.length; i += approxLinesPerPage) {
      buckets.push(lines.slice(i, i + approxLinesPerPage));
    }
  
    // Gather candidate header/footer lines by position
    const headerMap = new Map<string, number>();
    const footerMap = new Map<string, number>();
  
    for (const page of buckets) {
      if (page.length === 0) continue;
      const header = normalizeHeaderFooterLine(page[0]);
      const footer = normalizeHeaderFooterLine(page[page.length - 1]);
  
      if (header) headerMap.set(header, (headerMap.get(header) || 0) + 1);
      if (footer) footerMap.set(footer, (footerMap.get(footer) || 0) + 1);
    }
  
    const minRepeat = Math.max(2, Math.floor(buckets.length * 0.6)); // 60 percent pages
    const headersToRemove = new Set(
      [...headerMap.entries()].filter(([, c]) => c >= minRepeat).map(([k]) => k)
    );
    const footersToRemove = new Set(
      [...footerMap.entries()].filter(([, c]) => c >= minRepeat).map(([k]) => k)
    );
  
    // Remove matching header/footer lines
    const cleaned: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const norm = normalizeHeaderFooterLine(line);
      if (headersToRemove.has(norm) || footersToRemove.has(norm)) {
        continue;
      }
      cleaned.push(line);
    }
    return cleaned.join("\n");
  }
  
  function normalizeHeaderFooterLine(s: string | undefined): string {
    if (!s) return "";
    return s.trim().replace(/\s+/g, " ").toLowerCase();
  }  