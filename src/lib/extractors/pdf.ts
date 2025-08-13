// New
// src/lib/extractors/pdf.ts
import pdf from "pdf-parse";

/**
 * Extract plain text and page count from a PDF.
 * Throws on encrypted or corrupted files with the library's native error.
 */
export async function extractPdf(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const data = await pdf(buffer, {
    // Disable page render to speed up text extraction
    pagerender: undefined as any,
  });

  // pdf-parse returns text with line breaks. Preserve for cleaning heuristics.
  const text = data.text || "";
  const pages = typeof data.numpages === "number" ? data.numpages : (data as any).numpages || 0;

  return { text, pages };
}