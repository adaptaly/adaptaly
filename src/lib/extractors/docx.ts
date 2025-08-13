// New
// src/lib/extractors/docx.ts
import { extractRawText } from "./docx_internal";

/**
 * Extract plain text from DOCX.
 * Uses a small internal implementation to avoid heavy dependencies in the route.
 */
export async function extractDocx(buffer: Buffer): Promise<string> {
  return extractRawText(buffer);
}

/* ===== Minimal DOCX -> text reader using JSZip + XML parsing ===== */
import JSZip from "jszip";

// Naive paragraph joiner for word/document.xml
function xmlToText(xml: string): string {
  // Replace common Word tags with newlines or spacing
  // - paragraphs: w:p
  // - text runs: w:t
  // - line breaks: w:br
  // Very lightweight approach, good enough for study notes.
  const paraSplit = xml.split("<w:p");
  const parts: string[] = [];
  for (let i = 0; i < paraSplit.length; i++) {
    const seg = paraSplit[i];
    if (!seg) continue;
    const closeIdx = seg.indexOf("</w:p>");
    if (closeIdx === -1) continue;
    const paraXml = seg.slice(0, closeIdx);
    // collect text nodes
    const texts = Array.from(paraXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)).map((m) => decodeXml(m[1]));
    parts.push(texts.join(""));
  }
  return parts.join("\n");
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export async function extractRawText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) {
    throw new Error("Unsupported DOCX structure - no document.xml");
  }
  // Core text
  let text = xmlToText(docXml);

  // Optionally append headers and footers if present
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