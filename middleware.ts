import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCityConfigByDomain, getDefaultCitySlug } from "./config/cities";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";

  if (url.pathname !== "/") {
    return NextResponse.next();
  }

  const city = getCityConfigByDomain(host);
  const slug = city?.slug || getDefaultCitySlug();

  url.pathname = `/${slug}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/"]
};
