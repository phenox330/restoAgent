# Configuration Vapi - Aide visuelle

## Où trouver la Server URL dans Vapi ?

### Interface moderne (dashboard.vapi.ai)

1. Va sur https://dashboard.vapi.ai
2. Clique sur ton assistant (ou créé un nouveau)
3. Dans l'éditeur, cherche dans l'ordre :
   - **"Advanced Settings"** (en bas à gauche)
   - **"Server"** (dans le panneau de configuration)
   - **"Model"** → Scroll en bas → "Server URL"

### Champs à remplir :

**Server URL:**
```
https://famous-spiders-tan.loca.lt/api/webhooks/vapi
```

**Server URL Secret:** (laisser vide pour l'instant)

**Metadata:**
```json
{
  "restaurant_id": "ton-restaurant-id"
}
```

---

## Alternative : Créer l'assistant via API

Si tu ne trouves pas l'interface, on peut créer l'assistant directement avec l'API Vapi.

Donne-moi ton VAPI_PRIVATE_KEY et je crée l'assistant pour toi avec toute la config.
