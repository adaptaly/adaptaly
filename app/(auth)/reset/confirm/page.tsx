// app/(auth)/reset/confirm/page.tsx
import { Suspense } from "react";
import ConfirmClient from "./ConfirmClient";
import "./confirm.css";

// These must be exported from a Server Component to take effect
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="confirm-wrap">
          <section className="confirm-card">
            <div className="confirm-loading">Loading…</div>
          </section>
        </main>
      }
    >
      <ConfirmClient />
    </Suspense>
  );
}