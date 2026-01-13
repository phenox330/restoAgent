# Story 1.1 Test Protocol
# Explicit Reservation Confirmation Testing

## Test Environment
- Vapi Assistant: b31a622f-68c6-4eaf-a6ce-58a14ddcad23
- Environment: TEST (https://y-git-test-appel-vapi-hello-1894s-projects.vercel.app)
- Dashboard: https://dashboard.vapi.ai/assistants/b31a622f-68c6-4eaf-a6ce-58a14ddcad23

## Required Test Calls: 5+ covering scenarios below

### Test Scenario 1: Happy Path - Confirmation Accepted
**Objective:** Verify agent confirms details before checking availability

**Steps:**
1. Call the agent
2. Request a reservation (e.g., "Je voudrais réserver pour ce soir")
3. Provide: date, time (e.g., 19h30), number of guests (e.g., 4 personnes)
4. Wait for confirmation using exact template

**Expected Behavior:**
- Agent says: "Donc une table pour 4 personnes le [date] à 19h30, c'est bien ça?"
- Wait for your "oui" / "c'est ça" / "correct"
- THEN agent calls check_availability
- Continues with normal flow

**Pass Criteria:**
- ✅ Exact confirmation template used
- ✅ Agent waits for explicit confirmation
- ✅ Does NOT call check_availability before confirmation
- ✅ Natural, professional tone maintained

---

### Test Scenario 2: Correction - User Says "Non"
**Objective:** Verify agent handles corrections gracefully

**Steps:**
1. Call the agent
2. Provide initial details: 2 personnes, demain, 20h
3. When agent confirms, say "Non, c'est pour 4 personnes, pas 2"

**Expected Behavior:**
- Agent acknowledges the correction
- Re-collects the corrected detail (4 personnes)
- Confirms AGAIN with updated details: "Donc une table pour 4 personnes le [date] à 20h, c'est bien ça?"
- Waits for confirmation before proceeding

**Pass Criteria:**
- ✅ Agent handles "non" gracefully (no frustration)
- ✅ Re-collects corrected information
- ✅ Confirms again with new details
- ✅ Does not proceed without final confirmation

---

### Test Scenario 3: Multiple Corrections
**Objective:** Verify agent can handle multiple rounds of corrections

**Steps:**
1. Provide: 2 personnes, demain, 19h
2. Correct to: 4 personnes (keep rest same)
3. Then correct to: 19h30 (change time)

**Expected Behavior:**
- Agent confirms after each correction round
- Remains patient and professional
- Final confirmation includes all corrections

**Pass Criteria:**
- ✅ Agent doesn't get confused by multiple corrections
- ✅ Maintains warm, professional tone
- ✅ All corrections properly reflected in final confirmation

---

### Test Scenario 4: Partial Information Given
**Objective:** Verify agent collects all required info before confirming

**Steps:**
1. Say "Je voudrais réserver pour demain"
2. Don't provide time or party size initially

**Expected Behavior:**
- Agent asks for time
- Agent asks for party size
- ONLY AFTER having all 3 pieces (date/time/party size), agent confirms

**Pass Criteria:**
- ✅ Agent doesn't attempt confirmation without all details
- ✅ Asks one question at a time (natural flow)
- ✅ Confirmation only happens when date/time/guests all collected

---

### Test Scenario 5: Regression - Existing Flows Still Work
**Objective:** Verify new confirmation doesn't break other flows

**Test 5a: Modification Request**
- Call and say "Je voudrais modifier ma réservation au nom de Dupont"
- Verify this doesn't trigger the NEW reservation confirmation flow

**Test 5b: Cancellation Request**
- Call and say "Je voudrais annuler ma réservation"
- Verify normal cancellation flow works

**Test 5c: General Question**
- Call and ask "Quels sont vos horaires d'ouverture?"
- Verify agent handles out-of-scope gracefully

**Pass Criteria:**
- ✅ Modifications don't trigger new-reservation confirmation
- ✅ Cancellations work normally
- ✅ General questions handled appropriately

---

## Test Execution Log

### Test Run #1 - [Date/Time]
- **Scenario:**
- **Result:** ⬜ Pass / ⬜ Fail
- **Notes:**

### Test Run #2 - [Date/Time]
- **Scenario:**
- **Result:** ⬜ Pass / ⬜ Fail
- **Notes:**

### Test Run #3 - [Date/Time]
- **Scenario:**
- **Result:** ⬜ Pass / ⬜ Fail
- **Notes:**

### Test Run #4 - [Date/Time]
- **Scenario:**
- **Result:** ⬜ Pass / ⬜ Fail
- **Notes:**

### Test Run #5 - [Date/Time]
- **Scenario:**
- **Result:** ⬜ Pass / ⬜ Fail
- **Notes:**

### Test Run #6+ (if needed)
- **Scenario:**
- **Result:** ⬜ Pass / ⬜ Fail
- **Notes:**

---

## Overall Test Result
- ⬜ All tests passed - Story ready for completion
- ⬜ Issues found - See notes below

## Issues Found
_[Document any issues discovered during testing]_

---

## Sign-off
- **Tester:**
- **Date:**
- **Overall Status:** ⬜ Approved / ⬜ Needs fixes
