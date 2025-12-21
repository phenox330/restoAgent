# Supabase Migrations

Ce dossier contient les migrations SQL pour créer le schéma de base de données RestoAgent.

## 🔄 Reset complet de la base de données

**⚠️ ATTENTION : Supprime TOUTES les données existantes !**

Si tu veux repartir de zéro avec une base de données propre :

### Option 1 : Via l'interface Supabase (Recommandé)

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Dans le menu latéral, clique sur **SQL Editor**
4. Clique sur **New query**
5. Copie le contenu du fichier `reset-database.sql`
6. Colle-le dans l'éditeur
7. Clique sur **Run** (ou Cmd/Ctrl + Enter)
8. Ensuite, exécute les migrations normalement (voir ci-dessous)

### Option 2 : Via Supabase CLI

```bash
# Exécuter le script de reset
npx supabase db execute --file supabase/reset-database.sql

# Puis appliquer les migrations
npx supabase db push
```

## Comment exécuter les migrations

### Option 1 : Via l'interface Supabase (Recommandé pour débuter)

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Dans le menu latéral, clique sur **SQL Editor**
4. Clique sur **New query**
5. Copie le contenu du fichier `migrations/00001_initial_schema.sql`
6. Colle-le dans l'éditeur
7. Clique sur **Run** (ou Cmd/Ctrl + Enter)

### Option 2 : Via Supabase CLI (Pour un usage avancé)

```bash
# Installer la CLI Supabase
npm install -g supabase

# Se connecter à ton projet
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer la migration
supabase db push
```

## Vérification

Après avoir exécuté la migration, tu devrais voir dans ton projet Supabase :

### Tables créées
- ✅ `restaurants`
- ✅ `reservations`
- ✅ `calls`

### Vues créées
- ✅ `reservations_today`
- ✅ `reservation_stats`

### RLS activé
Toutes les tables ont Row Level Security (RLS) activé avec les policies appropriées.

## Structure

### `restaurants`
Contient les infos du restaurant : nom, contact, horaires, capacité, etc.

### `reservations`
Contient toutes les réservations avec :
- Statuts : `pending`, `confirmed`, `completed`, `cancelled`, `no_show`
- Sources : `phone` (agent Vapi), `web`, `manual`

### `calls`
Historique des appels Vapi avec transcript et métadonnées.

## Prochaines étapes

Une fois les migrations exécutées :
1. Vérifier que tout est créé dans l'interface Supabase
2. Tester l'authentification
3. Créer un premier restaurant dans la table
4. Développer les interfaces du dashboard
