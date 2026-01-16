# UX Critical Improvements Spec

**Document Version:** v1.0
**Created:** 2026-01-15
**Author:** Sally (UX Expert)
**Priority:** CRITICAL - Required before demo

---

## Overview

Two critical UX gaps identified that impact demo quality:

1. **Real-time Reservations** - Dashboard doesn't update when new reservations arrive
2. **Toast Notifications** - No visual feedback for new reservations/events

---

## Feature 1: Real-time Reservations

### Problem Statement

When a customer creates a reservation via phone (voice agent), the dashboard does not update automatically. The restaurant owner must manually refresh the page to see new reservations.

**Impact:** During demo, this creates an awkward pause and impression that the system is slow or broken.

### PRD Reference

> **NFR8:** "Dashboard real-time updates MUST appear within 3 seconds of reservation creation via Supabase Realtime"

### Technical Specification

#### 1.1 Supabase Realtime Subscription

**File to modify:** `components/reservations/reservations-table.tsx`

**Implementation Pattern:** Follow existing pattern from `components/calls/live-feed.tsx`

```typescript
// Add Supabase Realtime subscription for reservations
useEffect(() => {
  const supabase = createClient();

  const channel = supabase
    .channel("reservations-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reservations",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          // Add new reservation to list
          // Trigger toast notification
        } else if (payload.eventType === "UPDATE") {
          // Update existing reservation in list
        } else if (payload.eventType === "DELETE") {
          // Remove reservation from list
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [restaurantId]);
```

#### 1.2 Component Architecture Change

**Current:** `ReservationsTable` is a presentational component receiving `reservations` prop from server component.

**Required Change:** Convert to hybrid approach:
1. Server component fetches initial data
2. Client component maintains state and subscribes to real-time updates

**Option A (Recommended):** Create wrapper component

```
app/(dashboard)/dashboard/reservations/page.tsx (Server)
  └── ReservationsPageClient.tsx (Client - new file)
        └── ReservationsTable.tsx (receives state from parent)
```

**Option B:** Make ReservationsTable fully client-side with initial data prop

#### 1.3 State Management

```typescript
interface ReservationsState {
  reservations: Reservation[];
  isLoading: boolean;
  lastUpdate: Date | null;
}
```

**Optimistic Updates:** Not required for MVP - simple state replacement is sufficient.

#### 1.4 Visual Feedback on Update

When a new reservation arrives:
1. Add reservation to top of list (or sorted position)
2. Apply subtle highlight animation (pulse or glow) for 3 seconds
3. Trigger toast notification (see Feature 2)

**CSS Animation:**
```css
@keyframes new-reservation-highlight {
  0% { background-color: hsl(var(--primary) / 0.2); }
  100% { background-color: transparent; }
}

.new-reservation {
  animation: new-reservation-highlight 3s ease-out;
}
```

### Acceptance Criteria

- [ ] New reservations appear in table within 3 seconds of creation
- [ ] Updated reservations reflect changes without page refresh
- [ ] Cancelled reservations update status without page refresh
- [ ] No memory leaks (subscription properly cleaned up on unmount)
- [ ] Works on reservations page AND dashboard quick view

### Test Scenarios

| # | Action | Expected Result |
|---|--------|-----------------|
| 1 | Create reservation via Vapi call | Reservation appears in table within 3s |
| 2 | Cancel reservation via Vapi call | Status changes to "cancelled" in table |
| 3 | Modify reservation via Vapi call | Details update in table |
| 4 | Navigate away and back | Subscription re-established, updates work |
| 5 | Multiple rapid reservations | All appear correctly, no duplicates |

---

## Feature 2: Toast Notifications

### Problem Statement

No visual notification system exists. When events occur (new reservation, errors, actions), users have no immediate feedback.

### PRD Reference

> "Toast notifications: Non-intrusive alerts for new reservations, special requests, or technical errors requiring attention"

### Technical Specification

#### 2.1 Library Selection

**Recommended:** `sonner` - Lightweight, accessible, works great with Next.js App Router

**Alternative:** `react-hot-toast`

**Installation:**
```bash
npm install sonner
```

#### 2.2 Provider Setup

**File:** `app/layout.tsx`

```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={5000}
        />
      </body>
    </html>
  );
}
```

#### 2.3 Toast Types & Styling

| Type | Use Case | Icon | Color |
|------|----------|------|-------|
| `success` | Reservation confirmed, action completed | ✓ | Green |
| `info` | New reservation arrived | 📅 | Blue |
| `warning` | Needs confirmation, special request | ⚠️ | Amber |
| `error` | Action failed, technical error | ✕ | Red |

#### 2.4 Toast Triggers

**New Reservation (real-time):**
```typescript
// In realtime subscription handler
if (payload.eventType === "INSERT") {
  const reservation = payload.new as Reservation;
  toast.info(
    `Nouvelle réservation: ${reservation.customer_name}`,
    {
      description: `${reservation.number_of_guests} pers. - ${format(new Date(reservation.reservation_date), "d MMM")} à ${reservation.reservation_time}`,
      action: {
        label: "Voir",
        onClick: () => router.push(`/dashboard/reservations?search=${reservation.customer_name}`)
      }
    }
  );
}
```

**Reservation with Special Requests:**
```typescript
if (reservation.special_requests) {
  toast.warning(
    `Demande spéciale: ${reservation.customer_name}`,
    {
      description: reservation.special_requests,
      duration: 10000 // Longer duration for important info
    }
  );
}
```

**Needs Confirmation:**
```typescript
if (reservation.needs_confirmation) {
  toast.warning(
    `À confirmer: ${reservation.customer_name}`,
    {
      description: `Score de confiance: ${reservation.confidence_score}%`,
      action: {
        label: "Vérifier",
        onClick: () => openReservationDetails(reservation)
      }
    }
  );
}
```

**Action Success:**
```typescript
// After status change
toast.success("Réservation confirmée");
toast.success("Réservation annulée");
```

**Error:**
```typescript
// On API error
toast.error("Erreur lors de la mise à jour", {
  description: error.message
});
```

#### 2.5 Sound Notification (Optional)

For demo impact, consider adding a subtle sound for new reservations:

```typescript
const playNotificationSound = () => {
  const audio = new Audio('/sounds/notification.mp3');
  audio.volume = 0.3;
  audio.play().catch(() => {}); // Ignore if blocked
};
```

### Acceptance Criteria

- [ ] Toast appears when new reservation is created
- [ ] Toast appears for special requests (amber/warning style)
- [ ] Toast appears for reservations needing confirmation
- [ ] Success toast on manual status changes
- [ ] Error toast on failed actions
- [ ] Toasts are dismissible
- [ ] Toasts don't overlap or cause layout shift
- [ ] Toasts are accessible (announced by screen readers)

### Test Scenarios

| # | Action | Expected Toast |
|---|--------|----------------|
| 1 | New reservation via Vapi | Info toast with reservation details |
| 2 | Reservation with allergy | Warning toast highlighting special request |
| 3 | Low confidence reservation | Warning toast with "À confirmer" |
| 4 | Confirm reservation manually | Success toast "Réservation confirmée" |
| 5 | Cancel reservation | Success toast "Réservation annulée" |
| 6 | API error occurs | Error toast with message |

---

## Implementation Order

### Phase 1: Toast Infrastructure (1h)

1. Install sonner
2. Add Toaster to layout
3. Create `lib/notifications.ts` with helper functions
4. Test with manual toast trigger

### Phase 2: Real-time Reservations (2h)

1. Create `ReservationsPageClient.tsx` wrapper
2. Add Supabase subscription
3. Implement state updates for INSERT/UPDATE/DELETE
4. Add highlight animation CSS

### Phase 3: Integration (30min)

1. Connect real-time events to toast notifications
2. Add toasts to existing actions (confirm, cancel)
3. Test end-to-end with voice call

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/layout.tsx` | Modify | Add Toaster provider |
| `lib/notifications.ts` | Create | Toast helper functions |
| `app/(dashboard)/dashboard/reservations/page.tsx` | Modify | Pass restaurantId to client |
| `components/reservations/reservations-page-client.tsx` | Create | Real-time wrapper |
| `components/reservations/reservations-table.tsx` | Modify | Accept refreshed data |
| `components/reservations/reservation-actions.tsx` | Modify | Add toast on actions |
| `styles/globals.css` | Modify | Add highlight animation |

---

## Definition of Done

- [ ] Sonner installed and Toaster in layout
- [ ] Real-time subscription working on reservations page
- [ ] New reservations appear within 3 seconds
- [ ] Toast notification for new reservations
- [ ] Toast notification for special requests
- [ ] Toast notification for needs_confirmation
- [ ] Success/error toasts on manual actions
- [ ] No console errors or memory leaks
- [ ] Works on mobile viewport
- [ ] Tested with actual Vapi call

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-15 | Spec created | Sally (UX Expert) |
