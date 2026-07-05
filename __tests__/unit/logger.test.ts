import { describe, it, expect } from "vitest";
import { redactPhone, redactName, redactPII } from "@/lib/logger";

describe("logger — redaction PII (RGPD)", () => {
  describe("redactPhone", () => {
    it("ne garde que les 2 derniers chiffres", () => {
      expect(redactPhone("+33612345678")).toBe("***78");
      expect(redactPhone("06 12 34 56 78")).toBe("***78");
    });

    it("gère les valeurs vides ou trop courtes", () => {
      expect(redactPhone("")).toBe("");
      expect(redactPhone(null)).toBe("");
      expect(redactPhone(undefined)).toBe("");
      expect(redactPhone("7")).toBe("***");
    });
  });

  describe("redactName", () => {
    it("ne garde que l'initiale", () => {
      expect(redactName("Jean Dupont")).toBe("J***");
      expect(redactName("  alice  ")).toBe("a***");
    });

    it("gère les valeurs vides", () => {
      expect(redactName("")).toBe("");
      expect(redactName(null)).toBe("");
    });
  });

  describe("redactPII", () => {
    it("masque les champs PII et conserve les autres", () => {
      const out = redactPII({
        restaurant_id: "resto-1",
        customer_name: "Jean Dupont",
        customer_phone: "+33612345678",
        customer_email: "jean@example.com",
        number_of_guests: 4,
        date: "2026-07-05",
      });

      expect(out).toEqual({
        restaurant_id: "resto-1",
        customer_name: "J***",
        customer_phone: "***78",
        customer_email: "[email]",
        number_of_guests: 4,
        date: "2026-07-05",
      });
    });

    it("masque récursivement les objets imbriqués", () => {
      const out = redactPII({
        call: { id: "call-1" },
        payload: { customer_phone: "+33698765432" },
      });
      expect(out).toEqual({
        call: { id: "call-1" },
        payload: { customer_phone: "***32" },
      });
    });

    it("ne mute pas l'objet d'origine", () => {
      const original = { customer_phone: "+33612345678" };
      redactPII(original);
      expect(original.customer_phone).toBe("+33612345678");
    });

    it("gère null et undefined", () => {
      expect(redactPII(null)).toBeNull();
      expect(redactPII(undefined)).toBeUndefined();
    });
  });
});
