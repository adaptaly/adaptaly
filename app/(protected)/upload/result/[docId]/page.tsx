import React from "react";
import { createServerClient } from "@/src/lib/supabaseServer";
import { notFound, redirect } from "next/navigation";
import ResultClient from "./ResultClient";
import "./result.css";

export const metadata = { title: "Study Pack | Adaptaly" };

interface ResultPageProps {
  params: Promise<{ docId: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { docId } = await params;
  
  if (!docId) {
    notFound();
  }

  const supabase = await createServerClient();

  // Get document with summary and flashcards (RLS will ensure user access)
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select(`
      id,
      filename,
      status,
      created_at,
      summaries (
        id,
        content,
        word_count
      ),
      flashcards (
        id,
        question,
        answer,
        hint,
        order_index
      )
    `)
    .eq("id", docId)
    .single();

  if (docErr || !doc) {
    notFound();
  }

  // If not ready, redirect to processing
  if (doc.status !== "ready") {
    redirect(`/upload/process/${docId}`);
  }

  // Get summary and flashcards
  const summary = doc.summaries?.[0];
  const flashcards = doc.flashcards?.sort((a, b) => a.order_index - b.order_index) || [];

  // If no summary exists, generate it
  if (!summary) {
    redirect(`/upload/process/${docId}`);
  }

  return (
    <ResultClient 
      documentId={docId}
      filename={doc.filename}
      summary={summary}
      flashcards={flashcards}
      createdAt={doc.created_at}
    />
  );
}