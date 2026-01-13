# Story 1.4: Reservation Cancellation Flow

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.4
**Priority:** High
**Estimated Effort:** 2-3 hours

---

## User Story

As a restaurant customer who needs to cancel,
I want a quick cancellation process without unnecessary confirmations,
So that I can cancel efficiently.

---

## Story Context

**Existing System Integration:**
- Integrates with: `/lib/vapi/tools.ts` tool handler router, existing `cancel_reservation` function
- Technology: Vapi tool-calls architecture, Supabase PostgreSQL
- Follows pattern: Add new tool function similar to existing cancel logic
- Touch points: `reservations` table (status UPDATE to 'cancelled'), Vapi SYSTEM_PROMPT (cancellation intent detection)

**Current Behavior:**
Existing `cancel_reservation` may require additional information or confirmations that create friction.

**Target Behavior:**
Agent recognizes cancellation intent, finds reservation by name, cancels immediately without "Are you sure?" prompts.

---

## Acceptance Criteria

**Functional Requirements:**

1. Agent identifies cancellation intent from phrases like "annuler", "supprimer ma réservation"
2. Agent calls `find_and_cancel_reservation` with customer name
3. If single reservation found, agent cancels immediately WITHOUT asking "Êtes-vous sûr?"
4. Agent confirms: "Votre réservation a été annulée"
5. If multiple reservations found for same name, agent asks: "J'ai plusieurs réservations à ce nom. Pour quelle date et heure souhaitez-vous annuler?"
6. If no reservation found, agent responds: "Je ne trouve pas de réservation à ce nom"
7. Cancellation updates reservation status to "cancelled" in database

**Integration Requirements:**

8. New `find_and_cancel_reservation` tool function added to Vapi assistant configuration
9. Tool function registered in `/lib/vapi/tools.ts` handleToolCall() router
10. Existing `cancel_reservation` function remains available for backward compatibility
11. Database updates are simple status changes (no complex transactions needed)

**Quality Requirements:**

12. Cancellation flow tested with 5+ test calls
13. Handles edge cases: not found, duplicate names
14. Efficient UX - no unnecessary confirmation prompts

---

## Technical Notes

- **Integration Approach:**
  1. Create `findAndCancelReservation()` function in `/lib/vapi/tools.ts`
  2. Add tool definition to Vapi assistant configuration
  3. Update SYSTEM_PROMPT to recognize cancellation intent and skip confirmation prompt
  4. Simple database UPDATE status='cancelled' WHERE id=reservation_id
- **Existing Pattern Reference:** Similar to existing cancel logic but optimized for efficiency (no confirmation prompt)
- **Key Constraints:**
  - Must handle duplicate names gracefully (ask for date/time clarification)
  - Status update only - do not DELETE records (preserve history)
  - No "Are you sure?" prompt per PRD FR9

---

## Tasks

- [ ] Design `FindAndCancelReservationArgs` interface (restaurant_id, customer_name, customer_phone?)
- [ ] Implement `findAndCancelReservation()` function in /lib/vapi/tools.ts
- [ ] Add database query to find reservation by name
- [ ] Handle single match: cancel immediately
- [ ] Handle multiple matches: return list for user clarification
- [ ] Handle no match: return not found message
- [ ] Update reservation status to 'cancelled' in database
- [ ] Add `find_and_cancel_reservation` tool definition to Vapi configuration
- [ ] Update SYSTEM_PROMPT to detect cancellation intent (no confirmation prompt)
- [ ] Register tool in handleToolCall() switch statement
- [ ] Test cancellation flow: single match, multiple matches, not found
- [ ] Verify cancelled reservations removed from dashboard views
- [ ] Verify existing flows unaffected

---

## Definition of Done

- [ ] Functional requirements met (AC 1-7)
- [ ] Integration requirements verified (AC 8-11)
- [ ] 5+ test calls executed successfully
- [ ] Edge cases handled gracefully (not found, duplicates)
- [ ] Efficient UX confirmed (no unnecessary prompts)
- [ ] Existing functionality regression tested
- [ ] No console errors in webhook logs

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
