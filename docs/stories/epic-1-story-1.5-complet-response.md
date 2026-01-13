# Story 1.5: Intelligent Full Capacity Response

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.5
**Priority:** Medium
**Estimated Effort:** 1-2 hours

---

## User Story

As a restaurant customer calling when the restaurant is fully booked,
I want the agent to ask for my preferences rather than just saying "complet",
So that I have a chance to find an alternative slot.

---

## Story Context

**Existing System Integration:**
- Integrates with: Vapi SYSTEM_PROMPT, existing `check_availability` function responses
- Technology: GPT-4o-mini LLM conversation flow
- Follows pattern: SYSTEM_PROMPT modifications via `/scripts/update-vapi-config.ts`
- Touch points: Agent response to "complet" status from check_availability

**Current Behavior:**
Agent may simply state "complet" and end conversation, providing poor customer experience.

**Target Behavior:**
Agent proactively asks for alternative preferences when restaurant is fully booked, giving customers opportunity to find available slots.

---

## Acceptance Criteria

**Functional Requirements:**

1. When check_availability returns "complet" status, agent MUST respond: "Malheureusement nous sommes complets à cet horaire. Quel autre créneau souhaiteriez-vous que je vérifie?"
2. Agent MUST NOT propose alternative times automatically
3. Agent waits for customer to suggest different date/time
4. Agent re-checks availability for new slot and repeats process
5. If customer declines to try other slots, agent politely ends: "D'accord, n'hésitez pas à rappeler. Bonne journée!"

**Integration Requirements:**

6. SYSTEM_PROMPT modification only - no code changes
7. Existing check_availability function unchanged
8. Response template matches exact French wording from PRD FR7

**Quality Requirements:**

9. Natural conversation flow maintained
10. Professional and helpful tone throughout
11. Tested with 3+ scenarios (complet → alternative found, complet → customer declines)

---

## Technical Notes

- **Integration Approach:** Update SYSTEM_PROMPT to handle "complet" status with specific response template and follow-up question
- **Existing Pattern Reference:** Similar to confirmation flow (Story 1.1) - conversational guidance via prompt engineering
- **Key Constraints:**
  - Do NOT auto-suggest alternatives (per PRD, agent waits for customer input)
  - Must handle repeated "complet" scenarios gracefully (don't frustrate customer)
  - Polite exit if customer doesn't want to try alternatives

---

## Tasks

- [ ] Backup current Vapi assistant configuration
- [ ] Modify SYSTEM_PROMPT to detect "complet" status from check_availability
- [ ] Add exact French response template per PRD FR7
- [ ] Add conversational logic to wait for customer's alternative preference
- [ ] Add re-check loop (call check_availability for new date/time)
- [ ] Add polite exit path if customer declines alternatives
- [ ] Deploy updated configuration using update-vapi-config.ts script
- [ ] Test scenario: complet → customer suggests alternative → available → success
- [ ] Test scenario: complet → customer suggests alternative → still complet → try again
- [ ] Test scenario: complet → customer declines → polite exit
- [ ] Verify natural conversation flow and professional tone

---

## Definition of Done

- [ ] Functional requirements met (AC 1-5)
- [ ] Integration requirements verified (AC 6-8)
- [ ] SYSTEM_PROMPT follows existing patterns
- [ ] 3+ test scenarios executed successfully
- [ ] Natural and helpful conversation flow confirmed
- [ ] No regression in existing flows
- [ ] Configuration changes versioned in git

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
