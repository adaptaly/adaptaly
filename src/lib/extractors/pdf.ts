// Robust PDF extraction with fallback (like MVP)
export async function extractPdf(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    const { default: pdfParse } = await import("pdf-parse");
    
    const result = await pdfParse(buffer, {
      max: 0, // Parse all pages
      version: "default"
    });
    
    const text = result.text || "";
    const pageCount = typeof result.numpages === "number" ? result.numpages : 0;
    
    if (!text.trim()) {
      // Still provide the page count even if no text extracted
      return {
        text: "This PDF appears to contain only images or scanned content. Text extraction was not possible. Try using an OCR tool first or uploading a text-based PDF.",
        pageCount
      };
    }
    
    return { text, pageCount };
  } catch (error: any) {
    const errorMessage = error?.message || "";
    
    // Handle specific PDF errors more gracefully
    if (errorMessage.includes("Invalid PDF") || errorMessage.includes("PDF parsing")) {
      // Try best-effort fallback like MVP
      try {
        const fallbackText = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
        const cleaned = fallbackText.trim();
        
        if (cleaned && cleaned.length > 50) {
          // If we get meaningful text from raw decode, use it
          return { 
            text: cleaned.slice(0, 200000), // Limit like MVP
            pageCount: 0 
          };
        }
      } catch {
        // Fallback failed too
      }
      
      throw new Error(
        "This PDF file appears to be corrupted or uses an unsupported format. " +
        "Please try: 1) Re-saving or re-exporting the PDF, 2) Using a different PDF viewer to export it, or 3) Converting the content to a text file."
      );
    }
    
    if (errorMessage.includes("encrypted") || errorMessage.includes("password")) {
      throw new Error(
        "This PDF is password-protected or encrypted. Please remove the password protection and try uploading again."
      );
    }
    
    if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
      throw new Error(
        "Network timeout while processing the PDF. The file might be too large or complex. Try uploading a smaller PDF or converting to text format."
      );
    }
    
    // For any other error, try best-effort fallback like MVP
    try {
      const fallbackText = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      const cleaned = fallbackText.trim();
      
      if (cleaned && cleaned.length > 50) {
        // If we get meaningful text from raw decode, use it
        return { 
          text: cleaned.slice(0, 200000), // Limit like MVP
          pageCount: 0 
        };
      }
    } catch {
      // Even fallback failed
    }
    
    // Final error message
    throw new Error(
      "Unable to extract text from this PDF file. This could be due to: " +
      "1) The PDF contains only images/scans (try OCR first), " +
      "2) The file is corrupted or uses an unsupported format, " +
      "3) The PDF is too complex to process. " +
      "Please try converting to a text file or using a simpler PDF format."
    );
  }
}