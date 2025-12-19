# Backups Vapi Configuration

Ce dossier contient les sauvegardes de la configuration Vapi.

## Fichiers

- `vapi-config-working-LATEST.json` - Dernière configuration qui fonctionne
- `vapi-config-working-YYYY-MM-DD-*.json` - Sauvegardes horodatées

## Utilisation

### Sauvegarder la config actuelle

```bash
npx tsx scripts/backup-vapi-config.ts
```

### Restaurer la dernière config qui marche

```bash
npx tsx scripts/restore-vapi-config.ts
```

### Restaurer une config spécifique

```bash
npx tsx scripts/restore-vapi-config.ts backups/vapi-config-working-2025-12-19-*.json
```

## Important

⚠️ **TOUJOURS faire un backup avant de modifier la config Vapi !**

La configuration actuelle fonctionne avec :
- Modèle: gpt-4o-realtime-preview-2024-12-17
- Voix: OpenAI alloy
- 3 fonctions: check_availability, create_reservation, cancel_reservation
- Variable {{ now }} pour les dates relatives
