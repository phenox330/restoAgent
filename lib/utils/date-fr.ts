/**
 * Utilitaires pour le formatage de dates en français
 * Centralise toutes les constantes et fonctions de formatage
 */

// Constantes pour les jours de la semaine
export const JOURS_FR = {
  FULL: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const,
  SHORT: ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"] as const,
} as const;

// Constantes pour les mois
export const MOIS_FR = {
  FULL: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ] as const,
  SHORT: ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"] as const,
} as const;

/**
 * Formate une date au format français court
 * @param dateStr - Date au format ISO (YYYY-MM-DD)
 * @param short - Si true, utilise les versions courtes (dim, jan)
 * @returns Date formatée (ex: "lundi 15 janvier" ou "lun 15 jan")
 */
export function formatDateFr(dateStr: string, short: boolean = false): string {
  const date = new Date(dateStr);
  const jours = short ? JOURS_FR.SHORT : JOURS_FR.FULL;
  const mois = short ? MOIS_FR.SHORT : MOIS_FR.FULL;

  return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]}`;
}

/**
 * Formate une date au format français long avec l'année
 * @param dateStr - Date au format ISO (YYYY-MM-DD)
 * @returns Date formatée (ex: "lundi 15 janvier 2026")
 */
export function formatDateLongFr(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formate une heure au format français
 * @param timeStr - Heure au format HH:mm
 * @returns Heure formatée (ex: "19h30")
 */
export function formatTimeFr(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  return minutes === "00" ? `${hours}h` : `${hours}h${minutes}`;
}
