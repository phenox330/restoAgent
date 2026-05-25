/**
 * Récupère le numéro E.164 d'un numéro Vapi à partir de son ID.
 * Server-only (utilise VAPI_PRIVATE_KEY). Retourne null si indisponible.
 */
export async function getVapiPhoneNumber(
  phoneNumberId: string
): Promise<string | null> {
  const key = process.env.VAPI_PRIVATE_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://api.vapi.ai/phone-number/${phoneNumberId}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.number ?? null;
  } catch {
    return null;
  }
}
