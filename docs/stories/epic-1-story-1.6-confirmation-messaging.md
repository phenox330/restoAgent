# Story 1.6: Professional Confirmation Messaging

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.6
**Priority:** Medium
**Estimated Effort:** 1 hour

---

## User Story

As a restaurant customer completing a reservation,
I want consistent, professional confirmation messaging,
So that I feel confident my reservation is secured.

---

## Story Context

**Existing System Integration:**
- Integrates with: Vapi SYSTEM_PROMPT final confirmation messaging
- Technology: GPT-4o-mini LLM response generation
- Follows pattern: SYSTEM_PROMPT modifications via `/scripts/update-vapi-config.ts`
- Touch points: Agent response after successful reservation creation

**Current Behavior:**
Agent may use varied confirmation messages, potentially inconsistent tone or omitting key information.

**Target Behavior:**
Agent uses standardized, professional confirmation message consistently across all successful reservation paths.

---

## Acceptance Criteria

**Functional Requirements:**

1. After successful reservation creation, agent MUST use exact template: "Votre table est réservée, vous recevrez un SMS de confirmation. À bientôt!"
2. Tone must be warm and professional (not robotic)
3. Message is consistent across all successful reservation paths (new booking, modification confirmed)
4. Agent MUST NOT add extra information beyond the template (no improvisation)
5. After confirmation message, call ends gracefully

**Integration Requirements:**

6. SYSTEM_PROMPT modification only - no code changes
7. Template applies to create_reservation and find_and_update_reservation success responses
8. SMS mention is accurate (assumes Twilio integration active)

**Quality Requirements:**

9. Tested across all reservation success paths
10. Natural pronunciation and warm tone verified
11. No awkward silence after confirmation

---

## Technical Notes

- **Integration Approach:** Update SYSTEM_PROMPT to enforce exact confirmation template after successful tool function responses
- **Existing Pattern Reference:** Similar to explicit confirmation (Story 1.1) and complet response (Story 1.5) - templated messaging via prompt
- **Key Constraints:**
  - Exact wording per PRD FR14 - no variations allowed
  - Must sound natural despite being templated (test pronunciation)
  - Graceful call ending after confirmation (no hanging silence)

---

## Tasks

- [ ] Backup current Vapi assistant configuration
- [ ] Modify SYSTEM_PROMPT to enforce exact confirmation template
- [ ] Apply template to create_reservation success path
- [ ] Apply template to find_and_update_reservation success path
- [ ] Add instruction to end call gracefully after confirmation
- [ ] Deploy updated configuration using update-vapi-config.ts script
- [ ] Test new reservation → confirmation message
- [ ] Test modification → confirmation message
- [ ] Verify warm tone and natural pronunciation
- [ ] Verify no extra information added by agent
- [ ] Confirm graceful call ending (no awkward silence)

---

## Definition of Done

- [ ] Functional requirements met (AC 1-5)
- [ ] Integration requirements verified (AC 6-8)
- [ ] Confirmation message consistent across all success paths
- [ ] Warm and professional tone confirmed
- [ ] Graceful call ending verified
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
