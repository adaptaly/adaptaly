import React from "react";
import ProcessClient from "./ProcessClient";
import { createServerClient } from "@/src/lib/supabaseServer";
import { notFound, redirect } from "next/navigation";

export const metadata = { title: "Processing | Adaptaly" };

interface ProcessPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProcessPage({ params }: ProcessPageProps) {
  const { id: documentId } = await params;
  
  if (!documentId) {
    notFound();
  }

  const supabase = await createServerClient();

  // Check document exists (RLS will ensure user access)
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("id,filename,status,error_message")
    .eq("id", documentId)
    .single();

  if (docErr || !doc) {
    notFound();
  }

  // If already ready, redirect to results
  if (doc.status === "ready") {
    redirect(`/upload/result/${documentId}`);
  }

  return (
    <div className="process-page" data-page="process">
      <ProcessClient 
        documentId={documentId}
        initialStatus={doc.status}
        filename={doc.filename}
        errorMessage={doc.error_message}
      />
    </div>
  );
}