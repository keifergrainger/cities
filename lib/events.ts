import type { CityConfig } from "../config/cities";

export interface CityEvent {
  id: string;
  name: string;
  category: string;
  startDateTime: string;
  venueName?: string;
  address?: string;
  area?: string;
  url?: string;
}

export interface SplitEvents {
  tonightEvents: CityEvent[];
  laterThisWeekEvents: CityEvent[];
}

const TM_API_KEY = process.env.TM_API_KEY;
const TM_BASE_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function fetchEventsForCity(
  city: CityConfig
): Promise<CityEvent[]> {
  if (!TM_API_KEY) {
    console.warn("[events] TM_API_KEY missing; using fallback events.");
    return [];
  }

  const now = new Date();

  const start = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  );
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

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
        const startDateTime = evt.dates?.start?.dateTime;

        if (!id || !name || !startDateTime) return null;

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
          venueName,
          address,
          area,
          url: evt.url
        };
      })
      .filter(Boolean) as CityEvent[];

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
    console.error("[events] Error fetching Ticketmaster events", err);
    return [];
  }
}

export function splitEventsByDate(events: CityEvent[]): SplitEvents {
  const now = new Date();
  const todayKey = toDateKey(now);

  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 6);

  const tonightEvents: CityEvent[] = [];
  const laterThisWeekEvents: CityEvent[] = [];

  for (const evt of events) {
    const dt = new Date(evt.startDateTime);
    if (Number.isNaN(dt.getTime())) continue;

    if (dt < now || dt > windowEnd) continue;

    const key = toDateKey(dt);
    if (key === todayKey) tonightEvents.push(evt);
    else laterThisWeekEvents.push(evt);
  }

  return { tonightEvents, laterThisWeekEvents };
}

export function getFallbackEventsForCity(city: CityConfig): CityEvent[] {
  const today = new Date();
  const tonight = new Date(today);
  tonight.setHours(19, 0, 0, 0);

  const saturday = new Date(today);
  saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7));
  saturday.setHours(9, 0, 0, 0);

  const twoDaysOut = new Date(today);
  twoDaysOut.setDate(twoDaysOut.getDate() + 2);
  twoDaysOut.setHours(18, 30, 0, 0);

  return [
    {
      id: `${city.slug}-fallback-1`,
      name: `${city.shortName || city.cityName} Night Market`,
      category: "Food & drink",
      startDateTime: tonight.toISOString(),
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
      venueName: "Central park",
      address: `${city.cityName} · ${city.stateCode}`,
      area: "Central",
      url: "#"
    }
  ];
}
