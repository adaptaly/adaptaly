import React from "react";
import "./upload.css";
import Dropzone from "./_components/Dropzone";
import InfoChips from "./_components/InfoChips";
import UploadHeader from "./_components/UploadHeader";

export const metadata = { title: "Upload | Adaptaly" };

export default function UploadPage() {
  return (
    <div className="up-page" data-page="upload">
      <UploadHeader />
      <main className="up-main">
        <Dropzone />
        <InfoChips />
      </main>
    </div>
  );
}