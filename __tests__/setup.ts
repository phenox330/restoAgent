/**
 * Setup global pour les tests Vitest
 * Configure les mocks et variables d'environnement
 */

import { beforeAll, afterAll, afterEach, vi } from "vitest";

// Variables d'environnement de test
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.TWILIO_ACCOUNT_SID = "ACtest123456789";
process.env.TWILIO_AUTH_TOKEN = "test-auth-token";
process.env.TWILIO_PHONE_NUMBER = "+33123456789";
process.env.NEXT_PUBLIC_APP_URL = "https://test-app.vercel.app";
process.env.VAPI_PRIVATE_KEY = "test-vapi-key";

// Mock global fetch pour les tests
const originalFetch = global.fetch;

beforeAll(() => {
  // Reset des mocks avant tous les tests
  vi.clearAllMocks();
});

afterEach(() => {
  // Reset des mocks après chaque test
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

afterAll(() => {
  // Restaurer fetch original après tous les tests
  global.fetch = originalFetch;
});

// Helper pour créer un mock de réponse fetch
export function createMockFetchResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

// Helper pour mocker fetch globalement
export function mockFetch(responses: Map<string, Response> | ((url: string) => Response)) {
  global.fetch = vi.fn((url: string | URL | Request) => {
    const urlStr = url.toString();
    if (responses instanceof Map) {
      return Promise.resolve(responses.get(urlStr) || createMockFetchResponse({ error: "Not found" }, false, 404));
    }
    return Promise.resolve(responses(urlStr));
  }) as any;
}




