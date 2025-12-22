# 🍽️ RestoAgent

SaaS de gestion de réservations par agent vocal IA pour restaurants.

## Features

- 🤖 **Agent vocal IA** - Prise de réservations par téléphone 24/7
- 📅 **Dashboard** - Gestion des réservations en temps réel
- 📞 **Historique appels** - Transcripts et enregistrements
- 📱 **SMS** - Confirmations et rappels automatiques (Twilio)
- 📊 **Export** - Google Sheets integration
- 🔒 **Multi-tenant** - Un dashboard par restaurant

## Stack technique

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS, Shadcn/ui |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Magic Link) |
| Voice AI | Vapi.ai |
| SMS | Twilio |
| Export | Google Sheets API |

## Getting Started

### Prérequis

- Node.js 18+
- npm ou pnpm
- Compte Supabase
- Compte Vapi.ai
- Compte Twilio (pour les SMS) - voir [docs/TWILIO_SETUP.md](docs/TWILIO_SETUP.md)
- (Optionnel) Compte Google Cloud pour export Sheets

### Installation

```bash
# Clone
git clone https://github.com/yourname/resto-agent.git
cd resto-agent

# Install dependencies
npm install

# Setup env
cp .env.local.example .env.local
# Remplir les variables dans .env.local

# Run migrations Supabase
npx supabase db push

# Dev server
npm run dev
```

### Variables d'environnement

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Vapi
VAPI_API_KEY=va_xxx
VAPI_WEBHOOK_SECRET=whsec_xxx

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+12203450018

# Cron Jobs
CRON_SECRET=your_random_secret_here

# Google (optionnel)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Structure projet

```
src/
├── app/
│   ├── (auth)/              # Login (public)
│   ├── (dashboard)/         # Dashboard (protected)
│   │   ├── page.tsx         # Home dashboard
│   │   ├── reservations/    # CRUD réservations
│   │   ├── calls/           # Historique appels
│   │   ├── settings/        # Config restaurant
│   │   └── export/          # Export Google Sheets
│   └── api/
│       ├── webhooks/vapi/   # Webhook Vapi
│       ├── reservations/    # API réservations
│       └── calls/           # API appels
├── components/
│   ├── ui/                  # Shadcn components
│   ├── dashboard/           # Layout components
│   ├── reservations/        # Reservation components
│   └── calls/               # Call components
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── vapi/               # Vapi helpers
│   └── google/             # Google Sheets
├── hooks/                   # Custom hooks
└── types/                   # TypeScript types
```

## Base de données

### Schéma

```
restaurants
├── id, name, phone, address
├── opening_hours (JSONB)
├── max_capacity
└── owner_id → auth.users

reservations
├── id, restaurant_id
├── customer_name, customer_phone
├── date, time, party_size
├── status (pending|confirmed|cancelled|completed|no_show)
└── call_id → calls

calls
├── id, restaurant_id
├── vapi_call_id
├── started_at, ended_at, duration
├── intent, outcome
├── recording_url, transcript
└── summary
```

### Migrations

```bash
# Créer une nouvelle migration
npx supabase migration new nom_migration

# Appliquer les migrations
npx supabase db push

# Reset la DB (dev only)
npx supabase db reset
```

## Webhook Vapi

### Endpoint

`POST /api/webhooks/vapi`

### Events gérés

| Event | Action |
|-------|--------|
| `call.started` | Créer entry dans `calls` |
| `call.ended` | Update durée, recording |
| `function_call` | Exécuter fonction métier |

### Fonctions exposées à l'agent

```typescript
// Vérifier disponibilité
check_availability({ date, time, party_size })

// Créer réservation
create_reservation({ 
  customer_name, 
  customer_phone, 
  date, 
  time, 
  party_size 
})

// Annuler réservation
cancel_reservation({ customer_phone, date })
```

## Scripts

```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Build production
npm run start      # Start production
npm run lint       # ESLint
npm run type-check # TypeScript check
```

## Déploiement

### Vercel (recommandé)

1. Push sur GitHub
2. Import dans Vercel
3. Configurer les variables d'environnement
4. Deploy

### Variables à configurer

- Toutes les vars de `.env.local`
- `NEXT_PUBLIC_APP_URL` = URL Vercel

### Post-deploy

1. Mettre à jour l'URL du webhook dans Vapi
2. Configurer le domaine custom si besoin

## Roadmap MVP

- [x] Setup projet
- [ ] Auth (magic link)
- [ ] Dashboard layout
- [ ] CRUD réservations
- [ ] Webhook Vapi
- [ ] Config agent Vapi
- [ ] Historique appels
- [ ] Paramètres restaurant
- [ ] Export Google Sheets
- [ ] Tests E2E

## License

Propriétaire - Tous droits réservés

---

Built with ❤️ by Klyra.io