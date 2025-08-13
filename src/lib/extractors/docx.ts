// Update
// src/lib/extractors/docx.ts
import JSZip from "jszip";

/**
 * Extract plain text from a .docx buffer.
 * Lightweight approach: read word/document.xml (and header/footer if present),
 * collect <w:t> nodes, and join paragraphs with newlines.
 */
export async function extractDocx(buffer: Buffer): Promise<string> {
  return extractRawText(buffer);
}

/* ===== Minimal DOCX -> text reader using JSZip + simple XML parsing ===== */

async function extractRawText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);

  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) {
    throw new Error("Unsupported DOCX structure - missing word/document.xml");
  }

  // Core document text
  let text = xmlToText(docXml);

  // Optionally merge headers and footers if present
  const headerFiles = Object.keys(zip.files).filter((k) => /^word\/header\d+\.xml$/.test(k));
  const footerFiles = Object.keys(zip.files).filter((k) => /^word\/footer\d+\.xml$/.test(k));

  for (const hf of headerFiles) {
    const hx = await zip.file(hf)?.async("string");
    if (hx) text = xmlToText(hx) + "\n" + text;
  }
  for (const ff of footerFiles) {
    const fx = await zip.file(ff)?.async("string");
    if (fx) text = text + "\n" + xmlToText(fx);
  }

  return text;
}

// Convert a subset of WordprocessingML to plain text.
// - paragraphs: <w:p> ... </w:p>
// - text runs: <w:t> ... </w:t>
// - line breaks: <w:br/>
function xmlToText(xml: string): string {
  // Split on paragraph open tags to keep paragraph boundaries
  const paraSplit = xml.split("<w:p");
  const parts: string[] = [];

  for (let i = 0; i < paraSplit.length; i++) {
    const seg = paraSplit[i];
    if (!seg) continue;

    const closeIdx = seg.indexOf("</w:p>");
    if (closeIdx === -1) continue;

    const paraXml = seg.slice(0, closeIdx);

    // Replace explicit line breaks with newline placeholders to keep structure
    const withBreaks = paraXml.replace(/<w:br\s*\/>/g, "\n");

    // Collect all text nodes inside this paragraph
    const texts = Array.from(withBreaks.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)).map((m) => decodeXml(m[1]));

    // Join runs into one paragraph line
    parts.push(texts.join(""));
  }

  // Join paragraphs with a newline, then collapse multiple blank lines
  return parts.join("\n").replace(/\n{3,}/g, "\n\n");
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}