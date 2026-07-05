// Tools de consultation (lecture seule) : infos restaurant et date courante.
import { JOURS_FR, MOIS_FR, TIMEZONE } from "@/lib/utils/date-fr";
import { redactPII } from "@/lib/logger";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { OpeningHours, DaySchedule } from "@/types";
import type { GetRestaurantInfoArgs } from "./types";

export async function handleGetRestaurantInfo(args: GetRestaurantInfoArgs) {
  console.log("🏪 get_restaurant_info called with:", JSON.stringify(redactPII(args), null, 2));

  try {
    const { data: restaurant, error } = await getSupabaseAdmin()
      .from("restaurants")
      .select("name, phone, address, opening_hours, closed_dates")
      .eq("id", args.restaurant_id)
      .single();

    if (error || !restaurant) {
      console.error("❌ Restaurant not found:", error);
      return {
        success: false,
        message: "Désolé, je n'ai pas pu récupérer les informations du restaurant.",
      };
    }

    console.log("✅ Restaurant info found:", restaurant.name);

    // Formatter les horaires en texte lisible
    const openingHours = (restaurant.opening_hours ?? {}) as OpeningHours;
    let hoursText = "";

    const daysMap: { [key: string]: string } = {
      monday: "Lundi",
      tuesday: "Mardi",
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
      saturday: "Samedi",
      sunday: "Dimanche",
    };

    for (const [day, hours] of Object.entries(openingHours)) {
      const dayName = daysMap[day] || day;
      if (hours && typeof hours === "object") {
        const dayHours: DaySchedule = hours;
        const services = [];

        if (dayHours.lunch) {
          services.push(
            `déjeuner ${dayHours.lunch.start}-${dayHours.lunch.end}`
          );
        }
        if (dayHours.dinner) {
          services.push(`dîner ${dayHours.dinner.start}-${dayHours.dinner.end}`);
        }

        if (services.length > 0) {
          hoursText += `${dayName}: ${services.join(" et ")}. `;
        } else {
          hoursText += `${dayName}: fermé. `;
        }
      } else {
        hoursText += `${dayName}: fermé. `;
      }
    }

    const result = {
      success: true,
      message: `Voici nos horaires d'ouverture : ${hoursText.trim()}`,
      restaurant_name: restaurant.name,
      phone: restaurant.phone,
      address: restaurant.address,
      opening_hours: hoursText.trim(),
      closed_dates: restaurant.closed_dates,
    };

    console.log("🏪 get_restaurant_info result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ Error fetching restaurant info:", error);
    return {
      success: false,
      message: "Désolé, une erreur est survenue en récupérant les informations.",
    };
  }
}

export async function handleGetCurrentDate() {
  console.log("📅 get_current_date called");

  const now = new Date();

  // Le serveur (Vercel) tourne en UTC : on doit dériver la date/heure dans le
  // fuseau du restaurant, sinon après ~22h Paris l'agent croit être "hier".
  const parisYmd = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // "YYYY-MM-DD" (jour calendaire à Paris)
  const parisTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now); // "HH:mm"

  // Ancre à midi UTC du jour calendaire parisien : évite les bascules DST et
  // permet de dériver jour de semaine et décalages de façon sûre.
  const anchor = new Date(`${parisYmd}T12:00:00Z`);
  const ymd = (d: Date) => d.toISOString().split("T")[0];

  const tomorrow = new Date(anchor);
  tomorrow.setUTCDate(anchor.getUTCDate() + 1);

  const nextWeek = new Date(anchor);
  nextWeek.setUTCDate(anchor.getUTCDate() + 7);

  const year = Number(parisYmd.slice(0, 4));
  const dayOfMonth = Number(parisYmd.slice(8, 10));
  const monthIndex = Number(parisYmd.slice(5, 7)) - 1;

  const result = {
    success: true,
    message: `Nous sommes le ${JOURS_FR.FULL[anchor.getUTCDay()]} ${dayOfMonth} ${MOIS_FR.FULL[monthIndex]} ${year}`,
    current_date: parisYmd, // Format YYYY-MM-DD
    current_time: parisTime, // Format HH:mm
    day_of_week: JOURS_FR.FULL[anchor.getUTCDay()],
    tomorrow_date: ymd(tomorrow),
    tomorrow_day: JOURS_FR.FULL[tomorrow.getUTCDay()],
    next_week_date: ymd(nextWeek),
    year,
    full_datetime: now.toLocaleString("fr-FR", {
      timeZone: TIMEZONE,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  console.log("📅 get_current_date result:", JSON.stringify(result, null, 2));

  return result;
}

