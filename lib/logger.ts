/**
 * Redaction des données personnelles (RGPD) avant tout log.
 *
 * Les logs (stdout Vercel, error-logger) ne doivent jamais contenir de PII en
 * clair : numéros de téléphone, noms, emails. Ces helpers masquent ces champs
 * tout en gardant les logs exploitables pour le debug.
 */

// Clés considérées comme PII dans les objets d'arguments loggés.
const PHONE_KEYS = new Set([
  "customer_phone",
  "customerPhone",
  "phone",
  "toNumber",
  "to",
]);
const NAME_KEYS = new Set(["customer_name", "customerName"]);
const EMAIL_KEYS = new Set(["customer_email", "customerEmail", "email"]);

/**
 * Masque un numéro de téléphone en ne gardant que les 2 derniers chiffres.
 * Ex. "+33612345678" -> "***78".
 */
export function redactPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 2) return "***";
  return `***${digits.slice(-2)}`;
}

/**
 * Masque un nom en ne gardant que l'initiale. Ex. "Jean Dupont" -> "J***".
 */
export function redactName(name: string | null | undefined): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  return `${trimmed[0]}***`;
}

/**
 * Renvoie une copie de `value` avec les champs PII masqués, récursivement.
 * Les autres champs (restaurant_id, date, statut…) sont conservés tels quels.
 * À utiliser sur tout objet d'arguments avant de le logger.
 */
export function redactPII<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactPII(item)) as unknown as T;
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === "string" && PHONE_KEYS.has(key)) {
        out[key] = redactPhone(val);
      } else if (typeof val === "string" && NAME_KEYS.has(key)) {
        out[key] = redactName(val);
      } else if (typeof val === "string" && EMAIL_KEYS.has(key)) {
        out[key] = "[email]";
      } else {
        out[key] = redactPII(val);
      }
    }
    return out as T;
  }

  return value;
}
