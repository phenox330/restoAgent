# 💾 Comment ne JAMAIS perdre la configuration qui fonctionne

## ✅ Ce qui a été mis en place

### 1. Sauvegarde JSON
La configuration Vapi actuelle est sauvegardée dans :
- `backups/vapi-config-working-LATEST.json` (dernière version)
- `backups/vapi-config-working-2025-12-19T12-28-09-372Z.json` (horodatée)

### 2. Scripts de sauvegarde/restauration

**Sauvegarder** (avant toute modification) :
```bash
npx tsx scripts/backup-vapi-config.ts
```

**Restaurer** la dernière version qui marche :
```bash
npx tsx scripts/restore-vapi-config.ts
```

**Restaurer** une version spécifique :
```bash
npx tsx scripts/restore-vapi-config.ts backups/vapi-config-working-2025-12-19-*.json
```

### 3. Git
- Repository Git initialisé
- Commit initial avec la config qui fonctionne
- Tag `v1.0-working` créé

**Revenir à cette version via Git** :
```bash
git checkout v1.0-working
```

## 🛡️ Garanties

### Triple protection :
1. **Fichiers JSON** dans `backups/` (peuvent être copiés ailleurs)
2. **Scripts de restore** pour remettre la config en 1 commande
3. **Git** avec tag pour version complète du projet

### Configuration sauvegardée :
- **Modèle** : gpt-4o-realtime-preview-2024-12-17
- **Voix** : OpenAI alloy
- **Fonctions** : 3 (check_availability, create_reservation, cancel_reservation)
- **Prompt** : Avec variable `{{ "now" | date: "%b %d, %Y, %I:%M %p", "Europe/Paris" }}`
- **Server URL** : https://y-lemon-ten.vercel.app/api/webhooks/vapi
- **Restaurant ID** : a0a1a251-0f2d-495a-9141-8115a10a9d77

## 📋 Protocole AVANT toute modification

**TOUJOURS faire :**
```bash
# 1. Backup de la config actuelle
npx tsx scripts/backup-vapi-config.ts

# 2. Commit Git si des fichiers ont changé
git add .
git commit -m "Backup avant modification X"

# 3. Faire la modification

# 4. Si ça ne marche pas, restaurer
npx tsx scripts/restore-vapi-config.ts
```

## 🚨 En cas de perte totale

Si tout est cassé et que tu veux revenir à la version qui marche :

```bash
# Option 1: Via le script de restore
npx tsx scripts/restore-vapi-config.ts backups/vapi-config-working-LATEST.json

# Option 2: Via Git
git checkout v1.0-working

# Option 3: Manuelle
# Ouvrir backups/vapi-config-working-LATEST.json
# Copier/coller dans le dashboard Vapi
```

## ✅ Tu es protégé !

Cette configuration ne sera **JAMAIS** perdue tant que :
- Le dossier `backups/` existe
- Les scripts existent
- Le repo Git existe

**Conseil** : Copie aussi `backups/vapi-config-working-LATEST.json` sur un autre disque/cloud pour double sécurité.
