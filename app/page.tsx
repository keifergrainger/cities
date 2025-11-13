import { redirect } from "next/navigation";
import { getDefaultCitySlug } from "../config/cities";

export default function RootPage() {
  const slug = getDefaultCitySlug();
  redirect(`/${slug}`);
}
