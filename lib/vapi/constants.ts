/**
 * Assistant Vapi partagé (beta mono-assistant).
 * À terme (multi-tenant avancé) : un assistant_id par restaurant stocké en DB.
 */
export const VAPI_ASSISTANT_ID = "b31a622f-68c6-4eaf-a6ce-58a14ddcad23";

/**
 * Assistant "Indisponible" utilisé quand le bot est OFF.
 * Dit un message poli puis raccroche (modèle renvoi conditionnel :
 * le téléphone du resto sonne d'abord, le bot ne capte que les appels manqués).
 */
export const VAPI_CLOSED_ASSISTANT_ID = "1de49398-0e5d-4e29-8c06-9a5410dc3fe8";
