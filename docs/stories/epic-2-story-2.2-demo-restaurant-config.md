# Story 2.2: Demo Restaurant Configuration

**Epic:** Epic 2 - Demo Preparation & Quality Assurance
**Story ID:** 2.2
**Priority:** High
**Estimated Effort:** 1 hour

---

## User Story

As a demo presenter,
I want the demo restaurant configured for high availability,
So that I can always demonstrate successful reservations without capacity issues.

---

## Story Context

**Existing System Integration:**
- Integrates with: Supabase `restaurants` table configuration
- Technology: Database configuration or migration script
- Follows pattern: Direct database update or configuration script
- Touch points: Restaurant capacity settings, opening hours configuration

**Current Behavior:**
Restaurant may have realistic capacity constraints that cause "complet" scenarios during demos.

**Target Behavior:**
Demo restaurant configured with high capacity to ensure availability for all demo scenarios.

---

## Acceptance Criteria

**Functional Requirements:**

1. Demo restaurant in database configured with:
   - Name: "Restaurant Épicurie" (or custom demo name)
   - Total capacity: 100 seats (high enough to never be "complet" during demos)
   - Opening hours: 12:00-14:30 (lunch), 19:00-22:30 (dinner), 7 days/week
   - No closed dates
2. Configuration documented in README or scripts/README.md
3. Separate demo restaurant ID from any production/test restaurants
4. Demo restaurant data easily identifiable and restorable

**Integration Requirements:**

5. Uses existing `restaurants` table schema
6. Configuration applied via migration or manual SQL script
7. Demo restaurant ID documented for reference in other scripts

**Quality Requirements:**

8. High capacity ensures demos never fail due to "complet" status
9. Opening hours cover typical demo scenarios (lunch and dinner)
10. Configuration is version-controlled and reproducible

---

## Technical Notes

- **Integration Approach:**
  1. Option A: Create migration file to insert/update demo restaurant
  2. Option B: Create configuration script similar to seed-demo-data.ts
  3. Document demo restaurant ID for use in other scripts
- **Existing Pattern Reference:** Supabase migrations in `/supabase/migrations/` or scripts in `/scripts/`
- **Key Constraints:**
  - Capacity must be high enough for concurrent demo calls
  - Opening hours must be broad (7 days/week, lunch + dinner)
  - Configuration must be easily restorable if accidentally modified

---

## Tasks

- [ ] Identify current demo restaurant in database (or create new)
- [ ] Update restaurant name to "Restaurant Épicurie"
- [ ] Set total capacity to 100 seats
- [ ] Configure opening hours: 12:00-14:30, 19:00-22:30, 7 days/week
- [ ] Ensure no closed dates configured
- [ ] Document demo restaurant ID in README or scripts/README.md
- [ ] Option: Create migration file for demo restaurant configuration
- [ ] Option: Create configuration script for demo restaurant setup
- [ ] Verify configuration in dashboard
- [ ] Test availability check with high guest count (should always succeed)
- [ ] Document restoration procedure if configuration changes

---

## Definition of Done

- [ ] Functional requirements met (AC 1-4)
- [ ] Integration requirements verified (AC 5-7)
- [ ] Demo restaurant configured with high capacity
- [ ] Opening hours cover all demo scenarios
- [ ] Configuration documented and reproducible
- [ ] Verified in dashboard
- [ ] Availability checks succeed for all reasonable party sizes

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
