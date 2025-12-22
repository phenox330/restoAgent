# Configuration Twilio SMS

Ce guide explique comment configurer Twilio pour envoyer des SMS de confirmation et de rappel de réservation.

## Prérequis

1. Compte Twilio créé (https://www.twilio.com)
2. Numéro de téléphone Twilio (test ou payant)
3. Accès au dashboard RestoAgent

## Fonctionnalités SMS

RestoAgent utilise Twilio pour 3 types de SMS :

| Type | Déclencheur | Contenu |
|------|-------------|---------|
| **Confirmation** | Création de réservation | Récapitulatif + lien d'annulation |
| **Rappel** | 24h avant la réservation (cron) | Rappel de la réservation |
| **Annulation** | Annulation via le lien | Confirmation d'annulation |

## Étape 1 : Créer un compte Twilio

1. Allez sur https://www.twilio.com/try-twilio
2. Créez un compte avec votre email
3. Vérifiez votre email et numéro de téléphone

## Étape 2 : Récupérer les credentials

Dans le dashboard Twilio (https://console.twilio.com) :

1. **Account SID** : Visible sur la page d'accueil du dashboard
2. **Auth Token** : Cliquez sur "Show" pour le révéler

Ces credentials sont nécessaires pour authentifier les appels API.

## Étape 3 : Obtenir un numéro de téléphone

### Option A : Numéro de test (gratuit)

Pour les tests, Twilio fournit un numéro de test :
- **Numéro de test** : `+1 220 345 0018`
- **Limitation** : Ne peut envoyer qu'aux numéros vérifiés dans votre compte

Pour vérifier un numéro :
1. Dashboard Twilio → Phone Numbers → Verified Caller IDs
2. Ajoutez le numéro qui recevra les SMS de test

### Option B : Numéro payant (production)

Pour la production :
1. Dashboard Twilio → Phone Numbers → Buy a number
2. Choisissez un numéro français (+33) ou selon votre marché
3. Les numéros français commencent autour de $1.15/mois

## Étape 4 : Variables d'environnement

### Développement local

Créez ou modifiez `.env.local` :

```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+12203450018

# Secret pour le cron job (générez une chaîne aléatoire)
CRON_SECRET=votre_secret_aleatoire_ici
```

### Production (Vercel)

1. Allez dans votre projet Vercel
2. Settings → Environment Variables
3. Ajoutez les mêmes variables

**Important** : `CRON_SECRET` est utilisé pour sécuriser le endpoint de rappels automatiques.

## Étape 5 : Activer les SMS dans RestoAgent

1. Connectez-vous au dashboard RestoAgent
2. Allez dans "Mon Restaurant" → Paramètres
3. Activez l'option "Notifications SMS"

## Étape 6 : Tester l'intégration

### Test manuel

```bash
# Exécuter le script de test (depuis la racine du projet)
npx tsx scripts/test-twilio-sms.ts
```

### Test via l'application

1. Créez une réservation via un appel vocal
2. Vérifiez la réception du SMS de confirmation
3. Cliquez sur le lien d'annulation dans le SMS
4. Vérifiez la réception du SMS d'annulation

### Test des rappels

Le cron job s'exécute automatiquement à 9h UTC. Pour tester manuellement :

```bash
# En développement
curl http://localhost:3000/api/cron/send-reminders

# En production (avec le secret)
curl -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  https://votre-domaine.vercel.app/api/cron/send-reminders
```

## Format des numéros de téléphone

Le système accepte plusieurs formats de numéros français :

| Format entré | Format envoyé (E.164) |
|--------------|----------------------|
| `0612345678` | `+33612345678` |
| `+33612345678` | `+33612345678` |
| `06 12 34 56 78` | `+33612345678` |
| `33612345678` | `+33612345678` |

## Coûts Twilio

### Envoi de SMS

| Destination | Coût approximatif |
|-------------|-------------------|
| France (numéro mobile) | ~$0.0725 par SMS |
| France (numéro fixe) | ~$0.0725 par SMS |
| International | Variable selon pays |

### Numéro de téléphone

- Numéro français : ~$1.15/mois
- Numéro US : ~$1.00/mois

### Estimation mensuelle

Pour un restaurant moyen (100 réservations/mois) :
- SMS de confirmation : 100 × $0.0725 = $7.25
- SMS de rappel : 100 × $0.0725 = $7.25
- SMS d'annulation : ~10 × $0.0725 = $0.73
- **Total** : ~$15-20/mois

## Troubleshooting

### Les SMS ne sont pas envoyés

1. Vérifiez les variables d'environnement
2. Vérifiez les logs Vercel ou la console
3. Assurez-vous que le restaurant a activé les SMS

### Erreur "Twilio non configuré"

Les variables d'environnement Twilio sont manquantes. Vérifiez :
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### Erreur "Invalid phone number"

Le numéro de destination n'est pas au bon format. Vérifiez :
- Format E.164 requis (`+33...`)
- Le numéro est valide et peut recevoir des SMS

### Numéro de test ne fonctionne pas

Avec un numéro de test Twilio :
- Seuls les numéros vérifiés peuvent recevoir des SMS
- Ajoutez le numéro destinataire dans "Verified Caller IDs"

## Sécurité

- Ne jamais exposer `TWILIO_AUTH_TOKEN` côté client
- Utilisez les variables d'environnement Vercel (pas de fichiers publics)
- Le `CRON_SECRET` protège le endpoint de rappels contre les appels non autorisés

## Ressources

- [Documentation Twilio](https://www.twilio.com/docs/sms)
- [API SMS Twilio](https://www.twilio.com/docs/sms/api)
- [Tarifs Twilio](https://www.twilio.com/sms/pricing)
- [Console Twilio](https://console.twilio.com)
