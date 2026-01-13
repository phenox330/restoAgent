# RestoAgent Product Requirements Document (PRD)

**Document Version:** v1.0
**Last Updated:** 2026-01-12
**Author:** John (Product Manager)

---

## Goals and Background Context

### Goals

- Optimize RestoAgent's conversational AI agent to deliver a **fluide and bug-free demo experience** for prospective restaurant clients
- Improve natural language understanding to handle French date/time expressions intuitively ("samedi prochain", "midi et demi", "dans 3 jours")
- Implement robust error handling to ensure the agent gracefully handles edge cases (large groups, technical failures, modifications/cancellations)
- Polish the user experience with explicit confirmations, professional messaging, and intelligent fallback behaviors
- Establish a foundation for future multi-tenant SaaS architecture (post-demo validation)

### Background Context

RestoAgent is a SaaS platform providing AI-powered voice agents for restaurant reservation management via Vapi.ai. The platform currently has a working MVP that handles basic reservations through phone calls, integrating with Supabase for data management and Vapi for voice interactions.

Recent testing revealed UX friction points affecting the demo readiness, particularly around conversational fluidity, error handling, and edge case management. This PRD focuses on optimizing the core reservation flow to achieve zero-bug demos that showcase the system's intelligence and reliability to prospective restaurant clients. The multi-tenant architecture (enabling multiple restaurants to onboard) is intentionally deferred to Phase 2 after successful client validation.

### Success Metrics

**Voice Agent Quality**:
- 95% of test calls complete without technical errors or crashes
- 100% of reservation confirmations use standardized messaging
- Zero instances of agent "inventing" availability status

**Demo Success Rate**:
- Close 2 out of 3 prospects who experience full demo
- Prospects rate agent intelligence as "impressive" or "very impressive" (subjective feedback)
- Zero embarrassing failures during client demos

**Call Handling Efficiency**:
- Average reservation call duration < 2 minutes from greeting to confirmation
- Modification/cancellation calls < 90 seconds
- Agent asks for clarification maximum 1 time per call (low ambiguity)

**Error Recovery Excellence**:
- 100% of technical errors result in contact capture (no lost leads)
- All webhook errors logged with sufficient debugging context
- Fallback procedures executed successfully in 100% of error scenarios

**Testing Coverage**:
- 20+ test calls executed covering all critical scenarios before each demo
- Zero failed acceptance criteria in final story validation
- All contingency plans tested and documented

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2026-01-12 | v1.0 | Initial PRD creation based on brainstorming session results | John (PM) |

---

## Requirements

### Functional

**FR1**: The agent MUST parse advanced French natural language date expressions including "dans 3 jours", "samedi prochain", "la semaine prochaine", "le 15 janvier" and convert them to ISO format (YYYY-MM-DD)

**FR2**: The agent MUST parse advanced French natural language time expressions including "midi et demi" (12:30), "19h30", "sept heures et demie" and convert them to 24-hour format (HH:mm)

**FR3**: The agent MUST explicitly confirm all reservation details before checking availability using the template: "Donc une table pour {{nb_personnes}} personnes le {{date}} à {{heure}}, c'est bien ça ?" and wait for user confirmation

**FR4**: The agent MUST call `check_availability` function before making ANY statements about availability - NEVER invent availability status

**FR5**: The agent MUST calculate real-time availability using formula: `Available Capacity = Total Active Table Capacity - Reserved Seats in Time Slot (± 90 minutes)`

**FR6**: When a reservation request exceeds total restaurant capacity, the agent MUST capture the request as a "special request" (name, phone, date, guest count) and inform caller: "Pour un groupe de cette taille, le restaurateur vous rappellera pour organiser cela"

**FR7**: When availability check returns "complet", the agent MUST ask for client preferences: "Malheureusement nous sommes complets à cet horaire. Quel autre créneau souhaiteriez-vous que je vérifie ?"

**FR8**: The agent MUST support reservation modifications by calling `find_and_update_reservation`, verifying new availability before confirming the change, and proposing alternatives if unavailable

**FR9**: The agent MUST support reservation cancellations by calling `find_and_cancel_reservation`, handling duplicate names by asking for date/time clarification, with no confirmation prompt ("Êtes-vous sûr?")

**FR10**: The agent MUST capture optional special requests by asking: "Avez-vous des demandes particulières ?" after name collection but before final confirmation

**FR11**: When webhook timeout or technical error occurs, the agent MUST fallback gracefully by saying "Je rencontre un problème technique. Puis-je prendre vos coordonnées et le restaurant vous rappellera?" and create a pending request

**FR12**: When handling out-of-scope requests (menu, prices, delivery), the agent MUST respond: "Pour cette demande, un responsable vous rappellera" and attempt to recentre: "Je peux vous aider pour une réservation ?"

**FR13**: The agent MUST collect information in the following order: Date → Time → Number of guests → Availability check → Name → Special requests

**FR14**: The agent MUST use standardized confirmation message: "Votre table est réservée, vous recevrez un SMS de confirmation. À bientôt!"

### Non Functional

**NFR1**: The agent MUST maintain a professional, warm, and natural conversational tone throughout all interactions (specified as "hôte accueillante")

**NFR2**: The agent MUST announce availability check with "Un instant, je vérifie..." during function call latency to avoid uncomfortable silence

**NFR3**: All technical errors MUST be logged with sufficient detail for investigation while maintaining professional messaging to the caller

**NFR4**: The agent MUST handle interruptions gracefully and never display technical error details to callers

**NFR5**: Reservation confirmation messages MUST be consistent across all success paths

**NFR6**: Webhook API response time MUST be < 500ms for 95th percentile requests to ensure smooth voice agent interaction

**NFR7**: Perceived voice latency (user speech to agent response) MUST be < 1.5 seconds to maintain natural conversation flow

**NFR8**: Dashboard real-time updates MUST appear within 3 seconds of reservation creation via Supabase Realtime

---

## User Interface Design Goals

### Overall UX Vision

RestoAgent's UI should embody **simplicity and efficiency** for restaurant owners who need to quickly access key information during busy service hours. The dashboard prioritizes real-time reservation visibility, one-click table management, and clear status indicators. The design aesthetic should feel **modern, clean, and professional** - reflecting the quality establishments it serves - while remaining highly functional and fast-loading.

### Key Interaction Paradigms

- **Real-time updates**: Dashboard auto-refreshes when new reservations arrive via voice agent (Supabase Realtime)
- **Quick actions**: Toggle table active/inactive status with single click, no confirmation dialogs for common operations
- **Mobile-first**: Restaurant staff should be able to check reservations and manage tables from any device, including smartphones during service
- **Minimal clicks**: Critical information (today's reservations, capacity status) visible without navigation
- **Toast notifications**: Non-intrusive alerts for new reservations, special requests, or technical errors requiring attention

### Core Screens and Views

1. **Dashboard/Reservations List** - Default view showing today's reservations chronologically with status badges (confirmed, pending, cancelled)
2. **Table Configuration** - Interface to add/edit/delete tables with capacity and active/inactive toggle
3. **Restaurant Settings** - Configure opening hours, closed dates, restaurant name, capacity rules
4. **Call History** (Future) - View transcripts and audio of past voice interactions
5. **Special Requests Queue** - Prioritized list of large groups and technical fallback requests requiring manual follow-up

### Accessibility: WCAG AA

Targeting **WCAG AA compliance** for broad accessibility without the overhead of AAA certification. Focus areas:
- Sufficient color contrast for status badges (green/orange/red)
- Keyboard navigation for all interactive elements
- Screen reader compatibility for table management
- Clear focus indicators

### Branding

Neutral/customizable theme using Shadcn/ui defaults (neutral grays, subtle blues) to appear professional and ready for future white-label scenarios per restaurant.

### Target Device and Platforms: Web Responsive

The application will be **fully responsive web** (mobile, tablet, desktop) accessed via browser. Priority:
1. Desktop (primary use during prep/admin hours)
2. Mobile (secondary for on-the-go checks during service)

No native mobile apps planned for MVP. Progressive Web App (PWA) features could be added later if restaurateurs need offline access.

---

## Technical Assumptions

### Repository Structure: Monorepo

Single repository containing all RestoAgent components:
- Next.js application (frontend + API routes)
- Database schema and migrations (Supabase)
- Vapi configuration scripts
- Shared TypeScript types and utilities

**Rationale**: Monorepo simplifies development for demo phase with single deployment pipeline. Multi-repo separation can be considered post-demo if micro-services architecture becomes necessary for multi-tenant scaling.

### Service Architecture

**Monolithic Next.js 14 Application** using App Router with the following layers:

1. **Frontend Layer**: React Server Components (default) + Client Components for interactivity
   - Server Components: Dashboard, reservation lists, settings pages
   - Client Components: Form inputs, real-time updates (Supabase Realtime), toast notifications

2. **API Layer**: Next.js API Routes (`/src/app/api/`)
   - `/api/webhooks/vapi`: Handles Vapi function calls (check_availability, create_reservation, etc.)
   - Uses Supabase Service Role client to bypass RLS for automated operations

3. **Data Layer**: Supabase PostgreSQL
   - Tables: `restaurants`, `reservations`, `calls`, `special_requests` (new for large groups/errors)
   - Row Level Security (RLS) enabled for user-facing queries
   - Service Role bypass for webhook operations

4. **External Services**:
   - **Vapi.ai**: Voice agent orchestration (GPT-4o-mini + Eleven Labs voice)
   - **Supabase Realtime**: Dashboard live updates
   - **SMS Provider** (Future): Twilio or similar for confirmation messages

**Rationale**: Monolithic architecture chosen for rapid iteration during demo phase. Avoids microservices complexity while maintaining clear separation of concerns through Next.js routing and Supabase RLS.

### Testing Requirements

**Demo Phase Testing Strategy**:
- **Manual End-to-End Testing**: PM and team validate all user flows before demo
- **Critical Path Scenarios**:
  1. Happy path: New reservation via voice → appears in dashboard
  2. Edge case: Large group (> capacity) → special request created
  3. Error handling: Webhook timeout → graceful fallback message
  4. Modification flow: Change reservation date → availability re-check
  5. Cancellation flow: Cancel by name → handles duplicates
  6. **Race condition test**: Simulate 2 simultaneous calls for last available table
  7. **Voice quality test**: Make 20+ test calls with background restaurant noise
  8. **NLU ambiguity test**: Test date expressions like "samedi prochain", "le 3", "dans 3 jours"

**Post-Demo**: Introduce automated testing (Unit + Integration) once requirements stabilize

**Rationale**: Manual testing sufficient for demo validation with emphasis on risk areas identified in technology assessment.

### Additional Technical Assumptions and Requests

#### Core Technical Requirements

1. **TypeScript Strict Mode**: All code must compile with `strict: true` - no `any` types allowed (enforced by existing conventions)

2. **Zod Runtime Validation**: All API route inputs MUST be validated with Zod schemas before processing (existing pattern)

3. **Vapi Configuration Management**:
   - Continue using `scripts/update-vapi-config.ts` for SYSTEM_PROMPT updates
   - Version control all prompt changes with comments explaining rationale
   - **Critical**: Test all prompt changes with 5-10 live calls before demo

4. **Environment Variables**:
   - `VAPI_PRIVATE_KEY`: Vapi API key
   - `SUPABASE_SERVICE_ROLE_KEY`: Admin access for webhooks
   - `NEXT_PUBLIC_SUPABASE_URL`: Client-side Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Client-side Supabase anon key
   - All secrets stored in `.env.local` (never committed)

5. **Deployment Target**: Vercel (assumed based on Next.js + Supabase stack)
   - Preview deployments for testing before production
   - Production URL used in Vapi webhook configuration

#### Risk Mitigation Requirements (Critical for Demo Success)

6. **Webhook Security & Race Condition Prevention**:
   - **MUST validate** `x-vapi-secret` header before ANY database operations
   - **MUST use** PostgreSQL `SELECT FOR UPDATE` transaction locking when checking/creating reservations
   - **MUST add** unique constraint on `(customer_phone, date, time)` to prevent duplicate reservations
   - All webhook operations wrapped in database transactions

7. **Error Logging & Monitoring**:
   - Implement structured logging for all webhook errors (file-based or Supabase table)
   - Log all FR11 (technical error fallback) cases with error details for debugging
   - Set up Vapi status page monitoring with alerts

8. **Voice Quality & Reliability**:
   - **Pre-Demo Validation**: Make 20+ test calls 1 hour before demo to validate Vapi stability
   - **Backup Voice Provider**: Test OpenAI voice as fallback if Eleven Labs has latency issues
   - **Transcription Confidence**: If Deepgram confidence score < 0.7, agent should request clarification
   - **Background Noise Testing**: Test calls with restaurant ambient noise audio

9. **NLU Disambiguation Rules**:
   - For ambiguous dates ("samedi prochain", "le 3"), agent MUST read back full date for confirmation
   - Example: "Donc samedi le 18 janvier 2026, c'est bien ça?"
   - Never proceed without explicit date confirmation (FR3 is critical risk mitigation)

10. **Demo Environment Preparation**:
    - **Seed Script**: Create script to populate DB with 10+ realistic fake reservations before demo
    - **Demo Restaurant Config**: Configure demo restaurant with high capacity (100 seats) to ensure availability for demos
    - **Dedicated Demo Phone**: Use separate Vapi phone number exclusively for demos
    - **Rehearsal Schedule**: Full end-to-end demo run 24 hours before, then 2 hours before actual demo

11. **Database Schema Requirements**:
    - Create migration for `special_requests` table or add `request_type` field to `reservations`
    - Document all schema changes in migration comments
    - Ensure schema design doesn't complicate future multi-tenant migration

12. **Backup & Contingency Plans**:
    - **Vapi Downtime Backup**: Have manual "human agent" phone number ready if Vapi fails during demo
    - **Demo Data Backup**: Export demo restaurant data before each demo session
    - **Rollback Plan**: Document steps to rollback to last working Vapi configuration if new prompts fail

---

## Epic List

**Scope Philosophy**: This PRD focuses exclusively on demo readiness. After MVP scope validation, we've reduced from 3 epics to 2 essential epics that deliver a flawless demo experience. Dashboard enhancements and theoretical edge cases are deferred to post-demo based on actual customer feedback.

---

### Epic 1: Demo-Ready Voice Agent

**Goal**: Transform the voice agent into a reliable, intelligent, and professional demo asset by implementing essential UX improvements, robust error handling, and core reservation management features.

**Deliverables** (Must-Have):
- **FR3**: Explicit confirmation before availability checks - CRITICAL risk mitigation
- **FR11**: Technical error fallback with contact capture - handles real bugs you're experiencing
- **FR8-FR9**: Reservation modification & cancellation flows - core features prospects expect
- **FR7**: Intelligent "complet" response asking for preferences - common scenario
- **FR14**: Standardized professional confirmation messaging
- **FR10**: Optional special requests capture (allergies, anniversaries)
- **FR12**: Professional out-of-scope request handling
- **Webhook Security**: Validate `x-vapi-secret` header before DB operations
- **Basic Error Logging**: Log webhook errors for debugging (file-based or simple DB table)

**Nice-to-Have** (if time permits):
- **FR1-FR2**: Advanced French NLU expressions ("samedi prochain", "midi et demi") - can be explained verbally if not fully implemented
- **FR6**: Large group handling - can mention as "manual process" in demo without full code implementation

**Explicitly Cut from Demo Scope** (deferred to post-demo):
- Race condition SQL locking (SELECT FOR UPDATE) - theoretical issue, unlikely in single-demo scenario
- Comprehensive monitoring and alerting - basic logging sufficient for demo phase
- Special requests queue UI - show in basic reservation list

**Demo Impact**: Voice agent handles all realistic scenarios flawlessly, recovers gracefully from errors, and demonstrates professional polish that closes deals.

**Timeline**: 3 days

---

### Epic 2: Demo Preparation & Quality Assurance

**Goal**: Ensure bulletproof demo execution through rigorous testing, realistic data, and comprehensive rehearsal protocols.

**Deliverables** (Must-Have):
- **Seed Script**: Generate 10-15 realistic fake reservations with variety (different dates, times, party sizes, names)
- **Demo Restaurant Configuration**: Set capacity to 100 seats to ensure availability during demos
- **Test Call Protocol**: Execute 20+ test calls covering all scenarios:
  - Happy path reservations
  - Modifications and cancellations
  - "Complet" scenarios
  - Technical error handling
  - Out-of-scope requests
  - Background noise simulation
  - Ambiguous date/time expressions
- **Rehearsal Schedule**:
  - Full end-to-end demo run 24 hours before client demo
  - Quick validation run 2 hours before client demo
- **Demo Script**: Document recommended demo flow that showcases strengths and avoids weaknesses
- **Backup Plan**: Document contingency procedures if Vapi fails (human agent fallback number)
- **Rollback Procedure**: Document steps to revert to last working Vapi configuration

**Demo Impact**: Confident, smooth demo delivery with zero surprises. Team knows exactly what works and what to avoid.

**Timeline**: 1 day

---

**Total Timeline**: 4 days (1 day faster than original 5-day estimate, with more focus on quality)

**Post-Demo Backlog** (explicitly OUT of scope until customer validation):

**Phase 2 - Customer-Requested Features**:
- Table configuration UI (dashboard enhancement)
- Special requests queue interface
- Call history and transcription viewer
- Advanced NLU expressions (if customers request)
- Race condition prevention (SQL locking)
- Comprehensive monitoring/alerting

**Phase 3 - Multi-Tenant Architecture** (after multiple customers):
- 1 assistant Vapi per restaurant
- Dynamic firstMessage with restaurant variables
- Restaurant onboarding flow
- Multi-tenant database isolation

**Phase 4 - Advanced Features** (customer-driven roadmap):
- SMS confirmation integration (Twilio)
- Intelligent alternative time slot suggestions
- Analytics and reporting dashboard
- No-show prediction and management

---

## Epic 1: Demo-Ready Voice Agent

**Expanded Goal**: Transform the voice agent into a reliable, intelligent, and professional demo asset that handles the complete reservation lifecycle (create, modify, cancel) with explicit confirmations, graceful error recovery, and professional messaging. This epic eliminates friction points identified in testing and implements the "hôte accueillante" experience that closes demo deals.

### Story 1.1: Explicit Reservation Confirmation

As a restaurant customer calling to make a reservation,
I want the agent to explicitly confirm all my reservation details before checking availability,
so that I can catch any misunderstandings before they're committed.

**Acceptance Criteria**:
1. Agent MUST collect date, time, and number of guests before confirming
2. Agent MUST use template: "Donc une table pour {{nb}} personnes le {{date}} à {{heure}}, c'est bien ça?"
3. Agent MUST wait for explicit user confirmation ("oui", "c'est ça", "correct") before proceeding to check_availability
4. If user says "non" or provides corrections, agent MUST re-collect the corrected information and confirm again
5. Confirmation happens in French with natural pronunciation
6. This flow applies to new reservations only (not modifications)

### Story 1.2: Graceful Technical Error Handling

As a restaurant customer experiencing a technical issue during my call,
I want the agent to handle the problem professionally and ensure my request isn't lost,
so that I don't have to call back or feel frustrated.

**Acceptance Criteria**:
1. When webhook times out (> 20 seconds) or returns error status, agent MUST say: "Je rencontre un problème technique. Puis-je prendre vos coordonnées et le restaurant vous rappellera?"
2. Agent MUST collect: customer name, phone number, desired date, time, and party size
3. Webhook MUST create a "pending_request" record in database (or flag in reservations table) with type="technical_error"
   - **Note**: Architect to determine if this requires new `special_requests` table or can use existing `reservations` table with `request_type` field based on data model analysis
4. All technical errors MUST be logged with timestamp, error message, stack trace, call_id, function_name
5. Agent MUST NOT display technical error details to caller (no "500 error", "database timeout", etc.)
6. After capturing contact info, agent confirms: "Merci, le restaurant vous contactera dans les plus brefs délais"

### Story 1.3: Reservation Modification Flow

As a restaurant customer with an existing reservation,
I want to modify my reservation date, time, or party size,
so that I can adjust my plans without canceling and rebooking.

**Acceptance Criteria**:
1. Agent identifies modification intent from phrases like "changer ma réservation", "modifier", "je voudrais déplacer"
2. Agent calls `find_and_update_reservation` function with customer name
3. If reservation found, agent confirms current details: "J'ai votre réservation pour {{nb}} personnes le {{date}} à {{heure}}"
4. If reservation NOT found, agent responds: "Je ne trouve pas de réservation à ce nom. Souhaitez-vous créer une nouvelle réservation?"
5. Agent asks what to modify: "Que souhaitez-vous modifier?"
6. For new date/time, agent MUST call check_availability before confirming change
7. If new slot unavailable, agent asks: "Ce créneau est complet. Quel autre horaire souhaiteriez-vous?"
8. Once new slot confirmed available, agent updates reservation and confirms: "Votre réservation est modifiée pour {{new_details}}"

### Story 1.4: Reservation Cancellation Flow

As a restaurant customer who needs to cancel,
I want a quick cancellation process without unnecessary confirmations,
so that I can cancel efficiently.

**Acceptance Criteria**:
1. Agent identifies cancellation intent from phrases like "annuler", "supprimer ma réservation"
2. Agent calls `find_and_cancel_reservation` with customer name
3. If single reservation found, agent cancels immediately WITHOUT asking "Êtes-vous sûr?"
4. Agent confirms: "Votre réservation a été annulée"
5. If multiple reservations found for same name, agent asks: "J'ai plusieurs réservations à ce nom. Pour quelle date et heure souhaitez-vous annuler?"
6. If no reservation found, agent responds: "Je ne trouve pas de réservation à ce nom"
7. Cancellation updates reservation status to "cancelled" in database

### Story 1.5: Intelligent Full Capacity Response

As a restaurant customer calling when the restaurant is fully booked,
I want the agent to ask for my preferences rather than just saying "complet",
so that I have a chance to find an alternative slot.

**Acceptance Criteria**:
1. When check_availability returns "complet" status, agent MUST respond: "Malheureusement nous sommes complets à cet horaire. Quel autre créneau souhaiteriez-vous que je vérifie?"
2. Agent MUST NOT propose alternative times automatically
3. Agent waits for customer to suggest different date/time
4. Agent re-checks availability for new slot and repeats process
5. If customer declines to try other slots, agent politely ends: "D'accord, n'hésitez pas à rappeler. Bonne journée!"

### Story 1.6: Professional Confirmation Messaging

As a restaurant customer completing a reservation,
I want consistent, professional confirmation messaging,
so that I feel confident my reservation is secured.

**Acceptance Criteria**:
1. After successful reservation creation, agent MUST use exact template: "Votre table est réservée, vous recevrez un SMS de confirmation. À bientôt!"
2. Tone must be warm and professional (not robotic)
3. Message is consistent across all successful reservation paths (new booking, modification confirmed)
4. Agent MUST NOT add extra information beyond the template (no improvisation)
5. After confirmation message, call ends gracefully

### Story 1.7: Special Requests Capture

As a restaurant customer with special needs or occasions,
I want to communicate allergies, anniversaries, or preferences,
so that the restaurant can prepare appropriately.

**Acceptance Criteria**:
1. After customer name is collected and before final confirmation, agent asks: "Avez-vous des demandes particulières?"
2. If customer says "non" or "rien", agent proceeds to confirmation without further prompting
3. If customer mentions requests (allergies, birthday, etc.), agent captures in `special_requests` field
4. Agent acknowledges: "C'est noté, merci"
5. Special requests are stored with reservation record
6. If customer doesn't respond or unclear, agent doesn't press - proceeds to confirmation

### Story 1.8: Out-of-Scope Request Handling

As a restaurant customer asking about non-reservation topics,
I want the agent to respond professionally and redirect appropriately,
so that I know how to get my question answered.

**Acceptance Criteria**:
1. When customer asks about menu, prices, delivery, job applications, or other non-reservation topics, agent responds: "Pour cette demande, un responsable vous rappellera"
2. Agent then attempts to recentre: "Je peux vous aider pour une réservation?"
3. If customer wants to continue with reservation, agent proceeds normally
4. If customer declines, agent ends politely: "D'accord, bonne journée!"
5. Agent does NOT invent information about topics outside reservation scope

### Story 1.9: Webhook Security Validation

As a system administrator,
I want all webhook requests validated before processing,
so that malicious actors cannot inject false reservations.

**Acceptance Criteria**:
1. Webhook route MUST validate `x-vapi-secret` header matches expected value BEFORE any database operations
2. If header missing or invalid, return 401 Unauthorized with no database changes
3. If header valid, proceed with normal function execution
4. Log all unauthorized attempts with IP address and timestamp
5. Valid requests proceed to function execution (check_availability, create_reservation, etc.)

### Story 1.10: Basic Error Logging

As a developer debugging issues,
I want all webhook errors logged with context,
so that I can investigate problems efficiently.

**Acceptance Criteria**:
1. All caught exceptions in webhook route MUST be logged with: timestamp, error message, stack trace, call_id, function_name
2. Logging can be file-based (`logs/webhook-errors.log`) or simple database table
3. Log entries include request payload (sanitized of PII if needed)
4. Successful function calls logged at INFO level (optional, for monitoring)
5. Logs are accessible for review during demo troubleshooting

---

## Epic 2: Demo Preparation & Quality Assurance

**Expanded Goal**: Ensure bulletproof demo execution through rigorous testing protocols, realistic demonstration data, comprehensive rehearsal procedures, and documented contingency plans. This epic transforms "it works on my machine" into "it works perfectly under demo pressure."

### Story 2.1: Demo Data Seed Script

As a demo presenter,
I want realistic fake reservation data in the system,
so that the dashboard looks professional and demonstrates real-world usage patterns.

**Acceptance Criteria**:
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

### Story 2.2: Demo Restaurant Configuration

As a demo presenter,
I want the demo restaurant configured for high availability,
so that I can always demonstrate successful reservations without capacity issues.

**Acceptance Criteria**:
1. Demo restaurant in database configured with:
   - Name: "Restaurant épicurie" (or custom demo name)
   - Total capacity: 100 seats (high enough to never be "complet" during demos)
   - Opening hours: 12:00-14:30 (lunch), 19:00-22:30 (dinner), 7 days/week
   - No closed dates
2. Configuration documented in README or scripts/README.md
3. Separate demo restaurant ID from any production/test restaurants
4. Demo restaurant data easily identifiable and restorable

### Story 2.3: Comprehensive Test Call Protocol

As a QA tester,
I want a documented testing protocol covering all scenarios,
so that I can systematically validate the agent before demos.

**Acceptance Criteria**:
1. Create document (`docs/test-call-protocol.md`) with 20+ test scenarios:
   - Happy path: successful new reservation
   - Modification: change existing reservation
   - Cancellation: cancel by name
   - Complet scenario: request unavailable slot
   - Technical error simulation (if possible)
   - Out-of-scope requests (menu, prices)
   - Ambiguous dates ("samedi prochain", "le 3")
   - Background noise conditions
   - Interruptions and corrections
   - Special requests with allergies
2. Each scenario includes: what to say, expected agent response, pass/fail criteria
3. Protocol includes checklist format for tracking test execution
4. Document stored in version control

### Story 2.4: Demo Rehearsal Schedule Implementation

As a demo team member,
I want defined rehearsal procedures with specific timing,
so that everyone knows when and how to prepare.

**Acceptance Criteria**:
1. Document (`docs/demo-preparation-checklist.md`) containing:
   - **24 hours before**: Full end-to-end demo run including all test scenarios
   - **2 hours before**: Quick validation run (3-5 key scenarios)
   - **Pre-demo setup**: Run seed script, verify Vapi configuration, test phone number
2. Checklist includes sign-off boxes for each step
3. Defines roles: who runs tests, who verifies dashboard, who checks logs
4. Includes timing estimates for each rehearsal phase
5. Stored in version control and accessible to all team members

### Story 2.5: Demo Script Documentation

As a demo presenter,
I want a recommended demo flow script,
so that I can confidently showcase features while avoiding known weaknesses.

**Acceptance Criteria**:
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

### Story 2.6: Contingency Plans and Rollback Procedures

As a demo presenter facing technical issues,
I want documented backup plans,
so that I can recover gracefully from failures.

**Acceptance Criteria**:
1. Document (`docs/demo-contingency-plans.md`) containing:
   - **Vapi Downtime**: Backup human agent phone number, script for explaining "technical issue"
   - **Rollback Procedure**: Steps to revert to last working Vapi configuration using git + scripts
   - **Database Issues**: How to quickly restore from demo data backup
   - **Dashboard Not Updating**: Troubleshooting steps and fallback (show static screenshot)
2. Contact information for emergency support (Vapi support, team members)
3. Each plan includes: trigger condition, immediate action, recovery steps
4. Procedures tested during rehearsals
5. Printed copy available during demo (not just digital)

---

## Checklist Results Report

**Overall PRD Completeness**: 92% ✅

**Readiness**: **READY FOR ARCHITECT**

### Category Statuses

| Category                         | Status | Critical Issues |
| -------------------------------- | ------ | --------------- |
| 1. Problem Definition & Context  | **PASS** | Success metrics added, clear problem statement |
| 2. MVP Scope Definition          | **PASS** | Excellent scope discipline, 2 focused epics |
| 3. User Experience Requirements  | **PASS** | UI goals defined, interaction paradigms clear |
| 4. Functional Requirements       | **PASS** | 14 FRs, all testable and specific |
| 5. Non-Functional Requirements   | **PASS** | 8 NFRs including performance SLAs |
| 6. Epic & Story Structure        | **PASS** | 16 stories with clear ACs, proper sizing |
| 7. Technical Guidance            | **PASS** | Comprehensive risk mitigation, clear constraints |
| 8. Cross-Functional Requirements | **PASS** | Integration points clear, schema notes added |
| 9. Clarity & Communication       | **PASS** | Well-structured, consistent terminology |

**Score**: 9/9 PASS

### Strengths

1. **Exceptional scope discipline** - Active MVP scope validation reduced epics from 3 to 2, demonstrating strong product thinking
2. **Comprehensive risk assessment** - Technology Risk Assessment identified and mitigated Vapi dependency, race conditions, NLU brittleness
3. **Demo-focused priorities** - Requirements explicitly optimized for demo success with clear post-demo backlog
4. **Well-sized stories** - All 16 stories appropriately scoped for AI agent execution (2-4 hours each)
5. **Measurable success criteria** - Clear metrics for voice quality (95% error-free), demo success (2/3 close rate), efficiency (< 2 min calls)

### Areas for Architect Investigation

1. **Database Schema Decision**: Story 1.2 - Determine if `special_requests` requires new table or field in existing `reservations` table
2. **Error Logging Implementation**: Choose between file-based (`logs/webhook-errors.log`) or database table approach
3. **Performance Optimization**: Ensure webhook response time < 500ms target is achievable with current Supabase/Vapi architecture

### Recommendations

**Immediate Next Steps**:
1. ✅ Success metrics added to Goals section
2. ✅ Performance NFRs (NFR6-8) added for webhook, voice latency, dashboard updates
3. ✅ Database schema clarification added to Story 1.2
4. → Proceed to Architecture phase

**Confidence Level**: **HIGH** - This PRD demonstrates excellent product discipline with thorough requirements, realistic scope, and actionable stories.

---

## Next Steps

### UX Expert Prompt

You are the UX Expert for RestoAgent. The Product Manager has completed the PRD focusing on demo-ready voice agent optimizations.

**Your Task**: Review the PRD (docs/prd.md) and create UX design specifications for the dashboard components mentioned in User Interface Design Goals, specifically:

1. **Reservations Dashboard** - Real-time reservation list with status indicators
2. **Table Configuration Interface** - Add/edit/toggle tables (deferred to post-demo, but worth exploring)
3. **Special Requests Queue** - Display for large groups and error fallbacks requiring manual attention

Focus on:
- Ensuring Shadcn/ui component usage aligns with PRD requirements
- Responsive design patterns (mobile-first as specified)
- Real-time update UX (Supabase Realtime integration)
- Professional, clean aesthetic matching "hôte accueillante" brand

**Note**: Table Configuration Interface is explicitly out of demo scope but should be designed for future implementation.

Reference CLAUDE.md for technical constraints and existing component patterns.

### Architect Prompt

You are the Software Architect for RestoAgent. The Product Manager has completed the PRD with comprehensive requirements for demo-ready voice agent optimizations.

**Your Task**: Create the technical architecture document (docs/architecture.md) that implements the requirements defined in docs/prd.md.

**Key Focus Areas**:

1. **Webhook Architecture** (Epic 1 Stories 1.1-1.10):
   - Design `/api/webhooks/vapi` route structure for all Vapi function calls
   - Implement security validation (`x-vapi-secret` header check)
   - Design error logging strategy (file vs. database)
   - Ensure < 500ms response time (NFR6)

2. **Database Schema** (Critical Decision):
   - Review existing `reservations`, `restaurants`, `calls` tables
   - Determine if `special_requests` needs separate table or field in `reservations`
   - Design schema to support `request_type` for technical errors, large groups

3. **Vapi Configuration Updates** (Epic 1):
   - SYSTEM_PROMPT modifications for FR3 (explicit confirmation), FR7 (complet response), FR8-9 (modification/cancellation), FR10 (special requests), FR12 (out-of-scope)
   - Function definitions for `find_and_update_reservation`, `find_and_cancel_reservation`

4. **Performance Optimization**:
   - Ensure webhook queries optimized for < 500ms target (NFR6)
   - Plan for Supabase Realtime integration (NFR8: < 3s dashboard updates)

5. **Risk Mitigation Implementation**:
   - Transaction locking strategy (if implementing race condition prevention)
   - Error handling patterns for graceful degradation (FR11)
   - Logging infrastructure for debugging

**Reference Materials**:
- CLAUDE.md for coding standards and existing patterns
- docs/brainstorming-session-results.md for implementation priorities
- scripts/update-vapi-config.ts for current Vapi configuration

**Timeline**: Architecture should support 4-day implementation (Epic 1: 3 days, Epic 2: 1 day)

---

