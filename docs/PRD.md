Voici un **PRD (Product Requirement Document)** professionnel et "propre", rédigé comme si le projet démarrait de zéro. Ce document servira de **source de vérité** pour Cursor ou Claude.

---

# PRD : RestoAgent – Hôtesse Vocale IA Haute Fidélité

**Version :** 1.0 (Initial Release)

**Statut :** Document de Référence

**Cible :** Restaurants Premium & Moyenne Gamme

---

## 1. Vision du Produit

RestoAgent est une solution SaaS qui automatise la prise de réservation téléphonique via une IA vocale ultra-réaliste. L'objectif est de libérer le personnel de salle tout en offrant une expérience client haut de gamme, disponible 24h/24, sans erreur humaine.

## 2. Objectifs Métiers

* **Disponibilité Totale** : Répondre à 100% des appels, même pendant le "coup de feu" ou la fermeture.
* **Fiabilité de Données** : Garantir des réservations sans erreurs de date, d'heure ou de nombre de couverts.
* **Réduction du No-Show** : Sécuriser chaque réservation par une confirmation SMS immédiate.
* **Zéro Friction Logicielle** : S'intégrer de manière transparente sans nécessiter de formation complexe pour le staff.

## 3. Spécifications Fonctionnelles

### 3.1. Agent Vocal IA (Vapi + GPT-4o)

* **Accueil Personnalisé** : L'IA décroche avec le nom du restaurant et adopte un ton professionnel et chaleureux.
* **Extraction Structurée** : L'IA doit extraire et valider :
* Date et Heure (avec conversion intelligente : "samedi prochain" -> date ISO).
* Nombre de couverts.
* Nom du client.
* Numéro de téléphone (détecté par Caller ID ou demandé par l'IA).


* **Vérification de Disponibilité** : L'IA interroge la base de données en temps réel avant de confirmer la table.
* **Gestion des Demandes Spéciales** : Capture des allergies, anniversaires ou préférences de placement.

### 3.2. Moteur de Recherche Intelligent

* **Recherche Phonétique (Fuzzy Search)** : Capacité à retrouver une réservation existante malgré des erreurs de transcription du nom (ex: "Antony" vs "Anthony").
* **Priorité au Numéro de Téléphone** : Identification unique basée sur le numéro d'appelant pour éviter les doublons.

### 3.3. Notifications & Confirmation

* **Confirmation SMS** : Envoi automatique d'un SMS récapitulatif à la fin de l'appel.
* **Lien d'Annulation Self-Service** : Inclusion d'un lien dans le SMS permettant au client d'annuler sa table sans avoir à rappeler.

### 3.4. Dashboard Restaurateur

* **Vue "Activité Live"** : Liste chronologique des appels avec accès à la transcription texte intégrale.
* **Gestion du Planning** : Vue simplifiée des réservations confirmées.
* **Configuration du Service** : Interface pour définir les horaires d'ouverture et la capacité maximale de couverts par service (Midi/Soir).

## 4. Spécifications Techniques

### 4.1. Architecture Backend

* **Framework** : Next.js 15 (App Router).
* **Base de Données** : Supabase (PostgreSQL).
* **Pipeline Vocal** : Vapi.ai couplé au modèle GPT-4o Realtime.
* **Sécurité des Données** : Utilisation d'un client administrateur dédié pour les écritures automatiques déclenchées par l'IA (Bypass RLS pour les processus automatisés).

### 4.2. Logique d'Intelligence Artificielle

* **Zéro Hallucination** : Si l'IA ne trouve pas d'information ou ne comprend pas, elle doit demander confirmation ou transférer l'appel.
* **Gestion de l'Interruption** : L'IA doit s'arrêter de parler immédiatement si le client l'interrompt.

## 5. Parcours Utilisateur Cible (User Flow)

1. **Le client appelle** le restaurant.
2. **L'IA décroche**, identifie le client via son numéro et demande l'objet de l'appel.
3. **L'IA vérifie la dispo** via une API interne.
4. **L'IA confirme vocalement** : "C'est réservé pour 4 personnes ce samedi à 20h".
5. **Le système enregistre** en BDD et envoie le SMS de confirmation.
6. **Le restaurateur voit** la nouvelle ligne apparaître instantanément sur son dashboard.

---

### 1. La Gestion des "Edge Cases" (Cas Limites)

Dans la restauration haute qualité, tout n'est pas binaire. Ton PRD doit prévoir :

* **Le Transfert Intelligent (Human Fallback) :** Si l'IA détecte de la frustration, si le client demande un événement spécial (mariage, privatisation), ou si elle échoue 2 fois à comprendre, elle doit dire : *"Je vous transfère à un responsable pour finaliser cela"* et déclencher un transfert d'appel Vapi vers la ligne du resto.
* **La Gestion des Groupes :** Au-delà de 6 ou 8 personnes, un restaurant premium ne veut souvent pas de réservation automatique. L'IA doit savoir dire : *"Pour les groupes de cette taille, je dois prendre vos coordonnées et le gérant vous rappellera pour valider les conditions."*

### 2. La Sécurité "Anti-Spam" et "Anti-Doublon"

Sans cela, ton calendrier va se remplir de fausses données :

* **Vérification de Signature Webhook :** Pour empêcher quiconque de poster des fausses réservations sur ton API `/api/webhooks/vapi`, tu dois valider que la requête vient bien de Vapi (Header secret).
* **Logique Anti-Doublon :** Si un client appelle deux fois pour la même date, l'IA doit identifier la réservation existante via le numéro de téléphone et demander : *"Vous avez déjà une table pour demain, souhaitez-vous la modifier ou en ajouter une autre ?"*

### 3. La "Tranche de Service" (Yield Management de base)

Un restaurant ne gère pas sa capacité uniquement sur la journée :

* **Capacité par Service :** Tu dois pouvoir configurer 40 couverts le midi et 60 le soir.
* **Heures de "Coupure" :** L'IA doit refuser une table à 15h30 si le service finit à 15h, même s'il reste de la capacité théorique.

---

```markdown
## 4.3. Robustesse & Sécurité (V2 Additions)
- **Signature Verification** : Vérifier le header `x-vapi-secret` sur toutes les routes API entrantes.
- **Human Fallback** : Déclencher un `transferCall` Vapi vers le numéro de secours si :
    - Sentiment négatif détecté (frustration).
    - Demande de privatisation ou > 10 personnes.
    - Échec répété d'extraction d'information (3 tentatives).
- **Service Partitioning** : Gérer la capacité de manière distincte pour le créneau 'Midi' et 'Soir'.
- **Concurrency Locking** : S'assurer que deux appels simultanés ne peuvent pas réserver la dernière table disponible (Transaction SQL).

```
1. Le "Dashboard de Secours" (Human-in-the-loop)
Même avec la meilleure IA, il y aura des bruits de fond ou des accents impossibles à comprendre.

Détail PRD : Si l'IA détecte une incertitude (score de confiance < 70%), la réservation est créée avec un statut A CONFIRMER (badge orange sur le dashboard).

Action : Le restaurateur reçoit une notification : "L'IA a pris une table pour M. ? (Audio disponible), merci de valider." * Valeur : Cela prouve au restaurateur que le système ne fera jamais d'erreur grave "dans son dos".

2. La Gestion du "Complet" (Waitlist intelligente)
Un restaurant haut de gamme est souvent complet. Dire simplement "C'est complet, au revoir" est une perte de revenu.

Détail PRD : Si check_availability retourne false, l'IA doit proposer : "Nous sommes complets pour samedi soir, mais il nous reste de la place à 12h30 le dimanche, ou je peux vous noter sur liste d'attente. Qu'en dites-vous ?"

Valeur : Tu sauves du chiffre d'affaires. C'est l'argument de vente n°1 pour rentabiliser ton abonnement SaaS.

3. La RGPD et la Transparence (Légal & Image)
En France, enregistrer une voix sans prévenir est illégal et peut nuire à l'image "Luxe".

Détail PRD : L'IA doit avoir une phrase d'accroche légale ultra-rapide et élégante au début ou à la fin, ou un message automatique : "Pour améliorer notre service, cet appel peut être traité par notre assistant numérique."

Valeur : Professionnalisme et conformité.

2.2. Moteur de Réservation & Disponibilité
Vérification temps réel : Calcul basé sur capacité_max par service (Midi vs Soir).

Gestion des créneaux : Refus intelligent si l'appel arrive hors des heures de service ou si le restaurant est complet.

Liste d'attente (Waitlist) : Proposer de noter les coordonnées si le créneau est complet.

2.3. Recherche Intelligente (Anti-Doublons & Erreurs)
Priorité Téléphone : Identification via le numéro d'appelant (Caller ID).

Fuzzy Search (Noms) : Utilisation de l'extension pg_trgm pour matcher "Antony" et "Anthony".

Gestion des homonymes : Si deux réservations existent pour le même nom, demander le numéro de téléphone pour confirmer.

3. Sécurité & Robustesse (Critique)
3.1. Bypass RLS (Write Access)
Toutes les écritures via Webhook (/api/webhooks/vapi) doivent utiliser un client Supabase Admin (Service Role) pour garantir la modification des données sans blocage de politiques de sécurité.

3.2. Validation & Edge Cases
Vérification Signature : Validation du header x-vapi-secret.

Transfert Humain (Fallback) : Déclencher un transfert vers la ligne fixe du resto si :

Demande de groupe > 8 personnes (Privatisation).

Incompréhension répétée (3 fois).

Demande explicite : "Je veux parler à quelqu'un".

4. Notifications & UX
4.1. Confirmation SMS (Twilio)
Envoi automatique dès la fin de l'appel.

Inclusion d'un Lien d'Annulation unique.

4.2. Dashboard Restaurateur (Interface)
Live Feed : Visualisation des appels en cours et transcriptions.

Badges de Statut : Confirmé, A Confirmer (si score de confiance IA < 70%), Annulé.

Fiche Client : Historique des appels et préférences (allergies).

1. La gestion de la latence (L'expérience "Luxe")
Rien ne casse plus l'immersion qu'un blanc de 3 secondes après que le client a parlé.

Le détail technique : Utiliser des "Filler Words" (mots de remplissage).

Le PRD doit spécifier : L'agent doit utiliser des expressions comme "Laissez-moi vérifier un instant..." ou "Je regarde sur notre planning..." pendant que l'IA interroge Supabase. Cela réduit la perception de l'attente.

2. Le "Voice Branding" (L'identité sonore)
Dans le haut de gamme, l'IA ne peut pas avoir une voix de robot standard.

Le PRD doit spécifier : Utiliser des modèles de voix "High-Fidelity" (comme ElevenLabs ou OpenAI Alloy) avec une configuration spécifique sur la vitesse de parole (un peu plus lente pour paraître plus posée et luxueuse).

3. Le filtrage des appels non liés aux réservationsLe téléphone d'un resto sonne aussi pour : les livreurs, les candidats pour un job, ou les démarcheurs.Le PRD doit spécifier : Un menu de routage intelligent.Si le client dit "Je suis le livreur" ou "Je cherche un stage" : L'IA doit répondre "Je vous prie de rappeler entre 15h et 17h ou de vous présenter à l'entrée de service" sans bloquer le planning.Tableau de bord des flux finaux (Vue d'ensemble)État de l'appelAction de l'IASécuritéRéservation simpleConfirme + SMSVérification capacité réelleNom douteuxDemande de confirmation phonétiqueFuzzy matching SQLGroupe > 8 pers.Transfert vers managerPréservation du CA VIPCompletPropose une alternative / WaitlistSauvetage du clientIncompréhensionTransfert vers ligne fixeFallback humain obligatoire