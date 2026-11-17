import { ImageResponse } from "next/og";

export const alt = "NavSight by Echlon — Navigation assistance for SMMM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function SocialPreview() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#06080a", color: "#d9d2bf", padding: "52px 64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 20, letterSpacing: "5px" }}>
        <span>ECHLON</span>
        <span style={{ color: "#8e8b80", fontSize: 16, letterSpacing: "3px" }}>SMMM / WINDOWS</span>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 650 }}>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 108, fontWeight: 700, letterSpacing: "-6px", lineHeight: 1.1 }}>
            <span>NavSight</span><span style={{ color: "#777465" }}>_</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 28, fontSize: 30, lineHeight: 1.45, color: "#a6a294" }}>
            <span>Navigation assistance</span>
            <span>for the SMMM simulator.</span>
          </div>
        </div>
        <svg width="350" height="350" viewBox="0 0 350 350" fill="none" aria-hidden="true">
          <circle cx="175" cy="175" r="150" stroke="#34362f" strokeWidth="1"/>
          <circle cx="175" cy="175" r="105" stroke="#242820" strokeWidth="1"/>
          <circle cx="175" cy="175" r="60" stroke="#242820" strokeWidth="1"/>
          <path d="M175 13V47M175 303V337M13 175H47M303 175H337" stroke="#8e8b80" strokeWidth="2"/>
          <path d="M175 53V297M53 175H297" stroke="#242820" strokeWidth="1" strokeDasharray="3 9"/>
          <path d="M71 263L142 226Q166 212 178 184L211 108L278 72" stroke="#d9d2bf" strokeWidth="3"/>
          <circle cx="71" cy="263" r="6" fill="#06080a" stroke="#d9d2bf" strokeWidth="2"/>
          <circle cx="211" cy="108" r="6" fill="#06080a" stroke="#d9d2bf" strokeWidth="2"/>
          <circle cx="278" cy="72" r="6" fill="#d9d2bf"/>
          <path d="M174 157L182 188L169 198L159 183Z" fill="#d9d2bf" stroke="#06080a" strokeWidth="3"/>
        </svg>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #33352f", paddingTop: 25, fontSize: 15, letterSpacing: "1px", color: "#aaa697" }}>
        <span>LIVE CHARTS · ROUTE PLANNING · MOTION PREDICTION</span>
        <span style={{ color: "#d9d2bf" }}>echlon.dev/navsight</span>
      </div>
    </div>,
    size,
  );
}
