# Story 2.6: Contingency Plans and Rollback Procedures

**Epic:** Epic 2 - Demo Preparation & Quality Assurance
**Story ID:** 2.6
**Priority:** High
**Estimated Effort:** 1-2 hours

---

## User Story

As a demo presenter facing technical issues,
I want documented backup plans,
So that I can recover gracefully from failures.

---

## Story Context

**Existing System Integration:**
- Integrates with: Vercel deployment, Supabase database, Vapi configuration
- Technology: Documentation format with executable procedures
- Follows pattern: Markdown documentation in `/docs/` directory
- Touch points: Emergency recovery procedures, rollback scripts

**Current Behavior:**
No documented contingency plans, potential panic or unprofessional handling of demo failures.

**Target Behavior:**
Clear documented backup plans and rollback procedures enabling graceful recovery from technical issues during demos.

---

## Acceptance Criteria

**Functional Requirements:**

1. Document (`docs/demo-contingency-plans.md`) containing:
   - **Vapi Downtime**: Backup human agent phone number, script for explaining "technical issue"
   - **Rollback Procedure**: Steps to revert to last working Vapi configuration using git + scripts
   - **Database Issues**: How to quickly restore from demo data backup
   - **Dashboard Not Updating**: Troubleshooting steps and fallback (show static screenshot)
2. Contact information for emergency support (Vapi support, team members)
3. Each plan includes: trigger condition, immediate action, recovery steps
4. Procedures tested during rehearsals
5. Printed copy available during demo (not just digital)

**Integration Requirements:**

6. Rollback procedures reference existing backup scripts or git commands
7. References Vercel rollback UI and Supabase recovery procedures
8. Compatible with existing deployment and infrastructure setup

**Quality Requirements:**

9. Procedures are actionable and clear (can be executed under pressure)
10. Contact information current and accessible
11. Trigger conditions clearly defined (when to use each plan)

---

## Technical Notes

- **Integration Approach:** Create actionable checklist-style document with clear "if-then" procedures
- **Existing Pattern Reference:** Similar to demo preparation checklist (Story 2.4) but focused on emergency scenarios
- **Key Constraints:**
  - Must be executable under pressure (clear, concise)
  - Contact information must be current
  - Procedures should be tested during rehearsals to ensure they work

---

## Tasks

- [ ] Create `/docs/demo-contingency-plans.md` file
- [ ] Add introduction section explaining purpose and usage
- [ ] Create section: "Vapi Downtime or Service Issues"
  - [ ] Trigger condition: Vapi not responding, voice quality issues
  - [ ] Immediate action: Switch to backup human agent phone number
  - [ ] Script for explaining to prospect: "We're experiencing a brief technical issue..."
  - [ ] Contact: Vapi support phone/email
- [ ] Create section: "Vapi Configuration Rollback"
  - [ ] Trigger condition: Agent behaving incorrectly after config change
  - [ ] Steps: `git log` to find last working config, `npm run tsx scripts/restore-vapi-config.ts`
  - [ ] Recovery time estimate: 2-3 minutes
  - [ ] Verification: Make test call to confirm restoration
- [ ] Create section: "Database Issues or Data Corruption"
  - [ ] Trigger condition: Dashboard not showing data, database errors
  - [ ] Steps: Run seed-demo-data.ts script to repopulate
  - [ ] Alternative: Restore from Supabase backup (if available)
  - [ ] Recovery time estimate: 3-5 minutes
- [ ] Create section: "Dashboard Not Updating (Supabase Realtime Issues)"
  - [ ] Trigger condition: New reservations not appearing in dashboard
  - [ ] Immediate action: Refresh browser, check network connection
  - [ ] Fallback: Show static screenshot of dashboard with reservations
  - [ ] Script: "Let me show you what the dashboard typically looks like..."
- [ ] Create section: "Webhook Errors or Reservation Creation Failures"
  - [ ] Trigger condition: Reservations not being created
  - [ ] Steps: Check webhook error logs, verify Vapi secret header
  - [ ] Fallback: Show manual reservation creation in dashboard
- [ ] Create section: "Emergency Contacts"
  - [ ] Vapi support: [phone/email]
  - [ ] Team members: [names and contact info]
  - [ ] Vercel support: [if applicable]
- [ ] Create section: "Vercel Deployment Rollback"
  - [ ] Trigger condition: Application not responding after deployment
  - [ ] Steps: Go to Vercel dashboard → Deployments → Click "Rollback"
  - [ ] Recovery time estimate: 1-2 minutes
- [ ] Add section: "Demo Cancellation Criteria" (when to abort rather than continue with issues)
- [ ] Add section: "Post-Incident Review" (what to document after demo issues)
- [ ] Review for completeness and clarity
- [ ] Test procedures during rehearsal (Story 2.4)
- [ ] Print physical copy for demo presenters

---

## Definition of Done

- [ ] Functional requirements met (AC 1-5)
- [ ] Integration requirements verified (AC 6-8)
- [ ] All major failure scenarios documented
- [ ] Each plan has clear trigger conditions
- [ ] Recovery procedures are actionable
- [ ] Emergency contacts documented
- [ ] Procedures tested during rehearsal
- [ ] Printed copy prepared for demo use
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
