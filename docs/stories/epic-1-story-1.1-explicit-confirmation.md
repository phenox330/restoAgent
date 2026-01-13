# Story 1.1: Explicit Reservation Confirmation

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.1
**Priority:** High
**Estimated Effort:** 2-3 hours

---

## User Story

As a restaurant customer calling to make a reservation,
I want the agent to explicitly confirm all my reservation details before checking availability,
So that I can catch any misunderstandings before they're committed.

---

## Story Context

**Existing System Integration:**
- Integrates with: Vapi.ai voice agent SYSTEM_PROMPT configuration
- Technology: GPT-4o-mini LLM, Vapi tool-calls architecture
- Follows pattern: SYSTEM_PROMPT modifications via `/scripts/update-vapi-config.ts`
- Touch points: Existing `check_availability` tool function remains unchanged

**Current Behavior:**
Agent currently proceeds directly to availability checking after collecting basic information, leading to occasional misunderstandings.

**Target Behavior:**
Agent must pause after collecting date/time/party size to explicitly confirm details before calling `check_availability`.

---

## Acceptance Criteria

**Functional Requirements:**

1. Agent MUST collect date, time, and number of guests before confirming
2. Agent MUST use exact template: "Donc une table pour {{nb}} personnes le {{date}} à {{heure}}, c'est bien ça?"
3. Agent MUST wait for explicit user confirmation ("oui", "c'est ça", "correct") before proceeding to check_availability
4. If user says "non" or provides corrections, agent MUST re-collect the corrected information and confirm again
5. Confirmation happens in French with natural pronunciation
6. This flow applies to new reservations only (not modifications)

**Integration Requirements:**

7. Existing `check_availability` function continues to work unchanged
8. SYSTEM_PROMPT modification only - no code changes to webhook handlers
9. Confirmation step adds maximum 10 seconds to call duration

**Quality Requirements:**

10. Change is tested with 5+ live test calls before marking complete
11. No regression in existing reservation flows
12. Agent tone remains warm and professional during confirmation

---

## Technical Notes

- **Integration Approach:** Modify SYSTEM_PROMPT in Vapi assistant configuration to add explicit confirmation step in conversation flow
- **Existing Pattern Reference:** Use `/scripts/update-vapi-config.ts` to deploy SYSTEM_PROMPT changes (never manual dashboard edits)
- **Key Constraints:**
  - Confirmation template wording is exact per PRD FR3 - do not improvise
  - Must handle user corrections gracefully without frustration
  - Confirmation only applies to NEW reservations (modifications handled differently in Story 1.3)

---

## Tasks

- [x] Backup current Vapi assistant configuration
- [x] Modify SYSTEM_PROMPT to add confirmation step after date/time/party size collection
- [x] Update SYSTEM_PROMPT to use exact French confirmation template
- [x] Add logic to wait for user confirmation before calling check_availability tool
- [x] Add correction handling flow (if user says "non", re-collect details)
- [x] Deploy updated configuration using update-vapi-config.ts script
- [ ] Execute 5+ test calls covering happy path and correction scenarios
- [ ] Verify existing reservation flows still work (regression check)
- [x] Document SYSTEM_PROMPT changes with rationale comments

---

## Definition of Done

- [ ] Functional requirements met (AC 1-6)
- [ ] Integration requirements verified (AC 7-9)
- [ ] SYSTEM_PROMPT follows existing patterns and standards
- [ ] 5+ test calls executed successfully
- [ ] Existing functionality regression tested
- [ ] No console errors in webhook logs
- [ ] Configuration changes versioned in git with clear commit message

---

## Dev Agent Record

**Agent Model Used:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

**Status:** Awaiting Manual Testing

**Tasks Completed:**
- [x] Configuration backup completed
- [x] SYSTEM_PROMPT modified with confirmation flow
- [x] Exact French template integrated
- [x] User confirmation logic added
- [x] Correction handling flow implemented
- [x] Configuration deployed to TEST environment
- [x] Test protocol documented
- [ ] Manual test calls (requires user execution)
- [ ] Regression verification (requires user execution)

**Debug Log References:**

**Issue #1 - Eleven Labs Pipeline Error (2026-01-13)**
- **Problem:** firstMessage failing with Eleven Labs voice - audio glitching/stretching syllables
- **Error:** "pipeline-error-first-message-failed" (known Vapi/Eleven Labs issue)
- **Root Cause:** Eleven Labs voice provider issue on certain plans or with detected unusual activity
- **Solution:** Switched to OpenAI voice provider (alloy) - commit 204c18d
- **Status:** Resolved - deployed to TEST environment
- **Reference:** Vapi Discord discussions on pipeline-error-first-message-failed

**Completion Notes:**

**Implementation Approach:**
- Modified SYSTEM_PROMPT in `/scripts/update-vapi-config.ts` to add step 3 in FLOW section
- Added explicit confirmation step between "Collecter" and "Vérifier" steps
- Integrated exact French template: "Donc une table pour {{nb}} personnes le {{date}} à {{heure}}, c'est bien ça?"
- Added instructions for waiting for user confirmation ("oui", "c'est ça", "correct", "exactement")
- Added correction handling: if user says "non", re-collect and confirm again
- No changes to webhook handlers or functions - SYSTEM_PROMPT modification only as specified

**Configuration Backup:**
- Backup created: `backups/vapi-config-working-2026-01-13T10-12-36-682Z.json`
- Latest backup: `backups/vapi-config-working-LATEST.json`

**Deployment:**
- Successfully deployed to TEST environment
- Server URL: https://y-git-test-appel-vapi-hello-1894s-projects.vercel.app/api/webhooks/vapi
- Dashboard: https://dashboard.vapi.ai/assistants/b31a622f-68c6-4eaf-a6ce-58a14ddcad23

**Test Protocol:**
- Comprehensive test protocol created: `docs/stories/story-1.1-test-protocol.md`
- Covers 5 test scenarios: happy path, corrections, multiple corrections, partial info, regression
- Requires manual phone testing (cannot be automated)

**Next Steps:**
1. User must execute 5+ manual test calls following test protocol
2. User must verify regression (modifications/cancellations still work)
3. Document test results in test protocol file
4. If all tests pass, story can be marked "Ready for Review"

**File List:**
- Modified: `/scripts/update-vapi-config.ts` (SYSTEM_PROMPT FLOW section + voice provider fix)
- Created: `docs/stories/story-1.1-test-protocol.md` (test documentation)
- Created: `backups/vapi-config-working-2026-01-13T10-12-36-682Z.json` (config backup)
- Updated: `backups/vapi-config-working-LATEST.json` (latest backup)
- Modified: `docs/stories/epic-1-story-1.1-explicit-confirmation.md` (debug log update)

**Change Log:**

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Story created | John (PM) |
| 2026-01-13 | Implementation completed, awaiting manual testing | James (Dev Agent) |
