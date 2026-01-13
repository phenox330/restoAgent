# Story 2.4: Demo Rehearsal Schedule Implementation

**Epic:** Epic 2 - Demo Preparation & Quality Assurance
**Story ID:** 2.4
**Priority:** Medium
**Estimated Effort:** 1-2 hours

---

## User Story

As a demo team member,
I want defined rehearsal procedures with specific timing,
So that everyone knows when and how to prepare.

---

## Story Context

**Existing System Integration:**
- Integrates with: Story 2.3 (test call protocol), Story 2.1 (demo seed script)
- Technology: Documentation/checklist format
- Follows pattern: Markdown documentation in `/docs/` directory
- Touch points: Demo preparation workflow and timing

**Current Behavior:**
No structured rehearsal process, potential for inadequate preparation before client demos.

**Target Behavior:**
Clear rehearsal schedule with defined timing and procedures ensuring confidence and readiness for demos.

---

## Acceptance Criteria

**Functional Requirements:**

1. Document (`docs/demo-preparation-checklist.md`) containing:
   - **24 hours before**: Full end-to-end demo run including all test scenarios
   - **2 hours before**: Quick validation run (3-5 key scenarios)
   - **Pre-demo setup**: Run seed script, verify Vapi configuration, test phone number
2. Checklist includes sign-off boxes for each step
3. Defines roles: who runs tests, who verifies dashboard, who checks logs
4. Includes timing estimates for each rehearsal phase
5. Stored in version control and accessible to all team members

**Integration Requirements:**

6. References Story 2.3 test call protocol for full test run
7. References Story 2.1 seed script for demo data preparation
8. Includes verification steps for all Epic 1 enhancements

**Quality Requirements:**

9. Timing is realistic and practical (not overly burdensome)
10. Roles clearly defined to avoid confusion
11. Checklist format allows progress tracking during preparation

---

## Technical Notes

- **Integration Approach:** Create structured checklist document with clear phases, timing, and role assignments
- **Existing Pattern Reference:** Similar to test protocol (Story 2.3) but focused on timing and workflow
- **Key Constraints:**
  - Must be practical and not overly time-consuming
  - Clear role assignments prevent bottlenecks
  - Timing estimates help with scheduling

---

## Tasks

- [ ] Create `/docs/demo-preparation-checklist.md` file
- [ ] Add introduction section explaining checklist purpose
- [ ] Create section: "24 Hours Before Demo"
  - [ ] Full test run using test call protocol (Story 2.3)
  - [ ] Verify all Epic 1 features functional
  - [ ] Check dashboard real-time updates
  - [ ] Review webhook error logs
  - [ ] Timing estimate: 90-120 minutes
- [ ] Create section: "2 Hours Before Demo"
  - [ ] Quick validation run (3-5 key scenarios)
  - [ ] Test phone number accessibility
  - [ ] Verify demo environment loaded
  - [ ] Timing estimate: 15-20 minutes
- [ ] Create section: "Pre-Demo Setup (30 minutes before)"
  - [ ] Run seed-demo-data.ts script
  - [ ] Verify Vapi assistant configuration
  - [ ] Test demo phone number
  - [ ] Open dashboard and prepare screen share
  - [ ] Timing estimate: 10-15 minutes
- [ ] Add role assignments for each task (PM, Dev, QA)
- [ ] Add sign-off checkboxes for each step
- [ ] Add section: "Emergency Contacts" (Vapi support, team members)
- [ ] Add section: "What to Do If Issues Found" (escalation path)
- [ ] Review for completeness and practicality

---

## Definition of Done

- [ ] Functional requirements met (AC 1-5)
- [ ] Integration requirements verified (AC 6-8)
- [ ] Rehearsal schedule defined with specific timing
- [ ] Roles clearly assigned
- [ ] Checklist format with sign-off boxes
- [ ] Timing estimates realistic and practical
- [ ] Document committed to version control

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
