import React from "react";
import { createServerClient } from "@/src/lib/supabaseServer";
import { notFound, redirect } from "next/navigation";
import ReviewClient from "./ReviewClient";
import "./ReviewPage.css";

export const metadata = { title: "Review Session | Adaptaly" };

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  const supabase = await createServerClient();

  // Get user for auth check
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) {
    redirect("/signin");
  }

  // Get document with flashcards (RLS will ensure user access)
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select(`
      id,
      title,
      status,
      created_at,
      flashcards (
        id,
        question,
        answer,
        hint,
        order_index,
        topic
      )
    `)
    .eq("id", id)
    .single();

  if (docErr || !doc) {
    notFound();
  }

  // If not ready, redirect to processing
  if (doc.status !== "ready") {
    redirect(`/upload/process/${id}`);
  }

  // Get flashcards and sort by order
  const flashcards = doc.flashcards?.sort((a, b) => a.order_index - b.order_index) || [];

  if (flashcards.length === 0) {
    redirect(`/upload/result/${id}`);
  }

  // Get existing card progress for this user/document
  const { data: cardProgress } = await supabase
    .from("cards")
    .select("flashcard_id, mastered, due_at, ease_factor, interval_days")
    .eq("user_id", user.id)
    .eq("document_id", id);

  // Get recent review performance for adaptive algorithm
  const { data: recentReviews } = await supabase
    .from("reviews")
    .select("card_id, correct, confidence, response_time, created_at")
    .eq("user_id", user.id)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <ReviewClient 
      documentId={id}
      documentTitle={doc.title}
      flashcards={flashcards}
      cardProgress={cardProgress || []}
      recentReviews={recentReviews || []}
      userId={user.id}
    />
  );
}