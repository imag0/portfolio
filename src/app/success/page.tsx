import NavSightAccess from "../navsight/NavSightAccess";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Your NavSight purchase · Echlon", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function SuccessPage() { return <NavSightAccess />; }
