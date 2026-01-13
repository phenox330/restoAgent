# Story 1.9: Webhook Security Validation

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.9
**Priority:** High
**Estimated Effort:** 2 hours

---

## User Story

As a system administrator,
I want all webhook requests validated before processing,
So that malicious actors cannot inject false reservations.

---

## Story Context

**Existing System Integration:**
- Integrates with: `/app/api/webhooks/vapi/route.ts` webhook handler
- Technology: Next.js API Routes, HTTP header validation
- Follows pattern: Middleware-style validation before business logic (may already exist in `/lib/vapi/webhook-verification.ts`)
- Touch points: Webhook entry point, all tool function executions

**Current Behavior:**
Webhook may have basic security or may need enhancement to ensure validation occurs BEFORE any database operations.

**Target Behavior:**
All webhook requests verified via `x-vapi-secret` header validation before any database operations, with logging of unauthorized attempts.

---

## Acceptance Criteria

**Functional Requirements:**

1. Webhook route MUST validate `x-vapi-secret` header matches expected value BEFORE any database operations
2. If header missing or invalid, return 401 Unauthorized with no database changes
3. If header valid, proceed with normal function execution
4. Log all unauthorized attempts with IP address and timestamp
5. Valid requests proceed to function execution (check_availability, create_reservation, etc.)

**Integration Requirements:**

6. Validation occurs at route entry point (before parsing request body)
7. Uses environment variable `VAPI_WEBHOOK_SECRET` for comparison
8. Existing `withVapiWebhookVerification()` middleware in `/lib/vapi/webhook-verification.ts` may already implement this - verify and enhance if needed
9. No business logic executes before validation passes

**Quality Requirements:**

10. Tested with missing header (should return 401)
11. Tested with invalid header value (should return 401)
12. Tested with valid header (should proceed normally)
13. Unauthorized attempts logged for security monitoring

---

## Technical Notes

- **Integration Approach:**
  1. Review existing `/lib/vapi/webhook-verification.ts` for current implementation
  2. Ensure validation occurs BEFORE any database operations
  3. Add logging of unauthorized attempts
  4. Return 401 Unauthorized with no error details to attacker
- **Existing Pattern Reference:** Next.js middleware pattern or explicit check at route entry
- **Key Constraints:**
  - Security check MUST be first operation in webhook route
  - No error details leaked to unauthorized requests
  - Logging captures IP, timestamp, attempted payload (sanitized)

---

## Tasks

- [ ] Review existing `/lib/vapi/webhook-verification.ts` implementation
- [ ] Verify validation occurs before ANY database operations
- [ ] Ensure `x-vapi-secret` header comparison is constant-time (prevent timing attacks)
- [ ] Add logging of unauthorized attempts (IP, timestamp, headers)
- [ ] Verify 401 response returns no sensitive error details
- [ ] Confirm environment variable `VAPI_WEBHOOK_SECRET` is set
- [ ] Test with missing `x-vapi-secret` header → expect 401, no DB operations
- [ ] Test with invalid `x-vapi-secret` header → expect 401, no DB operations
- [ ] Test with valid `x-vapi-secret` header → expect normal processing
- [ ] Verify unauthorized attempts logged correctly
- [ ] Confirm no regression in existing valid webhook requests

---

## Definition of Done

- [ ] Functional requirements met (AC 1-5)
- [ ] Integration requirements verified (AC 6-9)
- [ ] Security validation at route entry point confirmed
- [ ] 3 security test scenarios executed successfully
- [ ] Unauthorized attempts logged
- [ ] No regression in valid webhook processing
- [ ] Code reviewed for timing attack vulnerabilities

---

## Dev Agent Record

**Agent Model Used:** _[To be filled by Dev agent]_

**Status:** Draft

**Tasks Completed:**
- [ ] All tasks marked complete above

**Debug Log References:**
_[Links to debug log entries if issues encountered]_

**Completion Notes:**
_[Summary of implementation approach, deviations from plan, lessons learned]_

**File List:**
_[List of all files created, modified, or deleted during implementation]_

**Change Log:**

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Story created | John (PM) |
