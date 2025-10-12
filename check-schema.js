import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: join(__dirname, ".env.local") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function checkSchema() {
  console.log("Checking waitlist_subscribers table...");
  const { data: subscribers, error: subError } = await supabase
    .from("waitlist_subscribers")
    .select("*")
    .limit(1);

  if (subError) {
    console.error("❌ waitlist_subscribers error:", subError.message);
  } else {
    console.log("✓ waitlist_subscribers exists");
    if (subscribers && subscribers.length > 0) {
      console.log("  Columns:", Object.keys(subscribers[0]));
    }
  }

  console.log("\nChecking waitlist_pending_consents table...");
  const { data: pending, error: pendError } = await supabase
    .from("waitlist_pending_consents")
    .select("*")
    .limit(1);

  if (pendError) {
    console.error("❌ waitlist_pending_consents error:", pendError.message);
  } else {
    console.log("✓ waitlist_pending_consents exists");
    if (pending && pending.length > 0) {
      console.log("  Columns:", Object.keys(pending[0]));
    }
  }

  console.log("\nChecking pending consents data...");
  const { data: allPending, error: allError } = await supabase
    .from("waitlist_pending_consents")
    .select("token, child_email, parent_email, created_at");

  if (allError) {
    console.error("❌ Error:", allError.message);
  } else {
    console.log(`Found ${allPending.length} pending consent(s):`);
    allPending.forEach((p, i) => {
      console.log(`  ${i + 1}. Token: ${p.token.substring(0, 8)}... Child: ${p.child_email}, Parent: ${p.parent_email}`);
    });
  }
}

checkSchema().catch(console.error);
