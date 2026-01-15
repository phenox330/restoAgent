# Story 1.2: Test Guide - Graceful Error Handling

**Status:** Ready for Testing
**Migration:** ✅ Completed

---

## Quick Test Plan

Vous devez effectuer **3 tests principaux** pour valider Story 1.2 :

1. ✅ **Test Normal** - Vérifier que rien n'est cassé
2. ⚠️ **Test Erreur DB** - Vérifier la gestion des erreurs
3. ⏱️ **Test Timeout** - Vérifier la protection timeout

---

## Test 1: Régression - Flow Normal (5 min)

**Objectif:** Vérifier que les réservations normales fonctionnent toujours

**Script d'appel:**
```
Vous: "Bonjour, je voudrais réserver pour demain à 20h pour 2 personnes"
Agent: "Donc une table pour 2 personnes le [date] à 20h, c'est bien ça ?"
Vous: "Oui"
Agent: [vérifie disponibilité]
Vous: "Martin" (quand l'agent demande le nom)
Agent: [confirme réservation]
```

**Validation:**
- ✅ Aucune erreur dans la console Vercel
- ✅ Réservation créée dans Supabase avec:
  - `request_type = 'reservation'` ← **IMPORTANT**
  - `status = 'confirmed'`
  - Tous les champs remplis correctement

**Si ça marche:** Parfait, le code n'a rien cassé ✅

---

## Test 2: Simulation Erreur Database (10 min)

**Objectif:** Vérifier que l'agent gère gracieusement une erreur technique

### Étape A: Modifier le Code

Ouvrez `lib/vapi/tools.ts` et trouvez la fonction `handleCheckAvailability` (ligne ~215).

**Ajoutez cette ligne au tout début de la fonction:**

```typescript
export async function handleCheckAvailability(args: CheckAvailabilityArgs) {
  // 🧪 TEST Story 1.2 - Simuler erreur DB
  throw new Error("Simulated database connection error");

  // ... reste du code
```

**Sauvegardez** et committez:
```bash
git add lib/vapi/tools.ts
git commit -m "test: simulate database error for Story 1.2"
git push
```

Attendez que Vercel déploie (~1-2 min).

### Étape B: Appeler Vapi

**Script d'appel:**
```
Vous: "Bonjour, je voudrais réserver pour ce soir à 19h pour 4 personnes"
Agent: [essaie de vérifier disponibilité → ERREUR]
Agent: "Je rencontre un problème technique. Puis-je prendre vos coordonnées et le restaurant vous rappellera ?"
Vous: "Oui, c'est Dupont"
Agent: [demande confirmation du téléphone ou utilise celui de l'appel]
Agent: [appelle create_technical_error_request]
Agent: "Merci Dupont. J'ai bien noté vos coordonnées ainsi que votre souhait de réserver pour [aujourd'hui] à 19:00 pour 4 personnes. Le restaurant vous contactera dans les plus brefs délais. Bonne journée !"
```

### Étape C: Validation

**1. Console Vercel Logs (https://vercel.com/logs):**

Cherchez:
```
🚨 TECHNICAL ERROR LOGGED
Type: Error
Message: Simulated database connection error
Function: check_availability
```

**2. Base de données Supabase:**

Dans la table `reservations`, vous devez avoir un nouveau record:
```
request_type: 'technical_error'
status: 'pending_request'
customer_name: 'Dupont'
customer_phone: '+33...'
reservation_date: [today]
reservation_time: '19:00'
number_of_guests: 4
internal_notes: 'Erreur technique survenue pendant l'appel...'
```

**Si ça marche:** Le système gère gracieusement les erreurs ! ✅

### Étape D: Cleanup

**IMPORTANT:** Enlevez la ligne de test:

```typescript
export async function handleCheckAvailability(args: CheckAvailabilityArgs) {
  // Enlever cette ligne:
  // throw new Error("Simulated database connection error");

  console.log("✅ check_availability called with:", JSON.stringify(args, null, 2));
  // ... reste du code normal
```

Committez et pushez:
```bash
git add lib/vapi/tools.ts
git commit -m "test: remove simulated error"
git push
```

---

## Test 3: Simulation Timeout (10 min)

**Objectif:** Vérifier que le timeout de 18s protège contre les appels trop longs

### Étape A: Modifier le Code

Dans `lib/vapi/tools.ts`, fonction `handleCheckAvailability`:

```typescript
export async function handleCheckAvailability(args: CheckAvailabilityArgs) {
  // 🧪 TEST Story 1.2 - Simuler timeout
  await new Promise(resolve => setTimeout(resolve, 20000)); // 20 secondes

  console.log("✅ check_availability called with:", JSON.stringify(args, null, 2));
  // ... reste du code
```

Committez et pushez.

### Étape B: Appeler Vapi

Même script que Test 2.

**Attendez 18-20 secondes...**

L'agent devrait dire: "Je rencontre un problème technique..." et capturer vos coordonnées.

### Étape C: Validation

**Console Vercel:**
```
🚨 TECHNICAL ERROR LOGGED
Type: TIMEOUT
Message: Function execution timeout
```

**Base de données:** Même que Test 2.

### Étape D: Cleanup

Enlevez la ligne de test et pushez.

---

## Critères de Succès

Story 1.2 est validée si:

- ✅ **Test 1 PASS:** Réservations normales fonctionnent (pas de régression)
- ✅ **Test 2 PASS:** Erreurs DB gérées gracieusement + logs + DB record créé
- ✅ **Test 3 PASS:** Timeout détecté + gestion gracieuse

---

## Résultats de Test

**Test 1 (Régression):**
- [ ] ✅ PASS
- [ ] ❌ FAIL - Raison: _________________

**Test 2 (Erreur DB):**
- [ ] ✅ PASS
- [ ] ❌ FAIL - Raison: _________________

**Test 3 (Timeout):**
- [ ] ✅ PASS
- [ ] ❌ FAIL - Raison: _________________

---

## Next Steps

**Si tous les tests passent:**
- Marquez Story 1.2 comme ✅ COMPLETE dans `epic-1-story-1.2-error-handling.md`
- Passez à la prochaine story

**Si un test échoue:**
- Documentez l'erreur dans le fichier story
- Partagez les logs Vercel
- On debuggera ensemble

---

## Notes

- Les tests 2 et 3 nécessitent des modifications temporaires du code
- Toujours faire le cleanup après chaque test
- Les `technical_error` records peuvent être supprimés de la DB après validation
- En production réelle, ces records seront traités manuellement par le restaurant

---

**Date:** 2026-01-15
**Auteur:** Dev Agent (Claude Sonnet 4.5)
