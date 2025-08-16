// src/lib/extractors/docx.ts

/**
 * Minimal DOCX text extractor using JSZip.
 * Reads /word/document.xml and converts XML to text.
 * Dynamic import prevents side effects during Next build.
 */
export async function extractDocx(buffer: Buffer): Promise<{ text: string }> {
  const { default: JSZip } = await import("jszip");

  const zip = await JSZip.loadAsync(buffer);

  const docXmlFile = zip.file("word/document.xml") || zip.file("/word/document.xml");
  if (!docXmlFile) {
    throw new Error(
      "We could not read this DOCX. Try re-saving as .docx or export to PDF and upload again."
    );
  }

  const xml = await docXmlFile.async("string");

  // Preserve paragraph boundaries by marking </w:p> with a newline first
  let marked = xml.replace(/<\/w:p>/g, "\n");

  // Drop all tags
  let text = marked.replace(/<[^>]+>/g, "");

  // Decode basic XML entities
  text = decodeXmlEntities(text);

  // Normalize whitespace a bit; deeper cleaning happens later
  text = text.replace(/\r/g, "");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return { text };
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#xA;/g, "\n")
    .replace(/&#xD;/g, "\r")
    .replace(/&#x9;/g, "\t");
}