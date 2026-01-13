# Story 1.3: Reservation Modification Flow

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.3
**Priority:** High
**Estimated Effort:** 3-4 hours

---

## User Story

As a restaurant customer with an existing reservation,
I want to modify my reservation date, time, or party size,
So that I can adjust my plans without canceling and rebooking.

---

## Story Context

**Existing System Integration:**
- Integrates with: `/lib/vapi/tools.ts` tool handler router, existing `check_availability` function
- Technology: Vapi tool-calls architecture, Supabase PostgreSQL with transaction locking
- Follows pattern: Add new tool function to existing `handleToolCall()` switch statement
- Touch points: `reservations` table (UPDATE operations), Vapi SYSTEM_PROMPT (modification intent detection)

**Current Behavior:**
No modification flow exists - customers must cancel and rebook manually.

**Target Behavior:**
Agent recognizes modification intent, finds existing reservation, verifies new availability, updates booking seamlessly.

---

## Acceptance Criteria

**Functional Requirements:**

1. Agent identifies modification intent from phrases like "changer ma réservation", "modifier", "je voudrais déplacer"
2. Agent calls `find_and_update_reservation` function with customer name
3. If reservation found, agent confirms current details: "J'ai votre réservation pour {{nb}} personnes le {{date}} à {{heure}}"
4. If reservation NOT found, agent responds: "Je ne trouve pas de réservation à ce nom. Souhaitez-vous créer une nouvelle réservation?"
5. Agent asks what to modify: "Que souhaitez-vous modifier?"
6. For new date/time, agent MUST call check_availability before confirming change
7. If new slot unavailable, agent asks: "Ce créneau est complet. Quel autre horaire souhaiteriez-vous?"
8. Once new slot confirmed available, agent updates reservation and confirms: "Votre réservation est modifiée pour {{new_details}}"

**Integration Requirements:**

9. New `find_and_update_reservation` tool function added to Vapi assistant configuration
10. Tool function registered in `/lib/vapi/tools.ts` handleToolCall() router
11. Uses existing `check_availability` logic for new slot verification
12. Database updates use transaction locking (SELECT FOR UPDATE) to prevent race conditions

**Quality Requirements:**

13. Modification flow tested with 5+ test calls
14. Handles edge cases: no reservation found, duplicate names, unavailable new slots
15. Existing create_reservation flow unaffected

---

## Technical Notes

- **Integration Approach:**
  1. Create `findAndUpdateReservation()` function in `/lib/vapi/tools.ts`
  2. Add tool definition to Vapi assistant configuration via update-vapi-config.ts
  3. Update SYSTEM_PROMPT to recognize modification intent and call new tool
  4. Use PostgreSQL `SELECT FOR UPDATE` in transaction for atomic read-modify-write
- **Existing Pattern Reference:** Follow existing tool function structure (check_availability, create_reservation) for consistency
- **Key Constraints:**
  - Must verify availability before confirming modification (prevent overbooking)
  - Handle ambiguous customer names by asking for clarification (phone number)
  - Transaction locking prevents concurrent modification race conditions

---

## Tasks

- [ ] Design `FindAndUpdateReservationArgs` interface (restaurant_id, customer_name, customer_phone?, new_date?, new_time?, new_number_of_guests?)
- [ ] Implement `findAndUpdateReservation()` function in /lib/vapi/tools.ts
- [ ] Add database query to find reservation by name (with transaction locking)
- [ ] Integrate with existing check_availability for new slot verification
- [ ] Implement reservation update with atomic transaction
- [ ] Handle duplicate name scenario (return multiple matches for user clarification)
- [ ] Add `find_and_update_reservation` tool definition to Vapi configuration
- [ ] Update SYSTEM_PROMPT to detect modification intent and use new tool
- [ ] Register tool in handleToolCall() switch statement
- [ ] Test modification flow: change date, change time, change party size
- [ ] Test edge cases: not found, unavailable new slot, duplicate names
- [ ] Verify existing flows unaffected (create, cancel)

---

## Definition of Done

- [ ] Functional requirements met (AC 1-8)
- [ ] Integration requirements verified (AC 9-12)
- [ ] Transaction locking implemented correctly
- [ ] 5+ test calls executed successfully
- [ ] Edge cases handled gracefully
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
