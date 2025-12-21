# Configuration Vapi.ai

Ce guide explique comment configurer l'agent vocal Vapi pour gérer les réservations de votre restaurant.

## Prérequis

1. Compte Vapi.ai créé (https://vapi.ai)
2. Restaurant configuré dans RestoAgent
3. Variables d'environnement configurées dans `.env.local`

## Étape 1 : Récupérer votre Restaurant ID

1. Connectez-vous à RestoAgent
2. Allez dans "Mon Restaurant"
3. L'ID du restaurant est visible dans l'URL ou vous pouvez l'obtenir via SQL :

```sql
SELECT id FROM restaurants WHERE user_id = 'votre_user_id';
```

## Étape 2 : Configurer le Webhook

1. Allez sur le dashboard Vapi
2. Créez ou éditez votre assistant
3. Dans "Server URL", entrez :
   ```
   https://votre-domaine.com/api/webhooks/vapi
   ```
4. Dans "Metadata", ajoutez :
   ```json
   {
     "restaurant_id": "votre_restaurant_id_ici"
   }
   ```

## Étape 3 : Configurer les Functions (Tools)

Dans l'éditeur Vapi, ajoutez ces 3 fonctions :

### Function 1: check_availability

```json
{
  "name": "check_availability",
  "description": "Vérifie si le restaurant a de la place disponible pour une réservation",
  "parameters": {
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "Date de la réservation au format YYYY-MM-DD (ex: 2024-12-25)"
      },
      "time": {
        "type": "string",
        "description": "Heure de la réservation au format HH:mm (ex: 19:30)"
      },
      "number_of_guests": {
        "type": "number",
        "description": "Nombre de personnes"
      }
    },
    "required": ["date", "time", "number_of_guests"]
  }
}
```

### Function 2: create_reservation

```json
{
  "name": "create_reservation",
  "description": "Crée une nouvelle réservation pour le client",
  "parameters": {
    "type": "object",
    "properties": {
      "customer_name": {
        "type": "string",
        "description": "Nom complet du client"
      },
      "customer_phone": {
        "type": "string",
        "description": "Numéro de téléphone du client"
      },
      "customer_email": {
        "type": "string",
        "description": "Email du client (optionnel)"
      },
      "date": {
        "type": "string",
        "description": "Date de la réservation au format YYYY-MM-DD"
      },
      "time": {
        "type": "string",
        "description": "Heure de la réservation au format HH:mm"
      },
      "number_of_guests": {
        "type": "number",
        "description": "Nombre de personnes"
      },
      "special_requests": {
        "type": "string",
        "description": "Demandes spéciales du client (optionnel)"
      }
    },
    "required": ["customer_name", "customer_phone", "date", "time", "number_of_guests"]
  }
}
```

### Function 3: cancel_reservation

```json
{
  "name": "cancel_reservation",
  "description": "Annule une réservation existante",
  "parameters": {
    "type": "object",
    "properties": {
      "reservation_id": {
        "type": "string",
        "description": "ID de la réservation à annuler"
      }
    },
    "required": ["reservation_id"]
  }
}
```

## Étape 4 : Configurer le Prompt de l'Assistant

Exemple de prompt pour votre assistant :

```
Tu es l'assistant vocal du restaurant [NOM DU RESTAURANT].

Ton rôle est de :
- Accueillir chaleureusement les clients
- Prendre des réservations
- Vérifier les disponibilités
- Annuler des réservations
- Répondre aux questions sur le restaurant

Processus de réservation :
1. Demande le nom complet du client
2. Demande la date souhaitée (format JJ/MM/AAAA)
3. Demande l'heure souhaitée (format HH:mm)
4. Demande le nombre de personnes
5. Vérifie la disponibilité avec check_availability
6. Si disponible, demande le numéro de téléphone
7. Crée la réservation avec create_reservation
8. Confirme la réservation au client

Important :
- Sois poli et professionnel
- Si pas de disponibilité, propose des alternatives
- Répète toujours les détails de la réservation pour confirmation
- Pour les annulations, demande le nom et la date de la réservation
```

## Étape 5 : Tester l'intégration

1. Appelez le numéro Vapi de votre assistant
2. Faites une réservation test
3. Vérifiez dans RestoAgent :
   - La réservation apparaît dans `/dashboard/reservations`
   - L'appel est enregistré dans `/dashboard/calls`

## Logs et Debug

Les logs Vapi apparaissent dans :
- Console du serveur Next.js (mode développement)
- Logs Vercel (production)
- Dashboard Vapi (historique des appels)

## Sécurité

⚠️ Important :
- Le `SUPABASE_SERVICE_ROLE_KEY` est utilisé pour bypass les RLS policies
- Ne jamais exposer cette clé côté client
- Le webhook doit être en HTTPS en production

## Variables d'environnement requises

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_PRIVATE_KEY=your_vapi_private_key
```

## Troubleshooting

### Les réservations ne sont pas créées
- Vérifier que le `restaurant_id` est correct dans la metadata Vapi
- Vérifier les logs du webhook
- Vérifier que le restaurant existe dans la base de données

### L'agent ne peut pas appeler les fonctions
- Vérifier que les fonctions sont bien configurées dans Vapi
- Vérifier que le Server URL est correct
- Vérifier que le webhook est accessible (HTTPS)

### Erreur "restaurant_id manquant"
- Ajouter `restaurant_id` dans la metadata de l'assistant Vapi
