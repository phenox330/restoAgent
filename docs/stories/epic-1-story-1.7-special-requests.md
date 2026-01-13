# Story 1.7: Special Requests Capture

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.7
**Priority:** Low
**Estimated Effort:** 2 hours

---

## User Story

As a restaurant customer with special needs or occasions,
I want to communicate allergies, anniversaries, or preferences,
So that the restaurant can prepare appropriately.

---

## Story Context

**Existing System Integration:**
- Integrates with: Vapi SYSTEM_PROMPT conversation flow, `create_reservation` tool function
- Technology: Vapi tool-calls architecture, Supabase reservations table
- Follows pattern: Extend existing create_reservation with optional `special_requests` parameter
- Touch points: Conversation flow between name collection and final confirmation, database schema

**Current Behavior:**
No mechanism to capture special requests - customers must mention in separate communication or upon arrival.

**Target Behavior:**
Agent proactively asks for special requests during reservation flow, captures in database for restaurant visibility.

---

## Acceptance Criteria

**Functional Requirements:**

1. After customer name is collected and before final confirmation, agent asks: "Avez-vous des demandes particulières?"
2. If customer says "non" or "rien", agent proceeds to confirmation without further prompting
3. If customer mentions requests (allergies, birthday, etc.), agent captures in `special_requests` field
4. Agent acknowledges: "C'est noté, merci"
5. Special requests are stored with reservation record
6. If customer doesn't respond or unclear, agent doesn't press - proceeds to confirmation

**Integration Requirements:**

7. `create_reservation` tool function extended with optional `special_requests` parameter
8. Database `reservations` table already has `special_requests` TEXT field (or add if missing)
9. SYSTEM_PROMPT updated to include special requests question in conversation flow

**Quality Requirements:**

10. Question timing feels natural (after name, before final confirmation)
11. Agent doesn't pressure customer if they have no requests
12. Special requests visible in dashboard reservation details

---

## Technical Notes

- **Integration Approach:**
  1. Verify `reservations.special_requests` field exists (create migration if needed)
  2. Update `create_reservation` tool function signature to accept optional special_requests parameter
  3. Update SYSTEM_PROMPT to add special requests question in conversation flow
- **Existing Pattern Reference:** Similar to optional fields in existing create_reservation (customer_phone is optional)
- **Key Constraints:**
  - Must not make conversation feel like interrogation (keep it light)
  - Optional field - no validation required
  - Agent acknowledges but doesn't elaborate (simple "C'est noté, merci")

---

## Tasks

- [ ] Verify `reservations.special_requests` field exists in database schema
- [ ] Create migration if field missing (TEXT nullable)
- [ ] Update `create_reservation` tool function to accept optional special_requests parameter
- [ ] Update tool function implementation to save special_requests to database
- [ ] Update Vapi tool definition to include special_requests parameter
- [ ] Modify SYSTEM_PROMPT to add special requests question after name collection
- [ ] Add acknowledgment response ("C'est noté, merci")
- [ ] Add logic to skip if customer says no or doesn't respond clearly
- [ ] Deploy updated configuration
- [ ] Test with special request provided (allergy, anniversary)
- [ ] Test with customer declining ("non", "rien")
- [ ] Test with unclear/no response - agent moves on gracefully
- [ ] Verify special requests appear in dashboard

---

## Definition of Done

- [ ] Functional requirements met (AC 1-6)
- [ ] Integration requirements verified (AC 7-9)
- [ ] Database schema supports special requests
- [ ] Natural conversation timing confirmed
- [ ] No pressure on customer if no requests
- [ ] Dashboard displays special requests correctly
- [ ] 3+ test scenarios executed successfully

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
