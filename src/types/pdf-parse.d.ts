// New
// src/types/pdf-parse.d.ts
declare module "pdf-parse" {
    export interface PDFParseResult {
      numpages: number;
      numrender: number;
      info?: Record<string, unknown>;
      metadata?: unknown;
      version?: string;
      text: string;
    }
  
    // Default export is a function
    // Usage: const data = await pdf(buffer, options?)
    function pdf(buffer: Buffer | Uint8Array, options?: any): Promise<PDFParseResult>;
    export default pdf;
  }  