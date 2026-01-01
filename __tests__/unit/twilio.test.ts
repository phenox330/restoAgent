/**
 * Tests unitaires pour lib/sms/twilio.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch avant import
let mockFetch: ReturnType<typeof vi.fn>;

describe("twilio.ts", () => {
  beforeEach(() => {
    // Setup mock fetch
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ sid: "SM123456789" }),
    });
    global.fetch = mockFetch;
    
    // Ensure env vars are set
    process.env.TWILIO_ACCOUNT_SID = "ACtest123456789";
    process.env.TWILIO_AUTH_TOKEN = "test-auth-token";
    process.env.TWILIO_PHONE_NUMBER = "+33123456789";
    process.env.NEXT_PUBLIC_APP_URL = "https://test-app.vercel.app";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Import dynamiquement pour avoir les env vars à jour
  async function importTwilio() {
    // Force reimport
    vi.resetModules();
    return await import("@/lib/sms/twilio");
  }

  describe("sendConfirmationSMS", () => {
    it("should send SMS successfully with correct parameters", async () => {
      const { sendConfirmationSMS } = await importTwilio();

      const result = await sendConfirmationSMS({
        phone: "+33612345678",
        customerName: "Jean Dupont",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15",
        time: "19:30",
        guests: 4,
        cancellationToken: "token-abc123",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("SM123456789");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should format phone number correctly (0X to +33X)", async () => {
      const { sendConfirmationSMS } = await importTwilio();

      await sendConfirmationSMS({
        phone: "0612345678", // Format français sans indicatif
        customerName: "Jean Dupont",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15",
        time: "19:30",
        guests: 4,
        cancellationToken: "token-abc123",
      });

      // Vérifier que le numéro est converti en E.164
      const callBody = mockFetch.mock.calls[0][1].body;
      expect(callBody).toContain("To=%2B33612345678"); // URL encoded +33612345678
    });

    it("should include cancellation link in message", async () => {
      const { sendConfirmationSMS } = await importTwilio();

      await sendConfirmationSMS({
        phone: "+33612345678",
        customerName: "Jean Dupont",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15",
        time: "19:30",
        guests: 4,
        cancellationToken: "token-abc123",
      });

      const callBody = mockFetch.mock.calls[0][1].body;
      // URL encoded version of cancel link
      expect(callBody).toContain("cancel%2Ftoken-abc123");
    });

    it("should return error when Twilio is not configured", async () => {
      // Remove Twilio config
      delete process.env.TWILIO_ACCOUNT_SID;
      
      const { sendConfirmationSMS } = await importTwilio();

      const result = await sendConfirmationSMS({
        phone: "+33612345678",
        customerName: "Jean Dupont",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15",
        time: "19:30",
        guests: 4,
        cancellationToken: "token-abc123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("non configuré");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle Twilio API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Invalid phone number" }),
      });

      const { sendConfirmationSMS } = await importTwilio();

      const result = await sendConfirmationSMS({
        phone: "invalid",
        customerName: "Jean Dupont",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15",
        time: "19:30",
        guests: 4,
        cancellationToken: "token-abc123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should format date in French", async () => {
      const { sendConfirmationSMS } = await importTwilio();

      await sendConfirmationSMS({
        phone: "+33612345678",
        customerName: "Jean Dupont",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15", // Mercredi 15 janvier
        time: "19:30",
        guests: 4,
        cancellationToken: "token-abc123",
      });

      const callBody = mockFetch.mock.calls[0][1].body;
      // Should contain French date format
      expect(callBody).toContain("mer"); // mercredi
      expect(callBody).toContain("jan"); // janvier
    });
  });

  describe("sendReminderSMS", () => {
    it("should send reminder SMS successfully", async () => {
      const { sendReminderSMS } = await importTwilio();

      const result = await sendReminderSMS({
        phone: "+33612345678",
        customerName: "Jean Dupont",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15",
        time: "19:30",
        guests: 4,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("SM123456789");
    });

    it("should include 'Rappel' in message", async () => {
      const { sendReminderSMS } = await importTwilio();

      await sendReminderSMS({
        phone: "+33612345678",
        customerName: "Jean Dupont",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15",
        time: "19:30",
        guests: 4,
      });

      const callBody = mockFetch.mock.calls[0][1].body;
      expect(callBody).toContain("Rappel");
    });
  });

  describe("sendCancellationConfirmationSMS", () => {
    it("should send cancellation confirmation SMS successfully", async () => {
      const { sendCancellationConfirmationSMS } = await importTwilio();

      const result = await sendCancellationConfirmationSMS({
        phone: "+33612345678",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15",
        time: "19:30",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("SM123456789");
    });

    it("should include 'annulée' in message", async () => {
      const { sendCancellationConfirmationSMS } = await importTwilio();

      await sendCancellationConfirmationSMS({
        phone: "+33612345678",
        restaurantName: "Restaurant Épicurie",
        date: "2025-01-15",
        time: "19:30",
      });

      const callBody = mockFetch.mock.calls[0][1].body;
      // URL encoded "annulée"
      expect(callBody).toContain("annul");
    });
  });
});




