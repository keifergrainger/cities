import type { CityConfig } from "../config/cities";

export interface CityWeather {
  tempF: number | null;
  feelsLikeF?: number | null;
  condition: string;
  description?: string;
  windMph?: number | null;
}

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

export async function fetchCurrentWeather(
  city: CityConfig
): Promise<CityWeather | null> {
  if (!WEATHER_API_KEY) {
    console.warn("[weather] WEATHER_API_KEY missing; skipping fetch.");
    return null;
  }

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", city.coordinates.lat.toString());
  url.searchParams.set("lon", city.coordinates.lon.toString());
  url.searchParams.set("appid", WEATHER_API_KEY);
  url.searchParams.set("units", "imperial");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 600 }
    });

    if (!res.ok) {
      console.error(
        "[weather] OpenWeather error:",
        res.status,
        res.statusText
      );
      return null;
    }

    const json = await res.json();

    const main = json.main || {};
    const weather0 = Array.isArray(json.weather) ? json.weather[0] : null;
    const wind = json.wind || {};

    const tempF =
      typeof main.temp === "number" ? main.temp : null;
    const feelsLikeF =
      typeof main.feels_like === "number" ? main.feels_like : null;
    const condition = weather0?.main || "Unknown";
    const description = weather0?.description || undefined;
    const windMph =
      typeof wind.speed === "number" ? wind.speed : null;

    return {
      tempF,
      feelsLikeF,
      condition,
      description,
      windMph
    };
  } catch (err) {
    console.error("[weather] Error fetching weather", err);
    return null;
  }
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function buildWeatherTickerLine(
  city: CityConfig,
  weather: CityWeather | null
): string {
  if (!weather || weather.tempF == null) {
    return `${city.cityName}: Weather currently unavailable`;
  }

  const temp = Math.round(weather.tempF);
  const desc =
    weather.description ? capitalize(weather.description) : weather.condition;
  const parts: string[] = [`Now: ${temp}°F · ${desc}`];

  if (weather.windMph != null) {
    parts.push(`Wind ${Math.round(weather.windMph)} mph`);
  }

  return parts.join(" · ");
}

export function buildHeroWeatherLine(
  city: CityConfig,
  weather: CityWeather | null
): string {
  if (!weather || weather.tempF == null) {
    return `Weather currently unavailable — but there’s still plenty happening around ${
      city.shortName || city.cityName
    }.`;
  }

  const temp = Math.round(weather.tempF);
  const condition = (weather.condition || "").toLowerCase();

  if (condition.includes("snow")) {
    return `${temp}°F · Snowy — bundle up, but it’s still a good night for a game or show.`;
  }

  if (condition.includes("rain")) {
    return `${temp}°F · Rainy — grab a jacket and pick something indoors tonight.`;
  }

  if (temp >= 80) {
    return `${temp}°F · Warm evening — perfect for patios, markets, and night events.`;
  }

  if (temp <= 40) {
    return `${temp}°F · Chilly night — ideal for cozy indoor events around ${
      city.shortName || city.cityName
    }.`;
  }

  return `${temp}°F · Comfortable tonight — great weather to get out around ${
    city.shortName || city.cityName
  }.`;
}
