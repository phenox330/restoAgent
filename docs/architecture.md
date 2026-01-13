# RestoAgent Brownfield Enhancement Architecture

**Document Version:** v1.0
**Last Updated:** 2026-01-13
**Author:** Winston (Architect)

---

## Introduction

This document outlines the architectural approach for enhancing RestoAgent with demo-ready voice agent optimizations and robust error handling. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development of new features while ensuring seamless integration with the existing system.

**Relationship to Existing Architecture:**
This document supplements existing project architecture by defining how new components will integrate with current systems. Where conflicts arise between new and existing patterns, this document provides guidance on maintaining consistency while implementing enhancements.

### Existing Project Analysis

#### Current Project State

- **Primary Purpose:** SaaS platform providing AI-powered voice agents for restaurant reservation management via Vapi.ai
- **Current Tech Stack:** Next.js 14 (App Router), TypeScript 5.7 (strict mode), Supabase (PostgreSQL + Auth + Realtime), Vapi.ai (voice orchestration), Shadcn/ui + Tailwind CSS
- **Architecture Style:** Monolithic Next.js application with server-side rendering, API routes for webhooks, Supabase Row Level Security (RLS) for data access control
- **Deployment Method:** Vercel serverless deployment with Supabase cloud database

#### Available Documentation

- `/Users/phenox/Developer/restoagent/CLAUDE.md` - Comprehensive coding standards and project conventions
- `/Users/phenox/Developer/restoagent/docs/PRD.md` - Product requirements for demo optimization (v1.0)
- `/Users/phenox/Developer/restoagent/docs/VAPI_SETUP.md` - Vapi.ai integration configuration guide
- `/Users/phenox/Developer/restoagent/docs/TWILIO_SETUP.md` - Twilio SMS integration setup
- `/Users/phenox/Developer/restoagent/docs/brainstorming-session-results.md` - User journey analysis and optimization opportunities

#### Identified Constraints

- **Single-tenant architecture**: Currently hardcoded for one restaurant per deployment (multi-tenant deferred to Phase 2)
- **Vapi.ai dependency**: Core voice functionality relies on external service availability and webhook reliability
- **Manual testing only**: No automated test coverage currently (planned post-demo per PRD)
- **Vercel timeout limits**: Serverless functions have 10s default timeout (maxDuration can be configured)
- **Supabase RLS**: Service role required for webhook operations to bypass RLS policies
- **French language**: System designed exclusively for French-speaking users and date/time parsing

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial architecture document | 2026-01-13 | v1.0 | Brownfield enhancement architecture for demo optimization | Winston (Architect) |

---

## Enhancement Scope and Integration Strategy

### Enhancement Overview

**Enhancement Type:** Feature optimization and bug fixes for existing voice agent
**Scope:** Two epics covering voice agent refinement (10 stories) and demo preparation (6 stories) over 4-day implementation timeline
**Integration Impact:** Medium - Modifying existing webhook logic, adding new Vapi tool functions, extending database schema with optional fields, no breaking changes to existing functionality

### Integration Approach

**Code Integration Strategy:**
- Modify `/app/api/webhooks/vapi/route.ts` to add graceful error handling and fallback procedures
- Extend `/lib/vapi/tools.ts` with new tool functions (`find_and_update_reservation`, `find_and_cancel_reservation`)
- Add new `/lib/vapi/error-logging.ts` module for centralized error logging
- Enhance existing availability checking logic in `/lib/vapi/availability.ts` with explicit confirmation patterns
- Create new `/scripts/seed-demo-data.ts` for demo environment preparation

**Database Integration:**
- Add optional fields to existing `reservations` table: `request_type` (enum: 'standard', 'technical_error', 'large_group'), `needs_manager_callback` (boolean)
- Create new `error_logs` table for webhook debugging (or use file-based logging - to be determined during implementation)
- Add unique constraint to `reservations` table: `UNIQUE(restaurant_id, customer_phone, reservation_date, reservation_time)` to prevent race condition duplicates
- All schema changes use migration files in `/supabase/migrations/`

**API Integration:**
- Enhance existing `/api/webhooks/vapi` webhook to handle new tool-calls format
- Add validation for `x-vapi-secret` header before any database operations
- Implement timeout handling with graceful degradation
- No new public API endpoints required (webhook is server-to-server)

**UI Integration:**
- Minimal UI changes required (dashboard real-time updates already implemented via Supabase Realtime)
- Potential enhancement: Special requests queue view (deferred to post-demo backlog per PRD)
- Maintain existing Shadcn/ui component patterns and Tailwind CSS conventions

### Compatibility Requirements

- **Existing API Compatibility:** Full backward compatibility maintained - existing Vapi tool functions (`check_availability`, `create_reservation`, `cancel_reservation`) remain unchanged in signature
- **Database Schema Compatibility:** New fields added as nullable/optional with defaults - existing queries unaffected
- **UI/UX Consistency:** Adheres to existing Shadcn/ui patterns, mobile-first responsive design, and neutral color scheme
- **Performance Impact:** Webhook response time target <500ms (95th percentile) - database queries optimized with indexes, transaction locking for race conditions adds ~20-50ms overhead

---

## Tech Stack

### Existing Technology Stack

| Category | Current Technology | Version | Usage in Enhancement | Notes |
|----------|-------------------|---------|----------------------|-------|
| **Framework** | Next.js | 15.1.6 | Core application framework | Using App Router (not Pages Router) |
| **Language** | TypeScript | 5.7.2 | Strict mode enforced | No `any` types allowed |
| **Database** | Supabase (PostgreSQL) | 14+ | Add fields, migration scripts | RLS enabled on all tables |
| **Auth** | Supabase Auth | 2.88.0 | User authentication | JWT-based session management |
| **Voice AI** | Vapi.ai | N/A (external) | Add new tool functions | Eleven Labs voice, GPT-4o-mini LLM |
| **SMS** | Twilio | N/A (external) | Confirmation messaging | Already integrated in `/lib/sms/twilio.ts` |
| **UI Library** | Shadcn/ui | Latest | Minimal UI changes | Radix UI primitives + Tailwind |
| **Styling** | Tailwind CSS | 3.4.17 | Consistent styling | Mobile-first approach |
| **Data Fetching** | TanStack Query | 5.90.12 | Real-time dashboard updates | Already configured |
| **Validation** | Zod | 4.2.1 | Runtime input validation | Used in all API routes |
| **Testing** | Vitest | 4.0.16 | Manual testing only (for now) | Automated tests post-demo |
| **Date Utils** | date-fns | 4.1.0 | Date manipulation | French locale support |

### New Technology Additions

No new technologies required for this enhancement. All functionality can be implemented using the existing stack.

---

## Data Models and Schema Changes

### New Data Models

#### Error Log (Optional - TBD)

**Purpose:** Centralized storage for webhook errors and debugging information (alternative: file-based logging)

**Integration:** Standalone table, no foreign key dependencies (call_id stored as string for traceability)

**Key Attributes:**
- `id`: UUID - Primary key
- `error_type`: ENUM('webhook_timeout', 'function_error', 'validation_error', 'external_api_error') - Categorization
- `error_message`: TEXT - Human-readable error description
- `stack_trace`: TEXT (nullable) - Full stack trace for debugging
- `call_id`: TEXT (nullable) - Vapi call ID for correlation
- `function_name`: TEXT (nullable) - Which tool function failed
- `request_payload`: JSONB (nullable) - Full request body for reproduction
- `created_at`: TIMESTAMPTZ - Timestamp of error occurrence

**Relationships:**
- **With Existing:** Soft reference to `calls.vapi_call_id` via `call_id` string field (no FK constraint)
- **With New:** None

**Decision Point:** Architect to determine file-based vs database approach during Story 1.10 implementation. Recommendation: Start with file-based logging (`/logs/webhook-errors.log`) for simplicity, migrate to DB table if query/analysis becomes frequent.

### Schema Integration Strategy

**Database Changes Required:**
- **New Tables:** `error_logs` (conditional - TBD in Story 1.10)
- **Modified Tables:**
  - `reservations`: Add `request_type` VARCHAR, `needs_manager_callback` BOOLEAN
- **New Indexes:**
  - `CREATE UNIQUE INDEX idx_reservations_unique_booking ON reservations(restaurant_id, customer_phone, reservation_date, reservation_time) WHERE status != 'cancelled'` (race condition prevention)
- **Migration Strategy:** Sequential migrations in `/supabase/migrations/` folder, applied via Supabase CLI or dashboard

**Backward Compatibility:**
- New `reservations` fields are nullable with sensible defaults (`request_type` defaults to `'standard'`, `needs_manager_callback` defaults to `false`)
- Existing queries continue to function without modification
- RLS policies remain unchanged (inherited from existing restaurant_id FK relationship)

---

## Component Architecture

### New Components

#### Error Handler Module

**Responsibility:** Centralized error handling, logging, and graceful degradation for webhook operations

**Integration Points:**
- Called by `/app/api/webhooks/vapi/route.ts` in try-catch blocks
- Logs to file or database depending on implementation choice
- Returns standardized error responses to Vapi

**Key Interfaces:**
- `logWebhookError(error: Error, context: WebhookContext): Promise<void>` - Async logging
- `createFallbackResponse(toolCallId: string, error: Error): VapiToolResponse` - Generate caller-friendly error messages

**Dependencies:**
- **Existing Components:** `getSupabaseAdmin()` from `/lib/supabase/admin.ts` (if DB logging chosen)
- **New Components:** None

**Technology Stack:** TypeScript module (`/lib/vapi/error-logging.ts`), uses fs/promises for file logging or Supabase client for DB logging

---

#### Reservation Modification Tool

**Responsibility:** Handle `find_and_update_reservation` Vapi tool function - search for existing reservation, verify new availability, update booking

**Integration Points:**
- Registered in `/lib/vapi/tools.ts` `handleToolCall()` switch statement
- Uses existing `checkAvailability()` from `/lib/vapi/availability.ts`
- Updates `reservations` table via Supabase admin client

**Key Interfaces:**
- `findAndUpdateReservation(args: FindAndUpdateReservationArgs): Promise<ToolResult>` - Main function
- `FindAndUpdateReservationArgs` interface: `{ restaurant_id, customer_name, customer_phone?, new_date?, new_time?, new_number_of_guests? }`

**Dependencies:**
- **Existing Components:** `checkAvailability()`, `getSupabaseAdmin()`, date parsing utilities in `/lib/utils/date-fr.ts`
- **New Components:** Error logging module

**Technology Stack:** TypeScript function in `/lib/vapi/tools.ts`, Supabase PostgreSQL with transaction locking (`SELECT FOR UPDATE`)

---

#### Reservation Cancellation Tool

**Responsibility:** Handle `find_and_cancel_reservation` Vapi tool function - search for reservation by name/phone, update status to 'cancelled'

**Integration Points:**
- Registered in `/lib/vapi/tools.ts` `handleToolCall()` switch statement
- Updates `reservations` table status field
- Handles duplicate name scenarios by returning multiple matches for disambiguation

**Key Interfaces:**
- `findAndCancelReservation(args: FindAndCancelReservationArgs): Promise<ToolResult>` - Main function
- `FindAndCancelReservationArgs` interface: `{ restaurant_id, customer_name, customer_phone? }`

**Dependencies:**
- **Existing Components:** `getSupabaseAdmin()`, phone normalization utilities in `/lib/utils/phone.ts`
- **New Components:** Error logging module

**Technology Stack:** TypeScript function in `/lib/vapi/tools.ts`, Supabase PostgreSQL

---

#### Demo Data Seed Script

**Responsibility:** Populate database with realistic fake reservations for demo environment testing

**Integration Points:**
- Standalone executable script in `/scripts/seed-demo-data.ts`
- Uses Supabase admin client to insert data
- Configurable: number of reservations, date range, customer variety

**Key Interfaces:**
- `seedDemoData(restaurantId: string, options: SeedOptions): Promise<void>` - Main seeding function
- `SeedOptions` interface: `{ count: number, startDate: Date, endDate: Date }`

**Dependencies:**
- **Existing Components:** `getSupabaseAdmin()`
- **New Components:** None (standalone)

**Technology Stack:** TypeScript script executed via `ts-node` or compiled with `tsx`, uses faker.js or hardcoded realistic French names

---

### Component Interaction Diagram

```mermaid
graph TB
    subgraph "Vapi Voice Agent"
        A[Vapi.ai Platform]
    end

    subgraph "Next.js API Routes"
        B[/api/webhooks/vapi]
        C[Error Handler Module]
    end

    subgraph "Business Logic"
        D[handleToolCall Router]
        E[check_availability]
        F[create_reservation]
        G[find_and_update_reservation - NEW]
        H[find_and_cancel_reservation - NEW]
        I[Availability Calculator]
        J[Confidence Scorer]
    end

    subgraph "Data Layer"
        K[(Supabase PostgreSQL)]
        L[Supabase Admin Client]
    end

    subgraph "External Services"
        M[Twilio SMS API]
    end

    A -->|webhook POST| B
    B -->|parse & verify| C
    B -->|route tool call| D

    D --> E
    D --> F
    D --> G
    D --> H

    E --> I
    F --> J
    G --> I
    G --> L
    H --> L

    I --> L
    F --> M

    L --> K

    C -->|log errors| K
    C -.->|OR file logging| FileSystem[/logs/webhook-errors.log]

    B -->|return result| A
```

---

## API Design and Integration

### API Integration Strategy

**API Integration Strategy:** Extend existing `/api/webhooks/vapi` endpoint with new tool function handlers. No new public endpoints required. All communication is server-to-server between Vapi.ai and RestoAgent.

**Authentication:** Existing `x-vapi-secret` header validation via `withVapiWebhookVerification()` middleware in `/lib/vapi/webhook-verification.ts`. Validation MUST occur before any database operations (security requirement).

**Versioning:** Not applicable - webhook format defined by Vapi.ai specification. Internal function signatures versioned implicitly through PRD story numbering.

### New API Endpoints

No new HTTP endpoints required. All enhancements modify the existing webhook handler.

---

## External API Integration

### Vapi.ai API

- **Purpose:** Voice agent orchestration, speech-to-text transcription (Deepgram), text-to-speech synthesis (Eleven Labs), LLM reasoning (GPT-4o-mini)
- **Documentation:** https://docs.vapi.ai/
- **Base URL:** `https://api.vapi.ai` (outbound calls initiated via Vapi dashboard/API, not directly from RestoAgent)
- **Authentication:** Bearer token authentication for management API (stored in `VAPI_API_KEY` env var), webhook secret validation for inbound webhooks
- **Integration Method:** Passive webhook receiver (Vapi calls RestoAgent) + active management API for assistant configuration updates via `/scripts/update-vapi-config.ts`

**Key Endpoints Used:**
- `POST /assistant/{id}` - Update assistant configuration (SYSTEM_PROMPT, tools)
- Webhook receiver: `POST /api/webhooks/vapi` (RestoAgent endpoint called by Vapi)

**Error Handling:** Webhook timeout after 20 seconds triggers fallback contact capture procedure (FR11). Management API errors during config updates require manual retry (script-based, not user-facing).

---

### Twilio API

- **Purpose:** SMS confirmation messages for successful reservations
- **Documentation:** https://www.twilio.com/docs/sms
- **Base URL:** `https://api.twilio.com`
- **Authentication:** Account SID + Auth Token (stored in env vars)
- **Integration Method:** Direct REST API calls from `/lib/sms/twilio.ts`

**Key Endpoints Used:**
- `POST /2010-04-01/Accounts/{AccountSid}/Messages.json` - Send SMS

**Error Handling:** SMS failures logged but do not block reservation creation (best-effort delivery). User receives verbal confirmation from agent regardless of SMS status.

---

## Source Tree

### Existing Project Structure

```plaintext
/Users/phenox/Developer/restoagent/
├── app/                          # Next.js App Router pages and API routes
│   ├── (auth)/                  # Auth pages (login, signup)
│   ├── (dashboard)/             # Protected dashboard routes
│   ├── api/
│   │   ├── webhooks/vapi/route.ts    # PRIMARY INTEGRATION POINT
│   │   ├── cancel/[token]/route.ts
│   │   └── cron/send-reminders/route.ts
│   ├── cancel/[token]/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                      # Shadcn/ui components (DO NOT MODIFY)
│   ├── dashboard/
│   ├── reservations/
│   ├── calls/
│   ├── restaurant/
│   └── auth/
├── lib/
│   ├── vapi/
│   │   ├── tools.ts             # EXTENDS: Add new tool functions
│   │   ├── availability.ts      # MODIFIES: Add confirmation patterns
│   │   ├── webhook-verification.ts
│   │   ├── waitlist.ts
│   │   └── transfer.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── admin.ts             # Used for webhook operations
│   │   └── middleware.ts
│   ├── sms/
│   │   └── twilio.ts
│   ├── utils/
│   │   ├── date-fr.ts           # French date parsing utilities
│   │   └── phone.ts
│   ├── reservations/actions.ts
│   ├── restaurant/actions.ts
│   ├── calls/actions.ts
│   └── utils.ts
├── types/
│   ├── database.ts              # Supabase generated types
│   └── index.ts
├── supabase/
│   └── migrations/              # ADDS: New migration files
│       ├── 00001_initial_schema.sql
│       ├── 00002_add_prd_features.sql
│       └── ...
├── scripts/                     # ADDS: Demo seed script
│   ├── update-vapi-config.ts
│   ├── test-supabase-restaurant.ts
│   └── ...
├── docs/
│   ├── PRD.md
│   ├── architecture.md          # THIS DOCUMENT
│   ├── VAPI_SETUP.md
│   └── ...
└── CLAUDE.md                    # Coding conventions
```

### New File Organization

```plaintext
/Users/phenox/Developer/restoagent/
├── lib/
│   └── vapi/
│       └── error-logging.ts                 # NEW: Centralized error handling
├── scripts/
│   ├── seed-demo-data.ts                    # NEW: Demo data population
│   └── test-call-protocol.md                # NEW: Test call checklist
├── supabase/
│   └── migrations/
│       ├── 00006_add_reservation_request_type.sql   # NEW: request_type field
│       ├── 00007_add_race_condition_constraint.sql  # NEW: Unique constraint
│       └── 00008_create_error_logs_table.sql        # NEW: (conditional)
└── docs/
    ├── stories/                             # NEW: Story implementation docs
    │   ├── epic-1-story-1.1.md
    │   ├── epic-1-story-1.2.md
    │   └── ...
    └── demo-script.md                       # NEW: Demo rehearsal guide
```

### Integration Guidelines

- **File Naming:** kebab-case for all files (`error-logging.ts`, `seed-demo-data.ts`)
- **Folder Organization:** Group by functional domain (vapi tools in `/lib/vapi/`, scripts in `/scripts/`)
- **Import/Export Patterns:**
  - Barrel exports in index files for clean imports
  - Named exports preferred over default exports
  - Absolute imports using `@/` alias (e.g., `import { getSupabaseAdmin } from '@/lib/supabase/admin'`)

---

## Infrastructure and Deployment Integration

### Existing Infrastructure

**Current Deployment:** Vercel serverless deployment with automatic CI/CD on git push to main branch

**Infrastructure Tools:**
- Vercel CLI for local dev and deployment management
- Supabase CLI for database migrations and local dev
- GitHub for version control and CI/CD triggers

**Environments:**
- **Production:** Deployed at `restoagent.vercel.app` (or custom domain)
- **Preview:** Automatic deployment for all PR branches
- **Local:** `npm run dev` with local Supabase instance or cloud development project

### Enhancement Deployment Strategy

**Deployment Approach:**
- Feature branch workflow: Each story implemented in dedicated branch (e.g., `feature/story-1.1-confirmation`)
- PR-based review and testing on Vercel preview deployments
- Merge to `main` triggers automatic production deployment
- Database migrations applied manually via Supabase dashboard or CLI before code deployment

**Infrastructure Changes:**
- No infrastructure changes required
- Environment variables: Verify `VAPI_WEBHOOK_SECRET`, `VAPI_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` are set in Vercel
- Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`) required for webhook admin operations

**Pipeline Integration:**
- Existing Vercel deployment pipeline remains unchanged
- Manual step: Run database migrations before deploying code that depends on new schema
- Recommendation: Add migration check to deployment checklist (Story 2.6)

### Rollback Strategy

**Rollback Method:**
- Vercel instant rollback to previous deployment via dashboard (one-click)
- Database rollback: Reverse migration scripts (`.down.sql` files) prepared for each migration
- Vapi configuration rollback: `/scripts/backup-vapi-config.ts` and `/scripts/restore-vapi-config.ts` already implemented

**Risk Mitigation:**
- Backup Vapi assistant configuration before SYSTEM_PROMPT changes
- Test all stories in preview environment before merging to main
- Demo rehearsal (Story 2.4) catches issues before client-facing demos
- Canary testing: Make 20+ test calls after deployment (Story 2.3)

**Monitoring:**
- Vercel deployment logs for serverless function errors
- Supabase dashboard for database query performance
- Webhook error logs (file or DB) for Vapi integration issues
- Manual monitoring during demos (no automated alerting yet - post-demo enhancement)

---

## Coding Standards

### Existing Standards Compliance

**Code Style:**
- TypeScript strict mode enforced (`strict: true` in `tsconfig.json`)
- No `any` types allowed - use explicit types or generics
- ESLint + Next.js config for linting (`npm run lint`)

**Linting Rules:**
- Next.js recommended rules
- React hooks rules enforced
- Import order convention: React/Next → External libs → Internal components → Lib/utils → Types

**Testing Patterns:**
- Manual testing only for demo phase (Vitest configured for post-demo)
- Test calls documented in `/scripts/test-call-protocol.md`
- Story acceptance criteria serve as test checklist

**Documentation Style:**
- Inline comments only where logic is non-obvious
- Function-level JSDoc comments for public APIs
- No over-commenting of self-evident code

### Enhancement-Specific Standards

- **Error Messages:** All user-facing error messages MUST be in French and maintain professional tone
- **Logging Format:** Structured logging with JSON format including `timestamp`, `level`, `message`, `context` fields
- **Tool Function Naming:** Snake_case for Vapi tool function names (matches Vapi convention), camelCase for TypeScript implementation functions
- **Transaction Safety:** All reservation modifications MUST use PostgreSQL transaction locking (`SELECT FOR UPDATE`) to prevent race conditions

### Critical Integration Rules

- **Existing API Compatibility:** Do NOT modify existing tool function signatures (`check_availability`, `create_reservation`, `cancel_reservation`) - add new functions for new behaviors
- **Database Integration:** Always use `getSupabaseAdmin()` in webhook context to bypass RLS - NEVER use client-side Supabase client
- **Error Handling:** Catch ALL exceptions in webhook route, log with full context, return graceful message to Vapi - NEVER expose stack traces to caller
- **Logging Consistency:** Use centralized error logging module - avoid scattered `console.error()` calls

---

## Testing Strategy

### Integration with Existing Tests

**Existing Test Framework:** Vitest 4.0.16 with coverage reporting (`npm run test:coverage`)

**Test Organization:** Tests colocated in `__tests__/` directory or adjacent to source files with `.test.ts` suffix

**Coverage Requirements:** No coverage requirements enforced yet (manual testing phase)

### New Testing Requirements

#### Unit Tests for New Components

- **Framework:** Vitest (already configured)
- **Location:**
  - `/lib/vapi/__tests__/error-logging.test.ts`
  - `/lib/vapi/__tests__/tools.test.ts` (extend existing tests)
- **Coverage Target:** Deferred to post-demo (Story 2.6 documents test plan, implementation deferred)
- **Integration with Existing:** Use existing Vitest config, MSW for Supabase mocking

#### Integration Tests

- **Scope:** End-to-end webhook flow testing (Vapi webhook → tool execution → database update)
- **Existing System Verification:** Verify existing `check_availability` and `create_reservation` still function after modifications
- **New Feature Testing:**
  - Test `find_and_update_reservation` with concurrent modification scenarios
  - Test `find_and_cancel_reservation` with duplicate name handling
  - Test error logging module with various error types

#### Regression Testing

- **Existing Feature Verification:** Manual regression test checklist in Story 2.3 (20+ test calls covering all scenarios)
- **Automated Regression Suite:** Deferred to post-demo (PRD Phase 3)
- **Manual Testing Requirements:**
  - Test all existing reservation flows (create, modify, cancel) before and after each major change
  - Verify dashboard real-time updates still work
  - Test SMS confirmations
  - Verify webhook security validation

---

## Security Integration

### Existing Security Measures

**Authentication:** Supabase Auth with JWT-based sessions, HTTP-only cookies for session storage

**Authorization:** Row Level Security (RLS) enabled on all tables, policies restrict access to restaurant owner's data only

**Data Protection:**
- Environment variables for secrets (`.env.local` not committed to git)
- HTTPS enforced on all production deployments (Vercel default)
- Phone numbers stored with validation but not encrypted (PII consideration)

**Security Tools:**
- Next.js built-in XSS protection
- Supabase SQL injection prevention via parameterized queries
- Vercel DDoS protection and rate limiting

### Enhancement Security Requirements

**New Security Measures:**
- **Webhook signature validation:** `x-vapi-secret` header MUST be validated before ANY database operations (already implemented, ensure not bypassed in new code)
- **Race condition prevention:** Unique constraint + transaction locking prevents duplicate reservation attacks
- **Input validation:** Zod schemas for ALL tool function parameters (extend existing validation patterns)

**Integration Points:**
- Error logging: Sanitize PII before logging (customer phone/email redacted in logs)
- Demo seed script: Use fake data only, never real customer information
- Fallback contact capture: Store in database with same RLS protections as reservations

**Compliance Requirements:**
- GDPR considerations for French users (PII storage, right to deletion) - acknowledged, not implemented in MVP
- PCI compliance not required (no payment processing)

### Security Testing

**Existing Security Tests:** None (manual verification only)

**New Security Test Requirements:**
- Verify webhook rejects requests without valid `x-vapi-secret` header
- Test race condition prevention with concurrent requests
- Validate input sanitization prevents SQL injection in new tool functions

**Penetration Testing:** Not planned for demo phase (manual security review by architect during code review)

---

## Next Steps

### Story Manager Handoff

**Prompt for Story Manager:**

> You are working with the brownfield architecture document at `/Users/phenox/Developer/restoagent/docs/architecture.md` which defines the technical implementation approach for RestoAgent's demo optimization enhancements.
>
> **Key Integration Requirements (validated with user):**
> - All modifications extend existing `/app/api/webhooks/vapi/route.ts` and `/lib/vapi/tools.ts` - do NOT create separate webhooks
> - Use Supabase admin client (`getSupabaseAdmin()`) for ALL webhook database operations to bypass RLS
> - Maintain strict TypeScript mode - NO `any` types allowed
> - Follow existing code patterns documented in `/Users/phenox/Developer/restoagent/CLAUDE.md`
> - Database changes via migration files in `/supabase/migrations/` folder
>
> **Existing System Constraints (based on actual project analysis):**
> - Single-tenant architecture (one restaurant per deployment) - do NOT implement multi-tenant patterns yet
> - Vapi.ai webhook format: `tool-calls` events with `toolCalls` array containing `{ id, function: { name, arguments } }`
> - Database tables: `restaurants`, `reservations`, `calls`, `waitlist` with RLS enabled
> - French language only - all date/time parsing and error messages in French
>
> **First Story to Implement:**
> Epic 1, Story 1.1 (Explicit Reservation Confirmation) - Modify Vapi SYSTEM_PROMPT to add confirmation step before calling `check_availability`. Use `/scripts/update-vapi-config.ts` to deploy SYSTEM_PROMPT changes.
>
> **Integration Checkpoints:**
> - [ ] SYSTEM_PROMPT modification tested with 5+ test calls before marking story complete
> - [ ] No breaking changes to existing `check_availability` function signature
> - [ ] Confirmation template matches exact French wording from PRD FR3
>
> **Maintaining Existing System Integrity:**
> - Run `npm run lint` before each commit - zero errors required
> - Test all existing flows after each story (create, modify, cancel reservations)
> - Verify dashboard real-time updates still function via Supabase Realtime

---

### Developer Handoff

**Prompt for Developers:**

> You are implementing RestoAgent demo optimization enhancements based on:
> - **Architecture Document:** `/Users/phenox/Developer/restoagent/docs/architecture.md`
> - **Coding Standards:** `/Users/phenox/Developer/restoagent/CLAUDE.md`
> - **PRD Requirements:** `/Users/phenox/Developer/restoagent/docs/PRD.md`
>
> **Key Technical Decisions (based on real project constraints):**
> - **Error Logging Approach:** Start with file-based logging (`/logs/webhook-errors.log`), migrate to DB if needed - decision deferred to Story 1.10
> - **Transaction Locking:** Use `SELECT FOR UPDATE` in PostgreSQL for reservation modifications to prevent race conditions
> - **Tool Function Organization:** All Vapi tool handlers in `/lib/vapi/tools.ts` `handleToolCall()` switch statement
> - **SYSTEM_PROMPT Updates:** Use `/scripts/update-vapi-config.ts` script - never manual Vapi dashboard edits (ensures versioning)
>
> **Existing System Compatibility Requirements:**
> - **Webhook Response Format:** Must return `{ results: [{ toolCallId: string, result: string }] }` for tool-calls events
> - **Database Client Usage:**
>   - Webhooks: `getSupabaseAdmin()` from `/lib/supabase/admin.ts` (bypasses RLS)
>   - UI/Server Components: `createClient()` from `/lib/supabase/server.ts` (respects RLS)
>   - Client Components: `createClient()` from `/lib/supabase/client.ts` (respects RLS)
> - **Existing Functions:** Do NOT modify signatures of `check_availability`, `create_reservation`, `cancel_reservation` - these are called by existing Vapi configuration
>
> **Verification Steps for Each Story:**
> 1. TypeScript compiles without errors (`npm run build`)
> 2. ESLint passes (`npm run lint`)
> 3. Manual test calls verify acceptance criteria
> 4. Existing functionality regression tested (create/modify/cancel flows)
> 5. Dashboard real-time updates still work (Supabase Realtime)
> 6. No console errors in browser or server logs
>
> **Clear Sequencing to Minimize Risk:**
> - **Phase 1 (Days 1-2):** Stories 1.1-1.5 (core voice agent improvements, no database changes)
> - **Phase 2 (Day 3):** Stories 1.6-1.10 (database enhancements, error handling)
> - **Phase 3 (Day 4):** Epic 2 stories (demo preparation, testing, contingency)
>
> **Emergency Rollback Procedure:**
> - Vercel: Click "Rollback" in deployments tab
> - Database: Run reverse migration `.down.sql` file
> - Vapi: `npm run tsx scripts/restore-vapi-config.ts`

---

**End of Architecture Document**
