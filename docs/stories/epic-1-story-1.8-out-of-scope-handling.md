# Story 1.8: Out-of-Scope Request Handling

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.8
**Priority:** Medium
**Estimated Effort:** 1-2 hours

---

## User Story

As a restaurant customer asking about non-reservation topics,
I want the agent to respond professionally and redirect appropriately,
So that I know how to get my question answered.

---

## Story Context

**Existing System Integration:**
- Integrates with: Vapi SYSTEM_PROMPT out-of-scope handling
- Technology: GPT-4o-mini LLM conversation management
- Follows pattern: SYSTEM_PROMPT modifications via `/scripts/update-vapi-config.ts`
- Touch points: Agent response to questions about menu, prices, delivery, jobs, etc.

**Current Behavior:**
Agent may attempt to answer out-of-scope questions (inventing information) or handle awkwardly.

**Target Behavior:**
Agent professionally defers out-of-scope topics to restaurant staff, attempts to recentre on reservation assistance.

---

## Acceptance Criteria

**Functional Requirements:**

1. When customer asks about menu, prices, delivery, job applications, or other non-reservation topics, agent responds: "Pour cette demande, un responsable vous rappellera"
2. Agent then attempts to recentre: "Je peux vous aider pour une réservation?"
3. If customer wants to continue with reservation, agent proceeds normally
4. If customer declines, agent ends politely: "D'accord, bonne journée!"
5. Agent does NOT invent information about topics outside reservation scope

**Integration Requirements:**

6. SYSTEM_PROMPT modification only - no code changes
7. Clear scope boundaries defined in prompt (reservations only)
8. Professional and helpful tone maintained even when deferring

**Quality Requirements:**

9. Tested with 5+ out-of-scope topics (menu, prices, delivery, hours, events)
10. Agent never invents information or provides inaccurate responses
11. Recentring attempt feels natural, not pushy

---

## Technical Notes

- **Integration Approach:** Update SYSTEM_PROMPT to clearly define agent scope (reservations only) and provide exact response template for out-of-scope requests
- **Existing Pattern Reference:** Similar to complet response (Story 1.5) - templated deflection with recentring attempt
- **Key Constraints:**
  - Must identify common out-of-scope topics: menu, prices, delivery, hours, events, jobs, catering
  - Professional tone essential - not dismissive
  - Recentring is polite attempt, not aggressive sales pitch

---

## Tasks

- [ ] Backup current Vapi assistant configuration
- [ ] Modify SYSTEM_PROMPT to define clear scope boundaries (reservations, modifications, cancellations only)
- [ ] Add list of common out-of-scope topics to recognize
- [ ] Add exact French response template per PRD FR12
- [ ] Add recentring attempt with reservation offer
- [ ] Add polite exit path if customer declines
- [ ] Deploy updated configuration using update-vapi-config.ts script
- [ ] Test: customer asks about menu → defer → recentre → continue with reservation
- [ ] Test: customer asks about prices → defer → recentre → decline → polite exit
- [ ] Test: customer asks about delivery → defer → handled professionally
- [ ] Test: customer asks about job application → defer → handled professionally
- [ ] Test: customer asks about hours → defer (even though related to reservations)
- [ ] Verify agent never invents information

---

## Definition of Done

- [ ] Functional requirements met (AC 1-5)
- [ ] Integration requirements verified (AC 6-8)
- [ ] 5+ out-of-scope topics tested
- [ ] Professional and helpful tone confirmed
- [ ] Agent never invents information
- [ ] Recentring feels natural
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
