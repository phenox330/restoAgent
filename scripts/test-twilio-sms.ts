/**
 * Script de test pour l'envoi de SMS Twilio
 * 
 * Usage: npx tsx scripts/test-twilio-sms.ts
 * 
 * Prérequis:
 * - Variables d'environnement configurées dans .env.local
 * - Numéro de destination vérifié dans Twilio (si numéro de test)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Numéro de test - CHANGEZ CECI avec un numéro vérifié dans votre compte Twilio
const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || "+33612345678";

async function testSMS() {
  console.log("🧪 Test d'envoi SMS Twilio\n");

  // Vérifier la configuration
  console.log("📋 Configuration:");
  console.log(`   TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID ? "✅ Configuré" : "❌ Manquant"}`);
  console.log(`   TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN ? "✅ Configuré" : "❌ Manquant"}`);
  console.log(`   TWILIO_PHONE_NUMBER: ${TWILIO_PHONE_NUMBER || "❌ Manquant"}`);
  console.log(`   TEST_PHONE_NUMBER: ${TEST_PHONE_NUMBER}\n`);

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error("❌ Configuration Twilio incomplète. Vérifiez votre fichier .env.local");
    process.exit(1);
  }

  // Message de test
  const testMessage = `[TEST RestoAgent] 🧪
Ceci est un SMS de test envoyé le ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}.
Si vous recevez ce message, Twilio est correctement configuré !`;

  console.log("📱 Envoi du SMS de test...");
  console.log(`   De: ${TWILIO_PHONE_NUMBER}`);
  console.log(`   Vers: ${TEST_PHONE_NUMBER}`);
  console.log(`   Message: ${testMessage}\n`);

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: TEST_PHONE_NUMBER,
        Body: testMessage,
      }).toString(),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ SMS envoyé avec succès !");
      console.log(`   Message SID: ${data.sid}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Date d'envoi: ${data.date_created}`);
    } else {
      console.error("❌ Erreur Twilio:");
      console.error(`   Code: ${data.code}`);
      console.error(`   Message: ${data.message}`);
      
      if (data.code === 21608) {
        console.log("\n💡 Conseil: Ce numéro n'est pas vérifié dans votre compte Twilio.");
        console.log("   Avec un compte de test, vous ne pouvez envoyer qu'aux numéros vérifiés.");
        console.log("   → Dashboard Twilio → Phone Numbers → Verified Caller IDs");
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi:", error);
  }
}

// Types de SMS disponibles
async function testAllSMSTypes() {
  console.log("\n" + "=".repeat(60));
  console.log("📧 Test des différents types de SMS\n");

  const restaurantName = "L'Épicurie (Test)";
  const customerName = "Jean Test";
  const date = new Date();
  date.setDate(date.getDate() + 1); // Demain
  const dateStr = date.toISOString().split("T")[0];
  const time = "20:00";
  const guests = 4;
  const cancellationToken = "test-token-12345";

  // 1. SMS de confirmation
  console.log("1️⃣ SMS de Confirmation:");
  const confirmationMsg = 
    `${restaurantName}: Réservation confirmée!\n` +
    `${formatDateFr(dateStr)} à ${time}\n` +
    `${guests} pers.\n` +
    `Annuler: https://restoagent.app/cancel/${cancellationToken}`;
  console.log(`   ${confirmationMsg.replace(/\n/g, "\n   ")}\n`);

  // 2. SMS de rappel
  console.log("2️⃣ SMS de Rappel:");
  const reminderMsg = 
    `Rappel ${restaurantName}\n` +
    `Réservation demain ${formatDateFr(dateStr)} à ${time}\n` +
    `${guests} personnes\n` +
    `À bientôt!`;
  console.log(`   ${reminderMsg.replace(/\n/g, "\n   ")}\n`);

  // 3. SMS d'annulation
  console.log("3️⃣ SMS d'Annulation:");
  const cancellationMsg = 
    `${restaurantName}\n` +
    `Votre réservation du ${formatDateFr(dateStr)} à ${time} a été annulée.\n` +
    `À bientôt!`;
  console.log(`   ${cancellationMsg.replace(/\n/g, "\n   ")}\n`);
}

function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr);
  const jours = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  const mois = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];
  return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]}`;
}

// Exécution
console.log("=".repeat(60));
console.log("🍽️  RestoAgent - Test Twilio SMS");
console.log("=".repeat(60) + "\n");

testSMS()
  .then(() => testAllSMSTypes())
  .catch(console.error);



