export interface NeighborhoodConfig {
  name: string;
  description: string;
  url?: string;
}

export interface LocalProConfig {
  name: string;
  category: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface CityConfig {
  slug: string;
  domain: string;
  cityName: string;
  shortName?: string;
  stateCode: string;
  heroTagline: string;
  heroImageUrl: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  neighborhoods: NeighborhoodConfig[];
  localPros: LocalProConfig[];
  brandInitials?: string;
  tickerLabel?: string;
}

export const cities: CityConfig[] = [
  {
    slug: "saltlake",
    domain: "saltlakeut.com",
    cityName: "Salt Lake City",
    shortName: "Salt Lake",
    stateCode: "UT",
    heroTagline:
      "See what’s happening tonight & who to call when you need help.",
    heroImageUrl:
      "https://images.pexels.com/photos/3586966/pexels-photo-3586966.jpeg?auto=compress&cs=tinysrgb&w=1600",
    coordinates: {
      lat: 40.7608,
      lon: -111.891
    },
    brandInitials: "SL",
    tickerLabel: "Live city ticker — Salt Lake City, Utah",
    neighborhoods: [
      {
        name: "Downtown",
        description: "Arena, nightlife, office towers.",
        url: "/neighborhoods#downtown"
      },
      {
        name: "Sugar House",
        description: "Parks, coffee, older homes.",
        url: "/neighborhoods#sugar-house"
      },
      {
        name: "9th & 9th",
        description: "Restaurants, boutiques, walkable.",
        url: "/neighborhoods#ninth-and-ninth"
      },
      {
        name: "The Avenues",
        description: "Historic homes, hills, views.",
        url: "/neighborhoods#avenues"
      }
    ],
    localPros: [
      {
        name: "Wasatch Roofing & Exteriors",
        category: "Roofing",
        description:
          "Salt Lake City & valley · Free inspections · Storm damage & leaks",
        ctaLabel: "Visit website →",
        ctaUrl: "#"
      },
      {
        name: "Salt Lake HVAC Pros",
        category: "Heating & cooling",
        description:
          "24/7 emergency service · Residential & light commercial",
        ctaLabel: "Book a service call →",
        ctaUrl: "#"
      },
      {
        name: "Downtown Realty Group",
        category: "Real estate",
        description:
          "Condos, townhomes, investment properties across Salt Lake County",
        ctaLabel: "See listings →",
        ctaUrl: "#"
      },
      {
        name: "Mountain View Landscaping",
        category: "Landscaping & snow removal",
        description:
          "Year-round maintenance · Residential & HOAs",
        ctaLabel: "Request a quote →",
        ctaUrl: "#"
      }
    ]
  }
];

export function getCityConfigBySlug(slug: string): CityConfig | undefined {
  const clean = slug.toLowerCase();
  return cities.find((c) => c.slug.toLowerCase() === clean);
}

export function getCityConfigByDomain(host: string): CityConfig | undefined {
  const cleanHost = host.toLowerCase().split(":")[0];
  return cities.find((c) => c.domain.toLowerCase() === cleanHost);
}

export function getDefaultCitySlug(): string {
  return process.env.DEFAULT_CITY_SLUG || "saltlake";
}
