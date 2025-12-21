# CLAUDE.md - Instructions pour l'IA

> Ce fichier guide Claude Code / Cursor sur les conventions et le contexte du projet.

## 🎯 Projet

**RestoAgent** - SaaS de gestion de réservations par agent vocal IA pour restaurants.

### Stack
- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS + Shadcn/ui
- Supabase (Auth, Database, Realtime)
- Vapi.ai (agent vocal)
- TanStack Query (data fetching)
- Zod (validation)

---

## 📁 Structure

```
src/
├── app/                    # Routes Next.js (App Router)
│   ├── (auth)/            # Routes publiques (login)
│   ├── (dashboard)/       # Routes protégées
│   └── api/               # API Routes
├── components/
│   ├── ui/                # Shadcn components (ne pas modifier)
│   ├── dashboard/         # Composants layout dashboard
│   ├── reservations/      # Composants réservations
│   └── calls/             # Composants appels
├── lib/                   # Utilitaires et clients
├── hooks/                 # Custom React hooks
└── types/                 # Types TypeScript
```

---

## ✅ Conventions de code

### TypeScript
- **Strict mode** : pas de `any`, types explicites
- **Types** dans `src/types/` pour les entités métier
- **Zod schemas** pour la validation runtime
- Préférer `interface` pour les objets, `type` pour unions/intersections

### React / Next.js
- **Server Components par défaut**
- **Client Components** (`"use client"`) uniquement si :
  - useState, useEffect, hooks
  - Event handlers (onClick, onChange)
  - Browser APIs
- **Pas de `use server`** dans les composants, utiliser les API Routes

### Naming
- **Fichiers** : kebab-case (`reservation-card.tsx`)
- **Composants** : PascalCase (`ReservationCard`)
- **Hooks** : camelCase avec préfixe `use` (`useReservations`)
- **Utils/lib** : camelCase (`formatDate`)

### Imports
```typescript
// 1. React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. Libs externes
import { format } from 'date-fns'
import { z } from 'zod'

// 3. Components internes
import { Button } from '@/components/ui/button'
import { ReservationCard } from '@/components/reservations/reservation-card'

// 4. Lib/utils internes
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// 5. Types
import type { Reservation } from '@/types/reservation'
```

---

## 🗄️ Base de données

### Tables principales
- `restaurants` : infos et config du restaurant
- `reservations` : les réservations
- `calls` : historique des appels Vapi

### Règles Supabase
- Toujours utiliser le client approprié :
  - `@/lib/supabase/client` → browser (components)
  - `@/lib/supabase/server` → server (API routes, Server Components)
- **RLS activé** : les policies gèrent l'accès
- Service role uniquement dans les webhooks (`SUPABASE_SERVICE_ROLE_KEY`)

### Queries
```typescript
// ✅ Bon - avec type
const { data, error } = await supabase
  .from('reservations')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .returns<Reservation[]>()

// ❌ Mauvais - sans gestion d'erreur
const { data } = await supabase.from('reservations').select('*')
```

---

## 🎨 UI / Styling

### Shadcn/ui
- Composants dans `src/components/ui/`
- **Ne pas modifier** ces fichiers directement
- Pour customiser : wrapper ou override via className

### Tailwind
- Mobile-first (`sm:`, `md:`, `lg:`)
- Utiliser `cn()` pour les classes conditionnelles
- Couleurs : utiliser les variables CSS Shadcn (`bg-primary`, `text-muted-foreground`)

```typescript
// ✅ Bon
<div className={cn(
  "rounded-lg border p-4",
  isActive && "border-primary bg-primary/10"
)}>

// ❌ Mauvais - couleurs hardcodées
<div className="bg-blue-500 text-white">
```

### Patterns UI
- **Loading states** : Skeleton ou Spinner
- **Empty states** : Message + action suggérée
- **Error states** : Toast pour erreurs non-bloquantes, page erreur sinon
- **Formulaires** : react-hook-form + Zod

---

## 🔌 API Routes

### Structure
```typescript
// src/app/api/reservations/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  // ...
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    
    const supabase = await createClient()
    // ...
    
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Webhook Vapi
- Route : `/api/webhooks/vapi`
- Vérifier signature en header
- Utiliser service role pour bypass RLS
- Logger tous les appels

---

## 🧪 Tests manuels

Avant de considérer une feature "done" :
1. [ ] Fonctionne sur desktop
2. [ ] Fonctionne sur mobile (responsive)
3. [ ] Loading state visible
4. [ ] Erreurs gérées proprement
5. [ ] TypeScript compile sans erreur
6. [ ] Console sans warnings

---

## 🚫 À éviter

- `any` en TypeScript
- `console.log` en prod (utiliser un logger)
- Fetch dans useEffect (utiliser TanStack Query)
- Secrets côté client (uniquement `NEXT_PUBLIC_*`)
- Modifier les composants `ui/` de Shadcn
- Inline styles
- Classes Tailwind dupliquées
- Ignorer les erreurs Supabase

---

## 📝 Contexte métier

### Réservation
- Statuts : `pending` → `confirmed` → `completed` | `cancelled` | `no_show`
- Source : `phone` (agent), `web`, `manual`
- Durée par défaut : 90 min

### Agent vocal (Vapi)
- Gère : réservations, annulations, questions générales
- Fonctions exposées : `check_availability`, `create_reservation`, `cancel_reservation`
- Autres demandes → "un responsable vous rappellera"

### Restaurant
- Horaires par jour (midi + soir possible)
- Capacité max par créneau
- Jours de fermeture exceptionnels