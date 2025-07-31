"use client";

import { FunctionComponent, useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import "./UploadFiles.css";

interface FileData {
  file: File;
  id: string;
}

interface Message {
  text: string;
  type: "error" | "success" | "warning";
}

const UploadFiles: FunctionComponent = () => {
  const [file, setFile] = useState<FileData | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const MAX_FILE_SIZE = 300 * 1024 * 1024;
  const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
  const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

  const showMessage = (text: string, type: Message["type"]) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return `File "${file.name}" is too large. Maximum size is 300MB.`;
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return `File "${file.name}" is not supported. Use PDF, DOCX, or TXT.`;
    }
    return null;
  };

  const processFiles = async (fileList: FileList) => {
    if (fileList.length === 0) return;
    const selectedFile = fileList[0];
    const error = validateFile(selectedFile);
    if (error) return showMessage(error, "error");

    const fileData: FileData = {
      file: selectedFile,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };

    setFile(fileData);
    showMessage(`File "${selectedFile.name}" selected!`, "success");

    // ✅ Immediately start upload
    handleUpload(fileData);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); };
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
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleUpload = async (fileData?: FileData) => {
    const targetFile = fileData || file;
    if (!targetFile) return showMessage("Please select a file.", "warning");

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", targetFile.file);

      console.log("📤 Uploading file:", targetFile.file.name, "size:", targetFile.file.size);

      router.push("/loadingpage");

      const res = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Server error:", res.status);
        showMessage("Upload failed. Server error.", "error");
        setIsUploading(false);
        return;
      }

      const data = await res.json();
      console.log("✅ Summary:", data.summary);
    } catch (error) {
      console.error(error);
      showMessage("Upload failed. Try again.", "error");
      setIsUploading(false);
    }
  };

  return (
    <div className="uploadfiles">
      <div className="upload-your-notes-parent">
        <b className="upload-your-notes">Upload your Notes</b>
        <div
          className={`drag-or-drop-your-files-parent ${isDragOver ? "drag-over" : ""}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <b className="drag-or-drop">{isUploading ? "Uploading..." : "Drag or Drop your files"}</b>
          <b className="or">Or</b>
          <div className="upload-files-wrapper" onClick={handleUploadButtonClick}>
            <b className="upload-files">{isUploading ? "Uploading..." : "Upload files"}</b>
            <input
              ref={fileInputRef}
              type="file"
              className="file-input"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInputChange}
              disabled={isUploading}
            />
          </div>
        </div>
        <b className="max-size-300">Max size: 300 MB</b>
        <b className="supported-file-types">Supported: PDF, DOCX, TXT</b>
        {message && <div className={`message ${message.type}-message`}>{message.text}</div>}
      </div>
    </div>
  );
};

export default UploadFiles;