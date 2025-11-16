import React from "react";
import type { CityConfig } from "../config/cities";
import type { CityEvent } from "../lib/events";
import { getCityLocalDate } from "../lib/events";
import type { CityWeather } from "../lib/weather";
import {
  buildHeroWeatherLine,
  buildWeatherTickerLine
} from "../lib/weather";

interface CityPageProps {
  city: CityConfig;
  tonightEvents: CityEvent[];
  laterThisWeekEvents: CityEvent[];
  tonightHasMore: boolean;
  laterHasMore: boolean;
  weather: CityWeather | null;
}

function formatEventMeta(evt: CityEvent): string {
  try {
    const dt = new Date(evt.startDateTime);
    if (Number.isNaN(dt.getTime())) return "Time TBA";

    const datePart = dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    const timePart = dt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });

    const pieces: string[] = [datePart, timePart];

    if (evt.venueName) pieces.push(evt.venueName);
    if (evt.address) pieces.push(evt.address);

    return pieces.join(" · ");
  } catch {
    return "Details coming soon";
  }
}

function buildTagLabel(evt: CityEvent): string | null {
  const parts: string[] = [];
  if (evt.category) parts.push(evt.category);
  if (evt.area) parts.push(evt.area);
  if (!parts.length) return null;
  return parts.join(" · ");
}

function CityPage({
  city,
  tonightEvents,
  laterThisWeekEvents,
  tonightHasMore,
  laterHasMore,
  weather
}: CityPageProps) {
  const todayLocal = getCityLocalDate(city);

  const todayLabel = todayLocal.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: city.timeZone
  });

  const year = todayLocal.getFullYear();

  const tickerLabel =
    city.tickerLabel || `Live city ticker — ${city.cityName}, ${city.stateCode}`;

  const weatherTicker = buildWeatherTickerLine(city, weather);
  const heroWeather = buildHeroWeatherLine(city, weather);

  const anyEvents = tonightEvents.length > 0 || laterThisWeekEvents.length > 0;
  const hasTonight = tonightEvents.length > 0;
  const hasLater = laterThisWeekEvents.length > 0;

  const featuredEvent = tonightEvents[0] || laterThisWeekEvents[0] || null;
  const featuredEventId = featuredEvent?.id;

  return (
    <div className="app-shell">
      <div className="app-inner">
        <header className="site-header">
          <div className="logo-block">
            <div className="logo-mark">
              <span>{city.brandInitials || city.shortName || city.cityName}</span>
            </div>
            <div className="logo-text">
              <div className="site-title">
                {city.cityName}, {city.stateCode}
              </div>
              <div className="site-tagline">{city.heroTagline}</div>
            </div>
          </div>

          <div className="header-cta">
            <div className="header-cta-label">
              Today in {city.cityName} · <span>{todayLabel}</span>
            </div>
            <div className="header-cta-actions">
              <a className="btn-solid" href="#events">
                Today’s events
              </a>
              <a className="btn-ghost" href="#services">
                Find a local pro
              </a>
            </div>
          </div>
        </header>

        <div className="page">
          <section
            className="hero"
            aria-labelledby="hero-heading"
            style={{ ["--hero-image-url" as any]: `url('${city.heroImageUrl}')` }}
          >
            <div className="hero-inner">
              <div className="hero-main">
                <h1 id="hero-heading">
                  {city.cityName}, {city.stateCode}
                </h1>
                <p>{city.heroTagline}</p>
                {heroWeather && (
                  <div className="hero-weather">
                    <span className="hero-weather-label">Right now:</span>
                    <span className="hero-weather-value">{heroWeather}</span>
                  </div>
                )}
              </div>

              <div className="hero-meta">
                <div className="hero-pill">
                  <span className="pill-label">Today</span>
                  <span className="pill-value">{todayLabel}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="ticker" aria-label="Live city ticker">
            <div className="ticker-label">{tickerLabel}</div>
            <div className="ticker-track">
              <div className="ticker-items">
                <span>{weatherTicker}</span>
              </div>
            </div>
          </section>

          <div className="main-grid">
            <section
              id="events"
              className="section-card"
              aria-labelledby="events-title"
            >
              <div className="section-header">
                <div className="section-title-wrap">
                  <div id="events-title" className="section-title">
                    Today in {city.shortName || city.cityName}
                  </div>
                  <div className="section-sub">
                    No plans yet? Start with these.
                  </div>
                </div>
                <a className="section-link" href="#events">
                  Open full calendar →
                </a>
              </div>

              <div className="list">
                <div className="group-label">Tonight’s picks</div>

                {!anyEvents && (
                  <p className="empty-copy">
                    No events found yet — check back later or explore neighborhoods
                    below.
                  </p>
                )}

                {hasTonight && (
                  <>
                    {tonightEvents.map((evt) => {
                      const tagLabel = buildTagLabel(evt);
                      const featured = evt.id === featuredEventId;

                      return (
                        <a
                          key={evt.id}
                          className={
                            "event-row" + (featured ? " featured" : "")
                          }
                          href={evt.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="event-meta">
                            {featured && (
                              <span className="badge-featured">Featured</span>
                            )}
                            {tagLabel && <span className="tag">{tagLabel}</span>}
                          </div>
                          <div className="title-sm">{evt.name}</div>
                          <div className="meta-sm">{formatEventMeta(evt)}</div>
                          <span className="cta-sm">Details &amp; tickets →</span>
                        </a>
                      );
                    })}
                  </>
                )}

                {hasLater && (
                  <>
                    <div className="group-label">Later this week</div>
                    {laterThisWeekEvents.map((evt) => {
                      const tagLabel = buildTagLabel(evt);
                      const featured = evt.id === featuredEventId;

                      return (
                        <a
                          key={evt.id}
                          className={
                            "event-row" + (featured ? " featured" : "")
                          }
                          href={evt.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="event-meta">
                            {featured && (
                              <span className="badge-featured">Featured</span>
                            )}
                            {tagLabel && <span className="tag">{tagLabel}</span>}
                          </div>
                          <div className="title-sm">{evt.name}</div>
                          <div className="meta-sm">{formatEventMeta(evt)}</div>
                          <span className="cta-sm">Details &amp; tickets →</span>
                        </a>
                      );
                    })}

                    {laterHasMore && (
                      <a className="section-link" href="#events">
                        View more events →
                      </a>
                    )}
                  </>
                )}
              </div>
            </section>

            <section
              id="services"
              className="section-card"
              aria-labelledby="services-title"
            >
              <div className="section-header">
                <div className="section-title-wrap">
                  <div id="services-title" className="section-title">
                    Trusted local pros
                  </div>
                  <div className="section-sub">
                    People you&apos;ll actually want to call when something breaks.
                  </div>
                </div>
              </div>

              <div className="list">
                {city.localPros.map((pro) => (
                  <div key={pro.name} className="service-row">
                    <div className="service-main">
                      <div className="title-sm">{pro.name}</div>
                      <div className="meta-sm">{pro.category}</div>
                      <p className="service-desc">{pro.description}</p>
                    </div>
                    <div className="service-cta">
                      <a
                        className="btn-outline"
                        href={pro.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {pro.ctaLabel}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              id="neighborhoods"
              className="section-card"
              aria-labelledby="neighborhoods-title"
            >
              <div className="section-header">
                <div className="section-title-wrap">
                  <div id="neighborhoods-title" className="section-title">
                    Neighborhoods to know
                  </div>
                  <div className="section-sub">
                    Quick feel for where things are around town.
                  </div>
                </div>
              </div>

              <div className="pill-grid">
                {city.neighborhoods.map((n) => (
                  <a
                    key={n.name}
                    className="pill-card"
                    href={n.url || "#"}
                    target={n.url ? "_blank" : undefined}
                    rel={n.url ? "noopener noreferrer" : undefined}
                  >
                    <div className="pill-title">{n.name}</div>
                    <div className="pill-sub">{n.description}</div>
                  </a>
                ))}
              </div>
            </section>
          </div>

          <footer>
            <span>
              © <span>{year}</span> {city.domain} · Independent local guide for{" "}
              {city.cityName}.
            </span>
            <span>
              Partner, sponsor, or list your business:{" "}
              <a href="mailto:youremail@example.com">youremail@example.com</a>
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default CityPage;
