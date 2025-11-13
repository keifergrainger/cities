import React from "react";
import type { CityConfig } from "../config/cities";
import type { CityEvent } from "../lib/events";
import type { CityWeather } from "../lib/weather";
import {
  buildHeroWeatherLine,
  buildWeatherTickerLine
} from "../lib/weather";

interface CityPageProps {
  city: CityConfig;
  tonightEvents: CityEvent[];
  laterThisWeekEvents: CityEvent[];
  weather: CityWeather | null;
}

function formatEventMeta(evt: CityEvent): string {
  const dt = new Date(evt.startDateTime);
  if (!Number.isNaN(dt.getTime())) {
    const datePart = dt.toLocaleDateString("en-US", {
      weekday: "short",
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
  }

  const pieces: string[] = [];
  if (evt.venueName) pieces.push(evt.venueName);
  if (evt.address) pieces.push(evt.address);
  return pieces.join(" · ") || "Details coming soon";
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
  weather
}: CityPageProps) {
  const now = new Date();
  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
  const year = now.getFullYear();

  const tickerLabel =
    city.tickerLabel || `Live city ticker — ${city.cityName}, ${city.stateCode}`;

  const weatherTickerLine = buildWeatherTickerLine(city, weather);
  const heroWeatherLine = buildHeroWeatherLine(city, weather);

  const hasTonight = tonightEvents.length > 0;
  const hasLater = laterThisWeekEvents.length > 0;
  const anyEvents = hasTonight || hasLater;

  const featuredEventId = hasTonight
    ? tonightEvents[0]?.id
    : laterThisWeekEvents[0]?.id;

  const brandInitials =
    city.brandInitials ||
    city.cityName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="page-shell">
      <header>
        <div className="top-ticker">
          <div className="ticker-label">{tickerLabel}</div>
          <div className="ticker">
            <div className="ticker-inner">
              <span>{weatherTickerLine}</span>
              <span>
                Tonight: Live events across {city.shortName || city.cityName} · see picks below
              </span>
              <span>
                Weekend: Check markets, games &amp; shows · scroll to “Later this week”
              </span>
              <span>
                Local: Trusted pros for home &amp; business · see “Need a local pro?”
              </span>
              <span>
                Traffic: Main corridors often busy near downtown during events
              </span>
            </div>
          </div>
        </div>

        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">
              <span>{brandInitials}</span>
            </div>
            <div className="brand-text">
              <h1>{city.domain}</h1>
              <p>{city.heroTagline}</p>
            </div>
          </div>

          <div className="top-buttons">
            <a className="btn-primary" href="#events">
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
          <div className="hero-row">
            <div className="hero-main">
              <div className="hero-tag">
                <div className="hero-dot"></div>
                <span>
                  Today in {city.cityName} · <span>{todayLabel}</span>
                </span>
              </div>

              <h2 id="hero-heading">
                Hey {city.shortName || city.cityName} — here’s what’s happening tonight.
              </h2>
              <p>
                Scroll once to see today’s top events, trusted local pros, and neighborhoods worth
                exploring.
              </p>
              <p className="hero-trust">{heroWeatherLine}</p>

              <div className="hero-actions">
                <a className="btn-primary" href="#events">
                  See today’s events
                </a>
                <a className="btn-ghost" href="#services">
                  Browse local services
                </a>
              </div>
            </div>

            <div className="hero-side">
              <div className="hero-side-links">
                <a className="hero-link" href="#events">
                  Tonight &amp; this week ↓
                </a>
                <a className="hero-link" href="#services">
                  Local pros ↓
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="main-grid">
          <section id="events" className="section-card" aria-labelledby="events-title">
            <div className="section-header">
              <div className="section-title-wrap">
                <div id="events-title" className="section-title">
                  Today in {city.shortName || city.cityName}
                </div>
                <div className="section-sub">No plans yet? Start with these.</div>
              </div>
              <a className="section-link" href="#events">
                Open full calendar →
              </a>
            </div>

            <div className="list">
              <div className="group-label">Tonight’s picks</div>

              {!anyEvents && (
                <p className="empty-copy">
                  No events found yet — check back later or explore neighborhoods below.
                </p>
              )}

              {hasTonight &&
                tonightEvents.map((evt) => {
                  const tagLabel = buildTagLabel(evt);
                  const featured = evt.id === featuredEventId;

                  return (
                    <a
                      key={evt.id}
                      className={"event-row" + (featured ? " featured" : "")}
                      href={evt.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="event-meta">
                        {featured && <span className="badge-featured">Featured</span>}
                        {tagLabel && <span className="tag">{tagLabel}</span>}
                      </div>
                      <div className="title-sm">{evt.name}</div>
                      <div className="meta-sm">{formatEventMeta(evt)}</div>
                      <span className="cta-sm">Details &amp; tickets →</span>
                    </a>
                  );
                })}

              {hasLater && (
                <>
                  <div className="group-label">Later this week</div>
                  {laterThisWeekEvents.map((evt) => {
                    const tagLabel = buildTagLabel(evt);
                    const featured = evt.id === featuredEventId;

                    return (
                      <a
                        key={evt.id}
                        className={"event-row" + (featured ? " featured" : "")}
                        href={evt.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="event-meta">
                          {featured && <span className="badge-featured">Featured</span>}
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
            </div>
          </section>

          <section id="services" className="section-card" aria-labelledby="services-title">
            <div className="section-header">
              <div className="section-title-wrap">
                <div id="services-title" className="section-title">
                  Need a local pro?
                </div>
                <div className="section-sub">
                  Roofers, HVAC, real estate &amp; more — vetted local picks.
                </div>
              </div>
              <a className="section-link" href="#services">
                List your business →
              </a>
            </div>

            <div className="list">
              {city.localPros.length === 0 && (
                <p className="empty-copy">
                  No local pros listed yet. Want to be the first? Use “List your business” above.
                </p>
              )}

              {city.localPros.map((pro) => (
                <a
                  key={pro.name}
                  className="biz-row"
                  href={pro.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="title-sm">{pro.name}</div>
                  <div className="meta-sm">
                    {pro.category} · {pro.description}
                  </div>
                  <span className="cta-sm">{pro.ctaLabel}</span>
                </a>
              ))}
            </div>
          </section>
        </div>

        <section
          className="strip-block"
          id="neighborhoods"
          aria-labelledby="neighborhoods-title"
        >
          <div id="neighborhoods-title" className="strip-title">
            Neighborhoods at a glance
          </div>
          <div className="strip-sub">New here? Tap a neighborhood to see its vibe.</div>
          <div className="strip">
            {city.neighborhoods.length === 0 && (
              <p className="empty-copy">
                We’re still adding neighborhood guides. Check back soon.
              </p>
            )}

            {city.neighborhoods.map((hood) => (
              <a key={hood.name} className="strip-pill" href={hood.url || "#"}>
                <b>{hood.name}</b> {hood.description}
              </a>
            ))}
          </div>
        </section>

        <footer>
          <span>
            © <span>{year}</span> {city.domain} · Independent local guide for {city.cityName}.
          </span>
          <span>
            Partner, sponsor, or list your business:{" "}
            <a href="mailto:youremail@example.com">youremail@example.com</a>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default CityPage;
