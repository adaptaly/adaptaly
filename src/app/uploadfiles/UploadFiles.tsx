"use client";

import {
  FunctionComponent,
  useState,
  useRef,
  DragEvent,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import "./UploadFiles.css";

type Flashcard = { question: string; answer: string };
type SummarizeResponse = {
  summary: string;
  flashcards?: Flashcard[];
  filename?: string;
  error?: string;
};

interface FileData {
  file: File;
  id: string;
}

interface Message {
  text: string;
  type: "error" | "success" | "warning";
}

/** ---- Storage keys (used by Loading + Result pages) ---- */
const STORAGE = {
  summary: "adaptaly:summary",
  flashcards: "adaptaly:flashcards",
  meta: "adaptaly:meta",
  status: "adaptaly:status", // "pending" | "done" | "error"
  error: "adaptaly:error",
} as const;

/** ---- Client-side rules (aligned to server) ---- */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".txt", ".md", ".pdf", ".docx"];

/* Sanitize long/HTML errors into a short readable message */
function sanitizeError(raw: string, status?: number): string {
  if (!raw) return status ? `Server error (${status}).` : "Server error.";
  const noTags = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const trimmed = noTags.slice(0, 300);
  const suffix = noTags.length > 300 ? " …" : "";
  return status ? `${trimmed}${suffix} (HTTP ${status})` : `${trimmed}${suffix}`;
}

const UploadFiles: FunctionComponent = () => {
  const [file, setFile] = useState<FileData | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showMessage = (text: string, type: Message["type"]) => {
    setMessage({ text, type });
    // Keep visible longer so it can be read
    setTimeout(() => setMessage(null), 7000);
  };

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_SIZE)
      return `“${f.name}” is too large. Max size is 10 MB.`;
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return `“${f.name}” is not supported. Use TXT, MD, PDF, or DOCX.`;
    }
    return null;
  };

  // ---------- robust upload flow ----------
  async function startSummarize(fd: FormData, filename: string) {
    try {
      const res = await fetch("/api/summarize", { method: "POST", body: fd });

      if (!res.ok) {
        // Pull best message (JSON first, else text), then sanitize
        let msg = "";
        try {
          const maybeJson = await res.clone().json();
          msg = (maybeJson?.error as string) || "";
        } catch {
          msg = await res.text().catch(() => "");
        }

        if (res.status === 413) {
          throw new Error("File too large for the server (max 10 MB).");
        }
        if (res.status === 422) {
          throw new Error(msg || "We couldn’t read text from that file.");
        }
        throw new Error(sanitizeError(msg, res.status));
      }

      const data = (await res.json()) as SummarizeResponse;

      localStorage.setItem(STORAGE.summary, data.summary ?? "");
      localStorage.setItem(
        STORAGE.flashcards,
        JSON.stringify(data.flashcards ?? [])
      );
      localStorage.setItem(
        STORAGE.meta,
        JSON.stringify({
          filename,
          processedAtISO: new Date().toISOString(),
        })
      );
      localStorage.setItem(STORAGE.status, "done");
    } catch (e: any) {
      const friendly = sanitizeError(e?.message || "Unexpected error.");
      localStorage.setItem(STORAGE.error, friendly);
      localStorage.setItem(STORAGE.status, "error");
    }
  }

  function beginUpload(fd: FormData, filename: string) {
    // Clear previous run so Loading doesn't redirect early
    localStorage.removeItem(STORAGE.summary);
    localStorage.removeItem(STORAGE.flashcards);
    localStorage.removeItem(STORAGE.meta);
    localStorage.removeItem(STORAGE.error);
    localStorage.setItem(STORAGE.status, "pending");

    // Fire-and-forget; the Loading page polls and redirects
    void startSummarize(fd, filename);
    router.push("/loadingpage");
  }
  // ----------------------------------------

  const processFiles = async (fileList: FileList) => {
    if (fileList.length === 0) return;
    const selectedFile = fileList[0];

    const error = validateFile(selectedFile);
    if (error) return showMessage(error, "error");

    const fileData: FileData = {
      file: selectedFile,
      id:
        Date.now().toString() +
        Math.random().toString(36).substring(2, 11),
    };

    setFile(fileData);
    showMessage(`“${selectedFile.name}” selected.`, "success");

    // Start upload + analysis immediately
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", selectedFile);
    beginUpload(fd, selectedFile.name);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div className="uploadfiles">
      <div className="upload-your-notes-parent">
        <b className="upload-your-notes">Upload your Notes</b>

        <div
          className={`drag-or-drop-your-files-parent ${
            isDragOver ? "drag-over" : ""
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleUploadButtonClick}
        >
          <b className="drag-or-drop">
            {isUploading ? "Uploading..." : "Drag or Drop your files"}
          </b>
          <b className="or">Or</b>

          <div className="upload-files-wrapper">
            <b className="upload-files">
              {isUploading ? "Uploading..." : "Upload files"}
            </b>
            <input
              ref={fileInputRef}
              type="file"
              className="file-input"
              accept=".txt,.md,.pdf,.docx"
              onChange={handleFileInputChange}
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <>
              <div className="upload-progress">
                <div className="progress-bar" style={{ width: "100%" }} />
              </div>
              <div className="uploading-text">Starting analysis…</div>
            </>
          )}
        </div>

        {/* Updated caps to match server */}
        <b className="max-size-300">Max size: 10 MB</b>
        <b className="supported-file-types">Supported: TXT, MD, PDF, DOCX</b>

        {message && (
          <div className={`message ${message.type}-message`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadFiles;