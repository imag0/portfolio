import type { Metadata } from "next";
import NavSightAccess from "./NavSightAccess";

export const metadata: Metadata = {
  title: "NavSight · SMMM navigation assistance · Echlon",
  description: "NavSight for SMMM: live charts, route editing, wheel-over guidance, motion prediction and simulator position/heading assistance. English and Polish. Lifetime license for Windows.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function NavSightPage() {
  return <NavSightAccess />;
}
