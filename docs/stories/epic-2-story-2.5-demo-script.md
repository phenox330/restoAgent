# Story 2.5: Demo Script Documentation

**Epic:** Epic 2 - Demo Preparation & Quality Assurance
**Story ID:** 2.5
**Priority:** Medium
**Estimated Effort:** 1-2 hours

---

## User Story

As a demo presenter,
I want a recommended demo flow script,
So that I can confidently showcase features while avoiding known weaknesses.

---

## Story Context

**Existing System Integration:**
- Integrates with: All Epic 1 implemented features (Stories 1.1-1.10)
- Technology: Documentation format
- Follows pattern: Markdown documentation in `/docs/` directory
- Touch points: Demo presentation flow and messaging

**Current Behavior:**
No structured demo script, potential for awkward moments or missing key value propositions.

**Target Behavior:**
Clear demo script guiding presenter through optimal flow, highlighting strengths, managing expectations.

---

## Acceptance Criteria

**Functional Requirements:**

1. Create document (`docs/demo-script.md`) containing:
   - Recommended opening (introduce RestoAgent value proposition)
   - Suggested scenarios to demonstrate (new reservation, modification, complet handling)
   - Exact phrases to use on demo calls (proven to work well)
   - Features to highlight ("Notice how it confirms before checking...")
   - Topics to avoid or handle carefully
   - Closing talking points (future roadmap, pricing)
2. Script is concise (2-3 pages max) and easy to follow during live demo
3. Includes timing: typical demo is 15-20 minutes
4. References where to find supporting materials (dashboard, logs)

**Integration Requirements:**

5. Script showcases all Epic 1 implemented features
6. Scenarios reference specific acceptance criteria that work reliably
7. Script avoids features not yet implemented or unreliable scenarios

**Quality Requirements:**

8. Script is concise and easy to reference during live demo
9. Value proposition clearly articulated
10. Demo flow feels natural and professional

---

## Technical Notes

- **Integration Approach:** Create narrative-style script with conversational flow, call-out boxes for key points
- **Existing Pattern Reference:** Similar to existing docs but more narrative and prescriptive
- **Key Constraints:**
  - Must be concise enough to reference during live demo
  - Should anticipate common prospect questions
  - Must highlight differentiators (explicit confirmation, error handling, modification flow)

---

## Tasks

- [ ] Create `/docs/demo-script.md` file
- [ ] Add section: "Demo Overview" (15-20 minutes, what you'll show)
- [ ] Add section: "Opening (2 minutes)"
  - [ ] RestoAgent value proposition
  - [ ] Problem statement (restaurant reservation pain points)
  - [ ] Solution overview (AI voice agent + dashboard)
- [ ] Add section: "Live Demo Flow (10-12 minutes)"
  - [ ] Scenario 1: Happy path new reservation (showcase explicit confirmation - Story 1.1)
  - [ ] Scenario 2: Reservation modification (Story 1.3)
  - [ ] Scenario 3: Complet handling with alternative (Story 1.5)
  - [ ] Optional: Special requests capture (Story 1.7)
  - [ ] Show dashboard real-time updates after each call
- [ ] Add section: "Features to Highlight"
  - [ ] Explicit confirmation before availability check
  - [ ] Graceful error handling
  - [ ] Professional messaging consistency
  - [ ] Real-time dashboard updates
- [ ] Add section: "Exact Phrases for Demo Calls" (proven scripts that work)
- [ ] Add section: "Topics to Avoid or Handle Carefully"
  - [ ] Advanced French NLU (if not fully implemented)
  - [ ] Large group handling (mention as manual process)
  - [ ] Multi-tenant capabilities (future roadmap)
- [ ] Add section: "Closing & Next Steps (3-5 minutes)"
  - [ ] Recap key differentiators
  - [ ] Future roadmap preview
  - [ ] Pricing discussion (if applicable)
  - [ ] Call to action
- [ ] Add section: "Supporting Materials" (dashboard URL, test phone number, backup plans)
- [ ] Add section: "Anticipated Questions & Answers"
- [ ] Review for conciseness and usability during live demo

---

## Definition of Done

- [ ] Functional requirements met (AC 1-4)
- [ ] Integration requirements verified (AC 5-7)
- [ ] Demo script created and concise (2-3 pages)
- [ ] Opening, flow, and closing clearly defined
- [ ] Features to highlight specified
- [ ] Topics to avoid documented
- [ ] Timing guidance included (15-20 minutes)
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
