# Story 1.10: Basic Error Logging

**Epic:** Epic 1 - Demo-Ready Voice Agent
**Story ID:** 1.10
**Priority:** Medium
**Estimated Effort:** 2-3 hours

---

## User Story

As a developer debugging issues,
I want all webhook errors logged with context,
So that I can investigate problems efficiently.

---

## Story Context

**Existing System Integration:**
- Integrates with: `/app/api/webhooks/vapi/route.ts` error handling, Story 1.2 error fallback procedure
- Technology: File-based logging (recommended) or Supabase error_logs table (alternative)
- Follows pattern: Centralized error logging module in `/lib/vapi/error-logging.ts`
- Touch points: All webhook try-catch blocks, technical error scenarios from Story 1.2

**Current Behavior:**
Errors may be logged inconsistently via console.error() calls, lacking structured context for debugging.

**Target Behavior:**
All webhook errors logged with structured context (timestamp, error type, call_id, stack trace) to centralized location for efficient debugging.

---

## Acceptance Criteria

**Functional Requirements:**

1. All caught exceptions in webhook route MUST be logged with: timestamp, error message, stack trace, call_id, function_name
2. Logging can be file-based (`logs/webhook-errors.log`) or simple database table
3. Log entries include request payload (sanitized of PII if needed)
4. Successful function calls logged at INFO level (optional, for monitoring)
5. Logs are accessible for review during demo troubleshooting

**Integration Requirements:**

6. Centralized error logging module created (`/lib/vapi/error-logging.ts`)
7. All webhook error handlers use centralized module (no scattered console.error)
8. Story 1.2 technical error fallback integrates with this logging system
9. **Architect Decision:** File-based vs database logging (recommendation: start with file-based for simplicity)

**Quality Requirements:**

10. Structured log format (JSON recommended for parsing)
11. PII sanitization if request payloads logged
12. Log rotation if file-based (prevent unbounded growth)
13. Tested with various error types (timeout, function error, validation error)

---

## Technical Notes

- **Integration Approach:**
  1. Create `/lib/vapi/error-logging.ts` with `logWebhookError()` function
  2. Decide: file-based (fs/promises) or database table
  3. Integrate with all webhook try-catch blocks
  4. Add to Story 1.2 technical error fallback path
- **Existing Pattern Reference:** TypeScript module with async logging function, structured error context interface
- **Key Constraints:**
  - Must not block webhook response (async logging)
  - PII sanitization for customer names/phones
  - If file-based: ensure logs directory exists, handle write errors gracefully
  - If database: create simple error_logs table with minimal schema

**Recommendation:** Start with file-based logging for simplicity, migrate to database if querying/analysis becomes frequent.

---

## Tasks

- [ ] **Architect Decision:** Choose file-based or database logging approach
- [ ] Create `/lib/vapi/error-logging.ts` module
- [ ] Implement `logWebhookError(error: Error, context: WebhookContext)` function
- [ ] Define `WebhookContext` interface (call_id, function_name, payload)
- [ ] Implement file writing with async fs/promises (if file-based)
- [ ] OR create error_logs table migration (if database)
- [ ] Add PII sanitization for customer data in payloads
- [ ] Integrate with all webhook try-catch blocks in route.ts
- [ ] Integrate with Story 1.2 technical error fallback
- [ ] Add optional INFO-level logging for successful calls
- [ ] Test with simulated timeout error
- [ ] Test with simulated function error
- [ ] Test with validation error
- [ ] Verify logs created correctly (file or DB)
- [ ] Verify PII sanitized in logged payloads
- [ ] Confirm logging doesn't block webhook response

---

## Definition of Done

- [ ] Functional requirements met (AC 1-5)
- [ ] Integration requirements verified (AC 6-9)
- [ ] Centralized logging module created
- [ ] All webhook errors logged consistently
- [ ] Structured log format implemented
- [ ] PII sanitization functional
- [ ] 3+ error types tested
- [ ] Logs accessible and readable

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
