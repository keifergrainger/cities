import type { CityConfig } from "../config/cities";

export interface CityEvent {
  id: string;
  name: string;
  category: string;
  startDateTime: string;
  startLocalDate: string; // "YYYY-MM-DD" in the city's local timezone
  venueName?: string;
  address?: string;
  area?: string;
  url?: string;
}

export interface SplitEvents {
  tonightEvents: CityEvent[];
  laterThisWeekEvents: CityEvent[];
  tonightHasMore: boolean;
  laterHasMore: boolean;
}

const TM_API_KEY = process.env.TM_API_KEY;
const TM_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

/**
 * Get a Date object that represents the local year/month/day
 * for the given city (midnight in that local day).
 */
export function getCityLocalDate(city: CityConfig, date?: Date): Date {
  const base = date ?? new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: city.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(base);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  // This Date represents the LOCAL year/month/day in the city's timezone
  return new Date(year, month - 1, day);
}

/**
 * Normalize any ISO string into a "YYYY-MM-DD" date string
 * in the given IANA timezone.
 */
export function toLocalDateString(
  dateIso: string,
  timeZone: string
): string {
  const d = new Date(dateIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  return `${year}-${month}-${day}`; // e.g. "2025-11-13"
}

export async function fetchEventsForCity(
  city: CityConfig
): Promise<CityEvent[]> {
  if (!TM_API_KEY) {
    console.warn("[events] TM_API_KEY missing; using fallback events.");
    return [];
  }

  // Use the CITY'S local date as the anchor window
  const todayLocal = getCityLocalDate(city);

  const start = new Date(
    Date.UTC(
      todayLocal.getFullYear(),
      todayLocal.getMonth(),
      todayLocal.getDate(),
      0,
      0,
      0
    )
  );
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // 7-day window including today

  const startDateTime = start.toISOString().slice(0, 19) + "Z";
  const endDateTime = end.toISOString().slice(0, 19) + "Z";

  const url = new URL(TM_BASE_URL);
  url.searchParams.set("apikey", TM_API_KEY);
  url.searchParams.set("city", city.cityName);
  url.searchParams.set("stateCode", city.stateCode);
  url.searchParams.set("countryCode", "US");
  url.searchParams.set("size", "100");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("startDateTime", startDateTime);
  url.searchParams.set("endDateTime", endDateTime);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 600 }
    });

    if (!res.ok) {
      console.error(
        "[events] Ticketmaster error:",
        res.status,
        res.statusText
      );
      return [];
    }

    const json = await res.json();
    const rawEvents = json?._embedded?.events ?? [];
    if (!Array.isArray(rawEvents)) return [];

    const mapped: CityEvent[] = rawEvents
      .map((evt: any): CityEvent | null => {
        const id = evt.id;
        const name = evt.name;

        const tmStart = evt.dates?.start;
        const tmDateTime: string | undefined = tmStart?.dateTime;
        const tmLocalDate: string | undefined = tmStart?.localDate;

        if (!id || !name || (!tmDateTime && !tmLocalDate)) return null;

        let startDateTime: string;
        let startLocalDate: string;

        if (tmDateTime) {
          // Use Ticketmaster's full ISO and normalize to the city's local date
          startDateTime = tmDateTime;
          startLocalDate = toLocalDateString(tmDateTime, city.timeZone);
        } else {
          // Only localDate provided – anchor at midday UTC to avoid off-by-one
          const synthetic = `${tmLocalDate}T12:00:00Z`;
          startDateTime = synthetic;
          startLocalDate = toLocalDateString(synthetic, city.timeZone);
        }

        const venue = evt._embedded?.venues?.[0];
        const venueName = venue?.name;
        const addressParts = [
          venue?.address?.line1,
          venue?.city?.name,
          venue?.state?.stateCode
        ].filter(Boolean);
        const address = addressParts.join(" · ");

        const segment = evt.classifications?.[0]?.segment?.name;
        const genre = evt.classifications?.[0]?.genre?.name;
        const category = genre || segment || "Event";

        const area =
          venue?.neighborhood || venue?.city?.name || city.cityName;

        return {
          id,
          name,
          category,
          startDateTime,
          startLocalDate,
          venueName,
          address,
          area,
          url: evt.url
        };
      })
      .filter(Boolean) as CityEvent[];

    // De-dupe by id
    const unique = new Map<string, CityEvent>();
    for (const e of mapped) {
      if (!unique.has(e.id)) unique.set(e.id, e);
    }

    const events = Array.from(unique.values()).sort((a, b) => {
      const aTime = new Date(a.startDateTime).getTime();
      const bTime = new Date(b.startDateTime).getTime();
      return aTime - bTime;
    });

    return events;
  } catch (err) {
    console.error("[events] fetchEventsForCity failed:", err);
    return [];
  }
}

const TONIGHT_LIMIT = 2;
const LATER_LIMIT = 3;

export function splitEventsByDate(
  events: CityEvent[],
  city: CityConfig
): SplitEvents {
  // City-local "today"
  const todayLocal = getCityLocalDate(city);
  const todayKey = toLocalDateString(
    todayLocal.toISOString(),
    city.timeZone
  );

  // City-local end-of-week (today + 6 days)
  const endOfWeekLocal = new Date(todayLocal);
  endOfWeekLocal.setDate(endOfWeekLocal.getDate() + 6);
  const endOfWeekKey = toLocalDateString(
    endOfWeekLocal.toISOString(),
    city.timeZone
  );

  const tonightsEventsAll = events.filter(
    (evt) => evt.startLocalDate === todayKey
  );

  const laterThisWeekAll = events.filter(
    (evt) =>
      evt.startLocalDate > todayKey && evt.startLocalDate <= endOfWeekKey
  );

  const tonightEvents = tonightsEventsAll.slice(0, TONIGHT_LIMIT);
  const laterThisWeekEvents = laterThisWeekAll.slice(0, LATER_LIMIT);

  const tonightHasMore = tonightsEventsAll.length > TONIGHT_LIMIT;
  const laterHasMore = laterThisWeekAll.length > LATER_LIMIT;

  return {
    tonightEvents,
    laterThisWeekEvents,
    tonightHasMore,
    laterHasMore
  };
}

export function getFallbackEventsForCity(city: CityConfig): CityEvent[] {
  const todayLocal = getCityLocalDate(city);

  const tonight = new Date(todayLocal);
  tonight.setHours(19, 0, 0, 0);

  const saturday = new Date(todayLocal);
  saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7));
  saturday.setHours(9, 0, 0, 0);

  const twoDaysOut = new Date(todayLocal);
  twoDaysOut.setDate(twoDaysOut.getDate() + 2);
  twoDaysOut.setHours(18, 30, 0, 0);

  return [
    {
      id: `${city.slug}-fallback-1`,
      name: `${city.shortName || city.cityName} Night Market`,
      category: "Food & drink",
      startDateTime: tonight.toISOString(),
      startLocalDate: toLocalDateString(
        tonight.toISOString(),
        city.timeZone
      ),
      venueName: "Downtown plaza",
      address: `${city.cityName} · ${city.stateCode}`,
      area: "Downtown",
      url: "#"
    },
    {
      id: `${city.slug}-fallback-2`,
      name: "Community Sunset Hike",
      category: "Outdoors",
      startDateTime: twoDaysOut.toISOString(),
      startLocalDate: toLocalDateString(
        twoDaysOut.toISOString(),
        city.timeZone
      ),
      venueName: "Local trailhead",
      address: `${city.cityName} · ${city.stateCode}`,
      area: "Foothills",
      url: "#"
    },
    {
      id: `${city.slug}-fallback-3`,
      name: "Weekend Farmers Market",
      category: "Family",
      startDateTime: saturday.toISOString(),
      startLocalDate: toLocalDateString(
        saturday.toISOString(),
        city.timeZone
      ),
      venueName: "Central park",
      address: `${city.cityName} · ${city.stateCode}`,
      area: "Central",
      url: "#"
    }
  ];
}
