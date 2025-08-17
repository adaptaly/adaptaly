// Robust DOCX extraction using mammoth (like MVP)
export async function extractDocx(buffer: Buffer): Promise<{ text: string }> {
  try {
    // Use mammoth for robust DOCX extraction (like MVP)
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    
    const text = result.value || "";
    
    if (!text.trim()) {
      throw new Error("This DOCX file appears to be empty or contains only formatting. Please check the document content.");
    }
    
    return { text };
  } catch (error: any) {
    // If mammoth fails, try fallback approach
    if (error.message?.includes("empty")) {
      throw error; // Re-throw our custom empty message
    }
    
    try {
      // Fallback to JSZip approach for edge cases
      const { default: JSZip } = await import("jszip");
      
      const zip = await JSZip.loadAsync(buffer);
      const docXmlFile = zip.file("word/document.xml") || zip.file("/word/document.xml");
      
      if (!docXmlFile) {
        throw new Error("We could not read this DOCX file. The document structure appears to be corrupted or invalid. Try re-saving the file as .docx from your word processor, or convert to PDF and try again.");
      }

      const xml = await docXmlFile.async("string");
      
      // Preserve paragraph boundaries with better spacing
      let marked = xml.replace(/<\/w:p>/g, "\n\n");
      // Remove line breaks within paragraphs but preserve intentional breaks
      marked = marked.replace(/<w:br\s*\/?>/g, "\n");
      // Extract text content
      let text = marked.replace(/<[^>]+>/g, "");
      
      // Decode XML entities
      text = decodeXmlEntities(text);
      
      // Clean up excessive whitespace but preserve paragraph breaks
      text = text.replace(/[ \t]+/g, " "); // Multiple spaces/tabs to single space
      text = text.replace(/\n[ \t]+/g, "\n"); // Remove leading whitespace on lines
      text = text.replace(/[ \t]+\n/g, "\n"); // Remove trailing whitespace on lines
      text = text.replace(/\n{3,}/g, "\n\n"); // Max 2 consecutive newlines
      text = text.trim();

      if (!text) {
        throw new Error("This DOCX file appears to be empty or contains only formatting. Please check the document content.");
      }

      return { text };
    } catch (fallbackError: any) {
      // If both methods fail, provide helpful error message
      if (fallbackError.message?.includes("empty")) {
        throw fallbackError;
      }
      
      throw new Error(
        "We could not extract text from this DOCX file. This might happen if the file is corrupted, password-protected, or uses an unsupported format. " +
        "Please try: 1) Re-saving the file from your word processor, 2) Converting to PDF first, or 3) Using a plain text (.txt) file instead."
      );
    }
  }
}

// Helper function to decode XML entities
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}