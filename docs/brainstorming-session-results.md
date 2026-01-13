# Brainstorming Session Results

**Session Date:** 2026-01-12
**Facilitator:** Business Analyst Mary
**Participant:** User
**Topic:** Optimisation de l'expérience utilisateur de l'agent vocal RestoAgent

---

## Executive Summary

**Session Goals:** Analyse complète et systématique de l'expérience utilisateur de l'agent vocal Vapi pour identifier les opportunités d'optimisation et prévenir les bugs. Préparer une démo client convaincante.

**Techniques Used:** First Principles Thinking, Question Storming, Revue systématique par étapes, Catégorisation par priorité

**Total Ideas Generated:** 15 opportunités d'optimisation identifiées

**Key Themes Identified:**
- Architecture multi-tenant pour scaling futur (post-démo)
- Fluidité conversationnelle et compréhension du langage naturel
- Robustesse et gestion d'erreurs pour éviter bugs en démo
- Polish UX et professionnalisme de l'agent
- Gestion intelligente des cas limites (grands groupes, modifications, annulations)

---

## Technique Sessions

### Revue Systématique des Étapes du Parcours Utilisateur

**Description:** Analyse méthodique de chaque étape du parcours client pour identifier les opportunités d'amélioration et d'optimisation.

#### Étapes identifiées:
1. Démarrage de l'appel
2. Collecte d'informations
3. Vérification de disponibilité
4. Confirmation de la réservation
5. Gestion d'erreurs
6. Cas particuliers (modifications, annulations, demandes spéciales)

---

## Ideas Generated

### ÉTAPE 1 : Démarrage de l'appel - Première impression

**Contexte découvert :** Architecture SaaS multi-tenant avec un assistant Vapi par restaurant.

**Idées d'optimisation :**

1. **FirstMessage dynamique avec variables Vapi**
   - Utiliser `assistantOverrides.variableValues` pour injecter le nom du restaurant
   - Template : `"Bonjour, Restaurant {{restaurant_name}}, je vous écoute !"`
   - Variables injectées lors de l'appel entrant via l'API
   - Permet personnalisation totale par restaurant

2. **Architecture multi-tenant**
   - 1 assistant_ID Vapi par restaurant
   - Mapping `numéro_téléphone → assistant_ID → restaurant_ID` dans Supabase
   - Webhook identifie le restaurant via le numéro appelé
   - Scalable pour N restaurants

3. **Données restaurant requises (table Supabase `restaurants`)**
   - Nom du restaurant
   - Horaires et jours d'ouverture
   - Capacités par table (système flexible)
   - Jours de fermeture exceptionnels

---

### ÉTAPE 2 : Gestion flexible des tables et capacités

**Décisions architecturales :**

1. **Logique de capacité simplifiée**
   - Capacité totale = Somme des places de toutes les tables actives
   - Disponibilité = Capacité totale - Réservations au créneau (± 90 min)
   - Pas d'assignation de table spécifique par l'agent

2. **Durée standard des réservations**
   - 90 minutes par défaut
   - Créneau bloqué pendant cette durée

3. **Interface restaurateur pour configuration tables**
   - Liste de tables numérotées (ex: Table 1, Table 2, etc.)
   - Chaque table : nombre de places associé
   - Toggle actif/inactif pour désactiver temporairement des tables
   - Modification flexible via front-end

4. **Optimisation fonction `check_availability`**
   - ✅ Vérifier horaires d'ouverture du restaurant (déjà implémenté)
   - ✅ Calculer capacité disponible au créneau demandé
   - ✅ Si fermé → proposer créneau alternatif
   - Retourner message clair : "disponible", "complet", "fermé + suggestion"

5. **Gestion des chevauchements de créneaux**
   - Réservation à 19h00 → bloque jusqu'à 20h30
   - Réservation à 20h00 → peut coexister si capacité suffisante
   - Calcul des places occupées par tranche horaire

---

### ÉTAPE 3 : Collecte d'informations (Date, Heure, Nb personnes, Nom)

**Décisions UX :**

1. **Ordre de collecte optimal**
   - ✅ Date → Heure → Nombre de personnes → Vérification dispo → Nom
   - Flow naturel et logique pour le client
   - L'agent guide progressivement sans surcharger

2. **Gestion avancée du langage naturel pour les dates**

   Conversions à implémenter :
   - ✅ "ce soir" / "aujourd'hui" → date du jour
   - ✅ "demain" → date + 1 jour
   - 🆕 "dans 3 jours" → date + 3 jours
   - 🆕 "samedi prochain" → calcul du prochain samedi
   - 🆕 "le 15 janvier" → 2026-01-15
   - 🆕 "la semaine prochaine" → dates +7 jours

   Conversions horaires existantes :
   - ✅ "19h" / "dix-neuf heures" → "19:00"
   - ✅ "midi" → "12:00"
   - 🆕 "midi et demi" → "12:30"
   - 🆕 "19h30" / "sept heures et demie" → "19:30"

3. **Confirmation explicite obligatoire**
   - Avant de vérifier la disponibilité, l'agent DOIT récapituler :
   - "Parfait ! Donc une table pour {{nb_personnes}} personnes le {{date}} à {{heure}}, c'est bien ça ?"
   - Attendre confirmation du client avant d'appeler `check_availability`
   - Améliore confiance et réduit les erreurs

4. **Gestion des infos données en une fois**
   - Si le client dit tout d'un coup : "Je voudrais réserver pour 4 personnes demain à 20h"
   - L'agent extrait toutes les infos et confirme immédiatement
   - Gain de temps et fluidité conversationnelle

---

### ÉTAPE 4 : Vérification de disponibilité & Appel de fonction

**Optimisations identifiées :**

1. **Gestion du temps d'attente pendant l'appel fonction**
   - ✅ L'agent dit "Un instant, je vérifie..." (déjà implémenté)
   - Évite le silence gênant pendant le call webhook
   - Assure transparence et professionnalisme

2. **Gestion du cas "complet"**
   - Si le créneau demandé est complet, l'agent demande les préférences au client :
   - "Malheureusement nous sommes complets à cet horaire. Quel autre créneau souhaiteriez-vous que je vérifie ?"
   - Ne pas imposer d'alternatives, laisser le client choisir
   - Plus respectueux et flexible

3. **Gestion des grands groupes (dépassement capacité)**
   - Si `number_of_guests` > capacité totale du restaurant :
   - Message spécial : "Pour un groupe de cette taille, je vais prendre note de votre demande et le restaurateur vous rappellera pour organiser cela."
   - Collecter : nom, numéro, date souhaitée, nombre de personnes
   - Créer une "demande spéciale" dans la DB (pas une réservation standard)
   - Notification au restaurateur pour traitement manuel

4. **Règles strictes d'appel de fonction (déjà en place)**
   - ✅ JAMAIS inventer la disponibilité
   - ✅ TOUJOURS appeler check_availability avant de parler de dispo
   - ✅ Transmettre fidèlement le résultat de l'outil

---

### ÉTAPE 5 : Confirmation & Finalisation de la réservation

**Optimisations définies :**

1. **Collecte des informations client - Minimaliste**
   - ✅ Nom (obligatoire)
   - ✅ Téléphone (récupéré automatiquement de l'appel)
   - ❌ Email (inutile pour l'instant, pas demander)
   - Approche simple et rapide, ne pas alourdir l'expérience

2. **Demandes spéciales (allergies, anniversaire, etc.)**
   - Proposer à la fin : "Avez-vous des demandes particulières ?"
   - Capturer si mentionné, sinon passer à la confirmation
   - Champ optionnel, ne pas insister si client dit non

3. **Message de confirmation final standardisé**
   - Format : "Votre table est réservée, vous recevrez un SMS de confirmation. À bientôt !"
   - Clair, rassurant, professionnel
   - Mentionne la confirmation SMS (engagement de service)
   - Ton chaleureux avec "À bientôt"

4. **Flow complet de finalisation**
   ```
   1. Dispo confirmée → Demander le nom
   2. Nom obtenu → Demander demandes spéciales
   3. Appeler create_reservation avec toutes les infos
   4. Confirmer avec message standardisé
   5. Terminer l'appel poliment
   ```

---

### ÉTAPE 6 : Gestion d'erreurs & Cas particuliers

**A) MODIFICATIONS DE RÉSERVATION**

Décisions :
1. **Vérification de disponibilité obligatoire**
   - L'agent DOIT appeler `check_availability` pour la nouvelle date/heure avant de modifier
   - Si impossible (complet) → proposer autre créneau au client
   - Ne modifier que si nouvelle disponibilité confirmée

2. **Pas de confirmation de l'ancienne réservation**
   - L'agent cherche la réservation par nom via `find_and_update_reservation`
   - Si trouvée → procède à la modification
   - Si non trouvée → indique qu'aucune réservation n'existe à ce nom
   - Pas besoin de confirmer les détails de l'ancienne avant de modifier

**B) ANNULATIONS**

Décisions :
1. **Gestion des doublons de nom**
   - Si plusieurs réservations au même nom avec dates/heures différentes :
   - Demander au client quelle date/heure il souhaite annuler
   - Annuler uniquement la réservation spécifiée

2. **Pas de confirmation avant annulation**
   - Ne pas demander "Êtes-vous sûr ?"
   - Annuler directement quand demandé
   - Simplicité et rapidité

3. **Message après annulation**
   - Message simple : "Votre réservation a été annulée."
   - Pas besoin de détails supplémentaires

**C) ERREURS TECHNIQUES**

Recommandations pour gestion gracieuse :

1. **Webhook timeout ou erreur**
   - Message au client : "Je rencontre un problème technique. Puis-je prendre vos coordonnées et le restaurant vous rappellera pour confirmer votre réservation ?"
   - Collecter : nom, numéro, date/heure/nb personnes souhaités
   - Créer une "demande en attente" dans la DB si possible
   - Logger l'erreur pour investigation

2. **Base de données inaccessible**
   - Même approche : fallback vers prise de coordonnées
   - "Un instant, je rencontre une difficulté technique..."
   - Proposer rappel par le restaurant
   - Éviter de dire "c'est cassé" ou "ça ne marche pas" (peu professionnel)

3. **Fonction retourne une erreur inattendue**
   - Message générique : "Je ne peux pas traiter cette demande pour le moment. Le restaurant vous rappellera dans les plus brefs délais."
   - Toujours proposer une issue (rappel) plutôt que bloquer le client

**D) CAS HORS SCOPE (Menu, prix, livraison, etc.)**

Décisions :
- ✅ Message standard : "Pour cette demande, un responsable vous rappellera."
- Rester poli et professionnel
- Ne pas inventer d'informations
- Recentrer sur les réservations si possible : "Je peux vous aider pour une réservation ?"

---

## Idea Categorization

### 🔴 CRITIQUES - À implémenter en priorité

**Ces éléments sont essentiels pour le fonctionnement multi-tenant du SaaS :**

1. **Architecture multi-tenant (ÉTAPE 1)**
   - 1 assistant Vapi par restaurant avec assistant_ID unique
   - Mapping `numéro_téléphone → assistant_ID → restaurant_ID` dans Supabase
   - Webhook identifie le restaurant via numéro appelé
   - **Impact :** Fondamental pour le business model SaaS
   - **Effort :** Élevé (architecture)

2. **FirstMessage dynamique avec variables Vapi (ÉTAPE 1)**
   - Utiliser `assistantOverrides.variableValues` pour injecter nom restaurant
   - Template : `"Bonjour, Restaurant {{restaurant_name}}, je vous écoute !"`
   - **Impact :** Personnalisation de base pour chaque client
   - **Effort :** Moyen (config API)

3. **Interface restaurateur pour gestion des tables (ÉTAPE 2)**
   - Liste de tables numérotées avec capacités
   - Toggle actif/inactif pour chaque table
   - **Impact :** Essentiel pour onboarding clients
   - **Effort :** Moyen (front-end CRUD)

4. **Logique de calcul de disponibilité (ÉTAPE 2)**
   - Capacité totale = Somme des places tables actives
   - Disponibilité = Capacité - Réservations au créneau (± 90 min)
   - **Impact :** Cœur métier de l'application
   - **Effort :** Moyen (logique backend)

5. **Gestion des erreurs techniques avec fallback (ÉTAPE 6)**
   - Si webhook timeout/erreur → proposer rappel
   - Collecter coordonnées + créer demande en attente
   - **Impact :** Évite perte de clients en cas d'incident
   - **Effort :** Faible (messages + logs)

---

### 🟡 IMPORTANTES - Améliorations UX majeures

**Ces éléments améliorent significativement l'expérience utilisateur :**

6. **Gestion avancée du langage naturel (ÉTAPE 3)**
   - Conversions : "dans 3 jours", "samedi prochain", "midi et demi"
   - Amélioration transcription dates/heures
   - **Impact :** Fluidité conversationnelle ++
   - **Effort :** Moyen (enrichissement prompt)

7. **Confirmation explicite avant vérification (ÉTAPE 3)**
   - "Donc une table pour {{nb}} personnes le {{date}} à {{heure}}, c'est bien ça ?"
   - Attendre confirmation avant `check_availability`
   - **Impact :** Réduit erreurs et améliore confiance
   - **Effort :** Faible (ajout au prompt)

8. **Gestion des grands groupes (ÉTAPE 4)**
   - Si nb_guests > capacité totale → message spécial
   - "Je prends note, le restaurateur vous rappellera"
   - Créer demande spéciale dans DB
   - **Impact :** Professionnalisme + lead capture
   - **Effort :** Moyen (logique + DB)

9. **Gestion intelligente du cas "complet" (ÉTAPE 4)**
   - Demander préférences client au lieu d'imposer alternatives
   - "Quel autre créneau souhaiteriez-vous que je vérifie ?"
   - **Impact :** UX respectueuse et flexible
   - **Effort :** Faible (modification prompt)

10. **Modifications de réservation optimisées (ÉTAPE 6)**
    - Vérifier nouvelle dispo avant de confirmer modif
    - Si impossible → proposer autre créneau
    - **Impact :** Service complet pour les clients
    - **Effort :** Moyen (logique métier)

11. **Annulations simplifiées (ÉTAPE 6)**
    - Gestion doublons de nom (demander date/heure)
    - Pas de confirmation "Êtes-vous sûr ?"
    - Message simple après annulation
    - **Impact :** Rapidité et simplicité
    - **Effort :** Faible (prompt + logique)

---

### 🟢 NICE-TO-HAVE - Optimisations futures

**Ces éléments peuvent être ajoutés progressivement :**

12. **Demandes spéciales optionnelles (ÉTAPE 5)**
    - Proposer : "Avez-vous des demandes particulières ?"
    - Capturer allergies, anniversaire, etc.
    - **Impact :** Personnalisation service
    - **Effort :** Faible (ajout champ)

13. **Message de confirmation avec SMS (ÉTAPE 5)**
    - "Votre table est réservée, vous recevrez un SMS de confirmation"
    - Nécessite intégration SMS (Twilio, etc.)
    - **Impact :** Réassurance client
    - **Effort :** Élevé (intégration externe)

14. **Suggestion intelligente de créneaux alternatifs (ÉTAPE 4)**
    - Au lieu de demander, proposer des créneaux proches disponibles
    - "19h est complet, mais j'ai 18h30 ou 20h disponibles"
    - **Impact :** Proactivité agent
    - **Effort :** Élevé (algorithme + appels multiples)

15. **Gestion cas hors scope avec recentrage (ÉTAPE 6)**
    - Message : "Pour cette demande, un responsable vous rappellera"
    - Puis : "Je peux vous aider pour une réservation ?"
    - **Impact :** Maintien conversation productive
    - **Effort :** Faible (prompt)

---

## Action Planning

### Contexte de mise en œuvre

**Objectif immédiat :** Préparer une démo client fluide et sans bugs
**Architecture multi-tenant :** Reportée après validation du concept avec les premiers clients

---

### Top 3 Priority Ideas

#### #1 Priority: Améliorer la fluidité conversationnelle

**Rationale:**
- Essentiel pour une démo convaincante
- Impact immédiat sur la perception de "l'intelligence" de l'agent
- Évite les malentendus qui cassent l'expérience

**Next steps:**
1. Enrichir le SYSTEM_PROMPT avec conversions langage naturel avancées
   - "dans 3 jours", "samedi prochain", "la semaine prochaine"
   - "midi et demi", "19h30", "sept heures et demie"
2. Ajouter confirmation explicite systématique avant check_availability
   - Template : "Donc une table pour {{nb}} personnes le {{date}} à {{heure}}, c'est bien ça ?"
3. Améliorer gestion du cas "complet"
   - Message : "Malheureusement nous sommes complets à cet horaire. Quel autre créneau souhaiteriez-vous que je vérifie ?"
4. Tester exhaustivement les nouveaux patterns conversationnels

**Resources needed:**
- Accès au fichier `scripts/update-vapi-config.ts`
- Tests avec différentes formulations de dates/heures
- 5-10 appels de test pour validation

**Timeline:** 1-2 jours (modifications prompt uniquement)

---

#### #2 Priority: Gestion robuste des erreurs et cas limites

**Rationale:**
- Zéro bug embarrassant pendant la démo
- L'agent doit gérer TOUS les cas sans planter
- Démontre robustesse et professionnalisme du système

**Next steps:**
1. Implémenter fallback pour erreurs techniques
   - Message : "Je rencontre un problème technique. Puis-je prendre vos coordonnées ?"
   - Logger toutes les erreurs pour investigation
2. Gérer les grands groupes (> capacité totale)
   - Détecter dans webhook : `number_of_guests > capacité_totale`
   - Message : "Pour un groupe de cette taille, le restaurateur vous rappellera"
   - Créer "demande spéciale" en DB
3. Optimiser modifications de réservation
   - Toujours vérifier nouvelle dispo avant de confirmer modif
   - Si impossible → proposer autre créneau
4. Simplifier annulations
   - Gérer doublons de nom (demander date/heure précise)
   - Pas de confirmation "Êtes-vous sûr ?"

**Resources needed:**
- Modifications dans `/src/app/api/webhooks/vapi/route.ts`
- Ajout logging d'erreurs
- Potentiellement nouvelle table "special_requests" ou champ dans reservations
- Tests de tous les edge cases

**Timeline:** 2-3 jours (logique backend + prompt)

---

#### #3 Priority: Peaufiner la finalisation (polish UX)

**Rationale:**
- Petits détails qui impressionnent pendant la démo
- Démontre l'attention portée à l'expérience utilisateur
- Agent qui semble professionnel même hors de son scope principal

**Next steps:**
1. Ajouter collecte des demandes spéciales
   - Question : "Avez-vous des demandes particulières ?"
   - Capturer dans champ `special_requests` de create_reservation
2. Standardiser message de confirmation final
   - Format : "Votre table est réservée, vous recevrez un SMS de confirmation. À bientôt !"
3. Gérer cas hors scope avec élégance
   - Message : "Pour cette demande, un responsable vous rappellera."
   - Recentrer : "Je peux vous aider pour une réservation ?"

**Resources needed:**
- Modifications mineures du SYSTEM_PROMPT
- Validation que le champ `special_requests` existe en DB
- Tests conversationnels

**Timeline:** 1 jour (ajouts prompt + tests)

---

### Implementation Roadmap

**Sprint 1 - Quick Wins (1-2 jours)**
- ✅ Priorité #1 : Fluidité conversationnelle
- ✅ Priorité #3 : Polish UX
- Fichier principal : `scripts/update-vapi-config.ts`

**Sprint 2 - Robustesse (2-3 jours)**
- ✅ Priorité #2 : Gestion erreurs et cas limites
- Fichiers : `/src/app/api/webhooks/vapi/route.ts` + prompt

**Total : ~5 jours pour une démo production-ready**

---

### Backlog - Post-démo (pour scaling multi-tenant)

**Phase 2 - Architecture SaaS (après validation client)**
1. Architecture multi-tenant (1 assistant Vapi par restaurant)
2. FirstMessage dynamique avec variables
3. Interface restaurateur pour gestion des tables
4. Système d'onboarding clients

**Phase 3 - Optimisations avancées**
5. Intégration SMS (Twilio)
6. Suggestion intelligente de créneaux alternatifs
7. Analytics et reporting pour restaurateurs

---

## Reflection & Follow-up

### What Worked Well

- Découverte du contexte réel (démo avant multi-tenant) a permis de re-prioriser efficacement
- Revue systématique des 6 étapes du parcours utilisateur a été exhaustive
- Identification claire des quick wins VS chantiers architecturaux
- Catégorisation par priorité aide à l'actionnabilité immédiate

### Areas for Further Exploration

- **Métriques de succès de la démo** : Quels KPIs mesurer pendant les appels de démo ?
- **Scénarios de test exhaustifs** : Créer une checklist de tous les cas à tester avant démo
- **Optimisation voix/latence** : Investiguer si des problèmes de latence persistent avec Eleven Labs
- **Stratégie de pricing** : Comment facturer les clients (par appel, par restaurant, abonnement) ?

### Recommended Follow-up Techniques

- **5 Whys** : Pour investiguer la cause racine du bug de "fausse détection de réservation" mentionné initialement
- **User Journey Mapping** : Créer une carte visuelle complète du parcours client pour identifier d'autres friction points
- **Assumption Reversal** : "Et si on ne proposait PAS d'agent vocal mais une interface chat ?" pour explorer alternatives

### Questions That Emerged

- Comment gérer les restaurants avec services midi ET soir (2 capacités différentes) ?
- Faut-il un système de rappel automatique pour confirmer les réservations 24h avant ?
- Comment gérer les no-shows et potentiellement blacklister certains numéros ?
- Quelle est la stratégie de support client pour les restaurateurs (chat, email, téléphone) ?
- Comment mesurer la qualité des appels et détecter les conversations problématiques ?

### Next Session Planning

- **Suggested topics:**
  1. Création d'une checklist de test exhaustive pour la démo
  2. Définition des métriques de succès et dashboard analytics
  3. Brainstorming sur la stratégie de pricing et go-to-market

- **Recommended timeframe:** Après implémentation des 3 priorités (dans ~1 semaine)

- **Preparation needed:**
  - Avoir testé les modifications avec plusieurs scénarios réels
  - Compiler les logs d'erreurs ou bugs rencontrés
  - Avoir fait au moins 1-2 démos test avec des prospects

---

*Session facilitated using the BMAD-METHOD™ brainstorming framework*

