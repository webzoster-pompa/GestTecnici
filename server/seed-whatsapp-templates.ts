/**
 * Script per popolare template WhatsApp
 */

import { seedWhatsAppTemplates } from "./whatsapp-templates";

async function main() {
  console.log("[Seed] Starting WhatsApp templates seed...");
  await seedWhatsAppTemplates();
  console.log("[Seed] Completed!");
  process.exit(0);
}

main().catch((error) => {
  console.error("[Seed] Error:", error);
  process.exit(1);
});
