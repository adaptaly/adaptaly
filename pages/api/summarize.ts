import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import fs from "fs";

// Disable Next.js default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to extract text based on extension
async function extractTextFromFile(filePath: string, originalFilename: string) {
  const ext = originalFilename.split('.').pop()?.toLowerCase();
  if (ext === "pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text.trim();
  } else if (ext === "docx") {
    const buffer = fs.readFileSync(filePath);
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  } else if (ext === "txt") {
    const value = fs.readFileSync(filePath, "utf8");
    return value.trim();
  }
  throw new Error("Unsupported file type");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) {
        console.error("Formidable error:", err);
        return res.status(500).json({ error: "Form parse error" });
      }
      const fileObj: any = files.file;
      if (!fileObj) return res.status(400).json({ error: "No file received" });

      const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
      if (!file.filepath || !file.originalFilename) return res.status(400).json({ error: "File path or name not found" });

      // Extract text depending on file type
      const extractedText = await extractTextFromFile(file.filepath, file.originalFilename);

      if (!extractedText) return res.status(400).json({ error: "No text found in file" });

      console.log("✅ Extracted characters:", extractedText.length);

      // Summarize with OpenAI/AIMLAPI
      const client = new OpenAI({
        apiKey: process.env.AIMLAPI_KEY,
        baseURL: "https://api.aimlapi.com/v1",
      });

      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: `Summarize this document in under 200 words:\n\n${extractedText}` },
        ],
        temperature: 0.2,
        max_tokens: 512,
      });

      const summary = completion.choices[0].message.content;
      res.status(200).json({ summary });
    } catch (err: any) {
      console.error("API Error:", err);
      res.status(500).json({ error: err.message || "Server error" });
    }
  });
}