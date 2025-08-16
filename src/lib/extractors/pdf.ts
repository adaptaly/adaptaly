// src/lib/extractors/pdf.ts

// Use a dynamic import to avoid module side effects during Next build
export async function extractPdf(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    const { default: pdfParse } = await import("pdf-parse"); // dynamic to prevent build-time eval
    const result = await pdfParse(buffer);
    const text = result.text || "";
    const pageCount = typeof result.numpages === "number" ? result.numpages : 0;
    return { text, pageCount };
  } catch (e: any) {
    // Common failure case is password-protected or corrupted PDF
    throw new Error(
      "This PDF appears to be locked or corrupted. Please export an unlocked copy and try again."
    );
  }
}