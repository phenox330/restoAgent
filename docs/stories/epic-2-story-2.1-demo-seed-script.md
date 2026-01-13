# Story 2.1: Demo Data Seed Script

**Epic:** Epic 2 - Demo Preparation & Quality Assurance
**Story ID:** 2.1
**Priority:** High
**Estimated Effort:** 2-3 hours

---

## User Story

As a demo presenter,
I want realistic fake reservation data in the system,
So that the dashboard looks professional and demonstrates real-world usage patterns.

---

## Story Context

**Existing System Integration:**
- Integrates with: Supabase `reservations` table, `restaurants` table
- Technology: Node.js/TypeScript script using Supabase admin client
- Follows pattern: Standalone executable scripts in `/scripts/` directory (similar to `update-vapi-config.ts`)
- Touch points: Database seeding with realistic test data

**Current Behavior:**
Empty database or manual data entry for demos, inconsistent and unprofessional appearance.

**Target Behavior:**
Automated script generates realistic fake reservations on demand for professional demo environment.

---

## Acceptance Criteria

**Functional Requirements:**

1. Create a Node.js/TypeScript script (`scripts/seed-demo-data.ts`) that populates the database
2. Script generates 10-15 fake reservations with variety:
   - Mix of dates (today, tomorrow, next week)
   - Mix of times (lunch and dinner services)
   - Mix of party sizes (2, 4, 6, 8 people)
   - Diverse French names (avoid repetition)
   - Some with special_requests filled in
3. Script can be run repeatedly (idempotent) - clears old demo data before inserting new
4. All fake reservations flagged with `is_demo_data: true` for easy identification/cleanup
5. Script output confirms number of records created
6. Documentation in script comments explains how to run it

**Integration Requirements:**

7. Uses `getSupabaseAdmin()` from `/lib/supabase/admin.ts` for database operations
8. Script executable via `npm run tsx scripts/seed-demo-data.ts` or similar
9. Environment variables loaded from `.env.local`
10. Database schema already supports all required fields (verified in Story 1.7)

**Quality Requirements:**

11. Realistic French names (use hardcoded list or faker.js)
12. Dates/times respect restaurant opening hours
13. Party sizes realistic for restaurant capacity
14. Script runs without errors on clean database

---

## Technical Notes

- **Integration Approach:**
  1. Create TypeScript script in `/scripts/seed-demo-data.ts`
  2. Use Supabase admin client for database access
  3. Generate realistic fake data (hardcoded French names or faker.js)
  4. Delete existing demo data before inserting new (idempotent)
- **Existing Pattern Reference:** Similar to `/scripts/update-vapi-config.ts` - standalone executable script with clear output
- **Key Constraints:**
  - Must flag demo data clearly (`is_demo_data: true` or similar identifier)
  - Dates/times must respect restaurant configuration (opening hours)
  - Script must be safe to run multiple times (idempotent)

---

## Tasks

- [ ] Create `/scripts/seed-demo-data.ts` file
- [ ] Import Supabase admin client from `/lib/supabase/admin.ts`
- [ ] Define realistic French names array (10-15 unique names)
- [ ] Implement date generation logic (today, tomorrow, next week)
- [ ] Implement time generation logic (respect lunch/dinner services)
- [ ] Implement party size randomization (2, 4, 6, 8)
- [ ] Add special_requests for some reservations (allergies, anniversaries)
- [ ] Implement idempotent deletion of old demo data
- [ ] Insert 10-15 new fake reservations with `is_demo_data: true` flag
- [ ] Add console output showing number of records created
- [ ] Add JSDoc comments explaining script usage
- [ ] Test script execution: `npm run tsx scripts/seed-demo-data.ts`
- [ ] Verify data appears correctly in dashboard
- [ ] Test running script multiple times (idempotency)
- [ ] Add script documentation to README or scripts/README.md

---

## Definition of Done

- [ ] Functional requirements met (AC 1-6)
- [ ] Integration requirements verified (AC 7-10)
- [ ] Script creates realistic demo data
- [ ] Script is idempotent (can run multiple times safely)
- [ ] Demo data clearly flagged for identification
- [ ] Documentation explains how to use script
- [ ] Tested and working on development environment

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
