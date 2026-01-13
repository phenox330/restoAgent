# Story 1.2: Graceful Technical Error Handling

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.2
**Priority:** High
**Estimated Effort:** 3-4 hours

---

## User Story

As a restaurant customer experiencing a technical issue during my call,
I want the agent to handle the problem professionally and ensure my request isn't lost,
So that I don't have to call back or feel frustrated.

---

## Story Context

**Existing System Integration:**
- Integrates with: `/app/api/webhooks/vapi/route.ts` webhook error handling, Vapi SYSTEM_PROMPT fallback procedures
- Technology: Next.js API Routes, Supabase PostgreSQL, Vapi tool-calls error responses
- Follows pattern: Try-catch blocks in webhook route with graceful error responses
- Touch points: Database `reservations` table (add `request_type` field), SYSTEM_PROMPT error fallback messaging

**Current Behavior:**
Technical errors may cause agent to stall or provide unhelpful responses, losing customer contact information.

**Target Behavior:**
Agent gracefully captures contact info when technical errors occur, creating pending request for manual follow-up.

---

## Acceptance Criteria

**Functional Requirements:**

1. When webhook times out (> 20 seconds) or returns error status, agent MUST say: "Je rencontre un problème technique. Puis-je prendre vos coordonnées et le restaurant vous rappellera?"
2. Agent MUST collect: customer name, phone number, desired date, time, and party size
3. Webhook MUST create a "pending_request" record in database with type="technical_error"
   - **Architect Decision Required:** Determine if this requires new `special_requests` table or can use existing `reservations` table with `request_type` field
4. All technical errors MUST be logged with timestamp, error message, stack trace, call_id, function_name
5. Agent MUST NOT display technical error details to caller (no "500 error", "database timeout", etc.)
6. After capturing contact info, agent confirms: "Merci, le restaurant vous contactera dans les plus brefs délais"

**Integration Requirements:**

7. Existing webhook error handling extended, not replaced
8. Database schema changes are additive (nullable fields with defaults)
9. Error logging uses centralized module (prepare for Story 1.10)

**Quality Requirements:**

10. Fallback procedure tested with simulated webhook timeout
11. All error scenarios result in contact capture (no lost leads)
12. Professional tone maintained throughout error scenarios

---

## Technical Notes

- **Integration Approach:**
  1. Add `request_type` VARCHAR field to `reservations` table (or create new `special_requests` table - architect to decide)
  2. Modify webhook route to catch timeouts and return graceful error response to Vapi
  3. Update SYSTEM_PROMPT with fallback contact capture procedure
- **Existing Pattern Reference:** Follow existing Supabase admin client usage in webhooks, migration pattern in `/supabase/migrations/`
- **Key Constraints:**
  - Must not break existing reservation creation flow
  - Error logging structure should support Story 1.10 (Basic Error Logging)
  - Schema design should not complicate future multi-tenant migration

---

## Tasks

- [ ] **Architect Decision:** Determine schema approach (extend reservations vs new table)
- [ ] Create database migration for `request_type` field (or new table)
- [ ] Apply migration to development database
- [ ] Modify webhook route to catch and handle timeouts gracefully
- [ ] Implement error response format that triggers Vapi fallback behavior
- [ ] Update SYSTEM_PROMPT with contact capture procedure for technical errors
- [ ] Add basic error logging (timestamp, message, call_id) - foundation for Story 1.10
- [ ] Test with simulated webhook timeout (delay response > 20s)
- [ ] Test with simulated database error
- [ ] Verify error records created correctly in database
- [ ] Confirm existing successful reservation flows unaffected

---

## Definition of Done

- [ ] Functional requirements met (AC 1-6)
- [ ] Integration requirements verified (AC 7-9)
- [ ] Database migration applied and documented
- [ ] Tests pass (simulated errors, existing flows)
- [ ] Error logging functional and structured
- [ ] SYSTEM_PROMPT updated with fallback procedure
- [ ] No regression in existing functionality verified

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
