/**
 * Mock de l'API Twilio pour les tests
 */

import { vi } from "vitest";

/**
 * Réponse Twilio de succès
 */
export const mockTwilioSuccessResponse = {
  sid: "SM" + "x".repeat(32),
  status: "queued",
  to: "+33612345678",
  from: "+33123456789",
  body: "Test message",
  date_created: new Date().toISOString(),
};

/**
 * Réponse Twilio d'erreur
 */
export const mockTwilioErrorResponse = {
  code: 21211,
  message: "The 'To' number is not a valid phone number.",
  status: 400,
};

/**
 * Crée un mock de fetch pour Twilio
 */
export function createTwilioFetchMock(success = true) {
  return vi.fn().mockImplementation((url: string) => {
    // Vérifier que c'est bien l'URL Twilio
    if (url.includes("api.twilio.com")) {
      if (success) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockTwilioSuccessResponse),
        });
      } else {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve(mockTwilioErrorResponse),
        });
      }
    }
    
    // Pour les autres URLs, retourner une erreur
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    });
  });
}

/**
 * Setup global du mock Twilio
 */
export function setupTwilioMock(success = true) {
  const mockFetch = createTwilioFetchMock(success);
  global.fetch = mockFetch as any;
  return mockFetch;
}

/**
 * Vérifie que le SMS a été envoyé avec les bons paramètres
 */
export function expectSMSSent(mockFetch: ReturnType<typeof vi.fn>, expectedParams: {
  to?: string;
  body?: RegExp | string;
}) {
  expect(mockFetch).toHaveBeenCalled();
  
  const calls = mockFetch.mock.calls;
  const twilioCall = calls.find(call => call[0].includes("api.twilio.com"));
  
  expect(twilioCall).toBeDefined();
  
  if (expectedParams.to) {
    const body = twilioCall[1]?.body;
    expect(body).toContain(`To=${encodeURIComponent(expectedParams.to)}`);
  }
  
  if (expectedParams.body) {
    const body = twilioCall[1]?.body;
    if (typeof expectedParams.body === "string") {
      expect(body).toContain(expectedParams.body);
    } else {
      expect(body).toMatch(expectedParams.body);
    }
  }
}

/**
 * Vérifie qu'aucun SMS n'a été envoyé
 */
export function expectNoSMSSent(mockFetch: ReturnType<typeof vi.fn>) {
  const calls = mockFetch.mock.calls;
  const twilioCall = calls.find(call => call[0].includes("api.twilio.com"));
  expect(twilioCall).toBeUndefined();
}




