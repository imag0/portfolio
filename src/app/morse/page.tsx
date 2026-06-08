import type { Metadata } from "next";
import { MorseClient } from "./MorseClient";

export const metadata: Metadata = {
  title: "MorseChat | Echlon",
  description: "A browser-native Morse code chat and callsign training station.",
};

export default function MorsePage() {
  return <MorseClient />;
}
