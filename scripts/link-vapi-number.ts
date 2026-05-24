/**
 * Lie un restaurant à un numéro Vapi (routing multi-tenant).
 *
 * Usage:
 *   npx tsx scripts/link-vapi-number.ts                              # liste restos + numéros Vapi
 *   npx tsx scripts/link-vapi-number.ts <restaurant_id> <phone_number_id>
 *
 * Le phone_number_id est l'ID du numéro côté Vapi (pas le numéro E.164).
 * Une fois lié, les appels entrants sur ce numéro routent vers ce restaurant.
 */

const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listMode() {
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, vapi_phone_number_id")
    .order("created_at", { ascending: true });

  console.log("🏪 Restaurants:\n");
  (restaurants || []).forEach((r) => {
    console.log(`   ${r.name} (${r.id})`);
    console.log(`      vapi_phone_number_id: ${r.vapi_phone_number_id || "— non lié —"}\n`);
  });

  const key = process.env.VAPI_PRIVATE_KEY;
  if (key) {
    const res = await fetch("https://api.vapi.ai/phone-number", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const numbers = await res.json();
    if (Array.isArray(numbers)) {
      console.log("📞 Numéros Vapi:\n");
      numbers.forEach((n: any) => {
        console.log(`   ${n.number || n.sipUri || "(sans numéro)"} → id: ${n.id} (${n.name || "-"})`);
      });
    }
  }

  console.log("\n💡 Pour lier: npx tsx scripts/link-vapi-number.ts <restaurant_id> <phone_number_id>");
}

async function linkMode(restaurantId: string, phoneNumberId: string) {
  const { data, error } = await supabase
    .from("restaurants")
    .update({ vapi_phone_number_id: phoneNumberId })
    .eq("id", restaurantId)
    .select("id, name, vapi_phone_number_id")
    .single();

  if (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }

  console.log(`✅ ${data.name} lié au numéro Vapi ${data.vapi_phone_number_id}`);
}

const [restaurantId, phoneNumberId] = process.argv.slice(2);

if (!restaurantId || !phoneNumberId) {
  listMode().catch(console.error);
} else {
  linkMode(restaurantId, phoneNumberId).catch(console.error);
}
