import { notFound } from "next/navigation";
import CityPage from "../../components/CityPage";
import { getCityConfigBySlug } from "../../config/cities";
import {
  fetchEventsForCity,
  splitEventsByDate,
  getFallbackEventsForCity
} from "../../lib/events";
import { fetchCurrentWeather } from "../../lib/weather";

interface CitySlugPageProps {
  params: { citySlug: string };
}

export const revalidate = 600; // seconds; adjust as needed

export default async function CitySlugPage({ params }: CitySlugPageProps) {
  const city = getCityConfigBySlug(params.citySlug);

  if (!city) {
    notFound();
  }

  const [eventsFromApi, weather] = await Promise.all([
    fetchEventsForCity(city),
    fetchCurrentWeather(city)
  ]);

  const events =
    eventsFromApi.length > 0 ? eventsFromApi : getFallbackEventsForCity(city);

  const { tonightEvents, laterThisWeekEvents } = splitEventsByDate(events);

  return (
    <CityPage
      city={city}
      tonightEvents={tonightEvents}
      laterThisWeekEvents={laterThisWeekEvents}
      weather={weather}
    />
  );
}
