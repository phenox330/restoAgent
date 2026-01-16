# Story 1.7: Special Requests Capture

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.7
**Status:** Approved
**Priority:** Low
**Estimated Effort:** 1 hour (reduced - infrastructure already exists)

---

## User Story

As a restaurant customer with special needs or occasions,
I want to communicate allergies, anniversaries, or preferences,
So that the restaurant can prepare appropriately.

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

## Dev Notes

### Implementation Summary

This story requires **SYSTEM_PROMPT modification only**. The database schema and tool function infrastructure already exist and are fully functional.

### Already Implemented (No Code Changes Needed)

| Component | File | Status |
|-----------|------|--------|
| `reservations.special_requests` field | `types/database.ts:86` | ✅ Exists |
| `create_reservation` accepts `special_requests` param | `lib/vapi/tools.ts:30` | ✅ Exists |
| Tool saves `special_requests` to database | `lib/vapi/tools.ts:455` | ✅ Works |
| Vapi tool definition includes `special_requests` | `scripts/update-vapi-config.ts:288-291` | ✅ Configured |
| Dashboard displays `special_requests` | `components/reservations/reservation-details-dialog.tsx` | ✅ Visible |

### Remaining Work

The only change required is updating the **SYSTEM_PROMPT** in `scripts/update-vapi-config.ts` to:
1. Add the special requests question in the conversation flow
2. Handle "non"/"rien" responses gracefully
3. Acknowledge with "C'est noté, merci"

### Relevant Source Tree

```
scripts/
└── update-vapi-config.ts    # MODIFY: Add special requests to SYSTEM_PROMPT (line 68-216)

lib/vapi/
└── tools.ts                 # NO CHANGE: Already supports special_requests parameter

components/reservations/
└── reservation-details-dialog.tsx  # NO CHANGE: Already displays special_requests
```

### Key Constraints

- Must not make conversation feel like interrogation (keep it light)
- Optional field - no validation required
- Agent acknowledges but doesn't elaborate (simple "C'est noté, merci")
- Detection phrases for "no": "non", "rien", "pas de demande", "rien de particulier", "non merci"

### SYSTEM_PROMPT Change Location

In `scripts/update-vapi-config.ts`, add after step 4 (Vérifier) and before step 5 (Finaliser):

```
4b. **Demandes particulières (optionnel)** :
    - Après confirmation de disponibilité, demander : "Avez-vous des demandes particulières ? Allergies, occasion spéciale ?"
    - Si "non", "rien", ou pas de réponse claire → passer directement à la finalisation
    - Si le client mentionne quelque chose → dire "C'est noté, merci" et inclure dans special_requests
```

---

## Testing

### Test Approach
Manual voice call testing via Vapi test interface or phone call.

### Test Scenarios

| # | Scenario | Input | Expected Agent Response | Verify |
|---|----------|-------|------------------------|--------|
| 1 | Special request provided | "J'ai une allergie aux fruits de mer" | "C'est noté, merci" → proceeds to create_reservation with special_requests | Check DB: `special_requests` contains allergy info |
| 2 | Anniversary mentioned | "C'est pour un anniversaire" | "C'est noté, merci" | Check DB: `special_requests` contains "anniversaire" |
| 3 | Customer says no | "Non" or "Rien" | Proceeds directly to confirmation without follow-up | No special_requests in DB (null) |
| 4 | Customer says nothing | (silence or unclear) | Agent moves on gracefully after ~2 seconds | No special_requests in DB |
| 5 | Multiple requests | "Allergie gluten et c'est un anniversaire" | "C'est noté, merci" | Both items in special_requests |

### Test Data Requirements
- Use existing demo restaurant configuration
- Any reservation details (date, time, guests, name) can be used

---

## Tasks

### Already Complete (Verified - No Action Needed)

- [x] `reservations.special_requests` field exists in database schema
- [x] `create_reservation` tool function accepts optional `special_requests` parameter
- [x] Tool function implementation saves `special_requests` to database
- [x] Vapi tool definition includes `special_requests` parameter
- [x] Dashboard displays special requests in reservation details

### Remaining Tasks

- [x] Modify SYSTEM_PROMPT to add special requests question after availability confirmation (AC: 1, 9)
- [x] Add handling for customer declining ("non", "rien", "rien de particulier") (AC: 2)
- [x] Add acknowledgment response "C'est noté, merci" (AC: 4)
- [x] Add logic to proceed gracefully if customer doesn't respond clearly (AC: 6)
- [x] Deploy updated configuration: `npx tsx scripts/update-vapi-config.ts`
- [ ] Test: Customer provides allergy → verify stored in DB (AC: 3, 5)
- [ ] Test: Customer provides anniversary → verify stored in DB (AC: 3, 5)
- [ ] Test: Customer says "non" → agent proceeds without pressure (AC: 2, 11)
- [ ] Test: Customer unclear/no response → agent moves on gracefully (AC: 6, 11)
- [ ] Verify special requests appear in dashboard reservation details (AC: 12)

---

## Definition of Done

- [ ] SYSTEM_PROMPT includes special requests question in correct position (after name, before confirmation)
- [ ] Agent asks naturally without feeling like interrogation (AC: 10, 11)
- [ ] "Non"/"rien" responses handled gracefully (AC: 2)
- [ ] Special requests stored correctly in database (AC: 5)
- [ ] Dashboard displays special requests (AC: 12)
- [ ] 5 test scenarios executed successfully

---

## QA Results

_[To be filled by QA agent after implementation review]_

---

## Dev Agent Record

**Agent Model Used:** Claude Opus 4.5 (claude-opus-4-5-20251101)

**Status:** Implementation Complete - Manual Testing Deferred

**Tasks Completed:**
- [x] SYSTEM_PROMPT modification (steps 5-6 added for special requests)
- [x] Deployed to production via `npx tsx scripts/update-vapi-config.ts`
- [ ] Manual voice call testing pending

**Debug Log References:**
No issues encountered during implementation.

**Completion Notes:**
- Implementation was straightforward - only SYSTEM_PROMPT modification required
- Added step 5 "Demandes particulières (optionnel)" between availability check and finalization
- Renumbered step 5 to step 6 for "Finaliser"
- Included all decline phrases: "non", "rien", "pas de demande", "rien de particulier", "non merci"
- Agent instructed to not insist if customer hesitates or doesn't respond clearly

**File List:**
- `scripts/update-vapi-config.ts` - Modified SYSTEM_PROMPT (lines 146-152)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-13 | Story created | John (PM) |
| 2026-01-15 | Story validated and updated - marked existing infrastructure as complete, focused tasks on SYSTEM_PROMPT changes | Sarah (PO) |
| 2026-01-15 | Implementation complete - SYSTEM_PROMPT modified and deployed, awaiting manual testing | James (Dev) |
