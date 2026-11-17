import type { Metadata } from "next";
import NavSightAccess from "./NavSightAccess";

const shareTitle = "NavSight — Navigation assistance for SMMM";
const shareDescription = "Live charts, route planning and motion prediction for the SMMM ship-manoeuvring simulator. By Echlon.";

export const metadata: Metadata = {
  title: "NavSight · SMMM navigation assistance · Echlon",
  description: "NavSight for SMMM: live charts, route editing, wheel-over guidance, motion prediction and simulator position/heading assistance. English and Polish. Lifetime license for Windows.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  alternates: { canonical: "/navsight" },
  openGraph: {
    type: "website",
    url: "/navsight",
    siteName: "Echlon",
    title: shareTitle,
    description: shareDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: [{ url: "/navsight/opengraph-image", alt: "NavSight by Echlon — Navigation assistance for SMMM" }],
  },
};

export default function NavSightPage() {
  return <NavSightAccess />;
}
