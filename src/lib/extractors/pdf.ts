// src/lib/extractors/pdf.ts

// Use a dynamic import to avoid module side effects during Next build
export async function extractPdf(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    const { default: pdfParse } = await import("pdf-parse");
    
    // Try with basic options first
    const result = await pdfParse(buffer, {
      // Be more lenient with PDF parsing
      max: 0, // Parse all pages
      version: "default" // Use default parser
    });
    
    const text = result.text || "";
    const pageCount = typeof result.numpages === "number" ? result.numpages : 0;
    
    // If we got no text, it might be a scanned PDF or image-based
    if (!text.trim()) {
      return {
        text: "This PDF appears to contain only images or scanned content. Text extraction was not possible.",
        pageCount
      };
    }
    
    return { text, pageCount };
  } catch (e: any) {
    console.error("PDF extraction error:", e);
    
    // Try to provide more specific error messages
    const errorMessage = e.message || "";
    
    if (errorMessage.includes("Invalid PDF")) {
      throw new Error("This file doesn't appear to be a valid PDF. Please check the file and try again.");
    }
    
    if (errorMessage.includes("password") || errorMessage.includes("encrypted")) {
      throw new Error("This PDF is password-protected. Please unlock it and try again.");
    }
    
    // For any other error, return a more generic message with fallback
    console.warn("PDF parsing failed, but continuing:", errorMessage);
    
    // Instead of throwing, return empty text and let the user know
    return {
      text: "Unable to extract text from this PDF. The file may be image-based, corrupted, or use an unsupported format.",
      pageCount: 0
    };
  }
}