import React from "react";
import { createServerClient } from "@/src/lib/supabaseServer";
import { redirect } from "next/navigation";
import ReviewSelectClient from "./ReviewSelectClient";
import "./review-select.css";

export const metadata = { title: "Review | Adaptaly" };

export default async function ReviewPage() {
  const supabase = await createServerClient();

  // Get user for auth check
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) {
    redirect("/signin");
  }

  // Get user's documents with flashcards
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      id,
      title,
      status,
      created_at,
      total_cards,
      flashcards (
        id
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  // Get card progress for due cards count
  const { data: cardProgress } = await supabase
    .from("cards")
    .select("document_id, mastered, due_at")
    .eq("user_id", user.id)
    .eq("mastered", false)
    .lte("due_at", new Date().toISOString());

  // Calculate due counts per document
  const progressMap = new Map<string, number>();
  cardProgress?.forEach(card => {
    const count = progressMap.get(card.document_id) || 0;
    progressMap.set(card.document_id, count + 1);
  });

  const documentsWithDue = (documents || []).map(doc => ({
    ...doc,
    flashcardCount: doc.flashcards?.length || 0,
    dueCount: progressMap.get(doc.id) || 0
  }));

  return (
    <ReviewSelectClient 
      documents={documentsWithDue}
      userId={user.id}
    />
  );
}