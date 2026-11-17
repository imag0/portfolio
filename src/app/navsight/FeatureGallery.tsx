"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { copy, type Language } from "./copy";
import styles from "./FeatureGallery.module.css";

type Shot = { file: string; en: string; pl: string };
const screenshots: readonly (readonly Shot[])[] = [
  [
    { file: "NavSight_1_NightMode.png", en: "Night mode", pl: "Tryb nocny" },
    { file: "NavSight_1_LightMode.png", en: "Day mode", pl: "Tryb dzienny" },
  ],
  [{ file: "NavSight_2_RoutePlanning.png", en: "Waypoints & wheel-over points", pl: "Punkty trasy i rozpoczęcia zwrotu" }],
  [
    { file: "NavSight_3_Pred2.png", en: "During a turn", pl: "Podczas zwrotu" },
    { file: "NavSight_3_Prediction.png", en: "Predicted track", pl: "Przewidywany tor ruchu" },
  ],
  [{ file: "NavSight_Assistance.webp", en: "Position & heading controls", pl: "Sterowanie pozycją i kursem" }],
  [
    { file: "NavSight_Keybinds1.png", en: "Keyboard", pl: "Klawiatura" },
    { file: "NavSight_Keybinds2.png", en: "Chart & compass", pl: "Mapa i kompas" },
    { file: "NavSight_Keybinds3.png", en: "Map Builder", pl: "Kreator map" },
  ],
  [
    { file: "NavSight_6_MapBuilder.png", en: "Select an area", pl: "Wybierz obszar" },
    { file: "NavSight_6_NavSightView.png", en: "In NavSight", pl: "W NavSight" },
    { file: "NavSight_6_SimView.png", en: "In SMMM", pl: "W SMMM" },
  ],
];
const imagePath = (shot: Shot) => `/images/navsight/${shot.file}`;
const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8c0a8]";

type Selection = { feature: number; frame: number };
const pad = (value: number) => String(value).padStart(2, "0");

function RevealWords({ text }: { text: string }) {
  return <>{text.split(" ").map((word, index) => <span key={index} className={styles.word}>
    <span style={{ "--word": index } as CSSProperties}>{word}&nbsp;</span>
  </span>)}</>;
}

export default function FeatureGallery({ lang }: { lang: Language }) {
  const t = copy[lang];
  const [selection, setSelection] = useState<Selection>({ feature: 0, frame: 0 });
  const [outgoing, setOutgoing] = useState<Selection | null>(null);
  const [direction, setDirection] = useState(1);
  const [frameDirection, setFrameDirection] = useState(1);
  const [autoRequested, setAutoRequested] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState<{ feature: number; shot: Shot } | null>(null);
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const reduceMotion = useReducedMotion();
  const auto = autoRequested && reduceMotion === false;
  const paused = hovered || focused || hidden || !visible || expanded !== null;
  const { feature, frame } = selection;
  const enlarge = lang === "pl" ? "Powiększ zrzut" : "Enlarge screenshot";
  const close = lang === "pl" ? "Zamknij" : "Close";

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    if (root.current) observer.observe(root.current);
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  function go(target: number, nextDirection: number, manual = true) {
    if (manual) setAutoRequested(false);
    const next = (target + screenshots.length) % screenshots.length;
    if (next === feature) return;
    setDirection(nextDirection);
    setOutgoing(selection);
    setSelection({ feature: next, frame: 0 });
  }

  function open(shot: Shot) {
    if (swiped.current) { swiped.current = false; return; }
    setAutoRequested(false);
    setExpanded({ feature, shot });
    dialog.current?.showModal();
  }

  return <section ref={root} aria-labelledby="navsight-features" aria-roledescription={lang === "pl" ? "karuzela" : "carousel"}
    onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
    onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={event => {
      if (dialog.current?.open) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault(); const delta = event.key === "ArrowRight" ? 1 : -1; go(feature + delta, delta);
      }
    }} className={`${styles.gallery} border-t border-[#c8c0a833] py-10 sm:py-14`}>
    <header className={styles.header}>
      <h2 id="navsight-features" className="text-xl tracking-tight sm:text-2xl">{t.abilities}</h2>
      <div className={styles.controls}>
        <button type="button" aria-pressed={auto} aria-label={lang === "pl" ? "Automatyczne odtwarzanie" : "Automatic playback"}
          disabled={!!reduceMotion} onClick={() => setAutoRequested(!auto)}>
          auto: {lang === "pl" ? (auto ? "wł." : "wył.") : (auto ? "on" : "off")}
        </button>
        <span className={styles.count}>{pad(feature + 1)} / {pad(screenshots.length)}</span>
        <button type="button" aria-label={lang === "pl" ? "Poprzednia funkcja" : "Previous feature"} onClick={() => go(feature - 1, -1)}><ArrowLeft size={16}/></button>
        <button type="button" aria-label={lang === "pl" ? "Następna funkcja" : "Next feature"} onClick={() => go(feature + 1, 1)}><ArrowRight size={16}/></button>
      </div>
    </header>
    <div className={styles.stage} data-direction={direction > 0 ? "next" : "prev"}
      onTouchStart={event => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; swiped.current = false; }}
      onTouchCancel={() => { touchStart.current = null; }}
      onTouchEnd={event => {
        if (touchStart.current) {
          const dx = event.changedTouches[0].clientX - touchStart.current.x;
          const dy = event.changedTouches[0].clientY - touchStart.current.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; go(feature + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }
        }
        touchStart.current = null;
      }}>
      {screenshots.map((shots, i) => {
        const current = feature === i;
        const leaving = !current && outgoing?.feature === i;
        const shotIndex = current ? frame : leaving ? outgoing.frame : 0;
        const shot = shots[shotIndex];
        const [title, description] = t.features[i];
        return <article key={i} aria-hidden={!current} inert={!current} aria-roledescription={lang === "pl" ? "slajd" : "slide"}
          aria-label={`${pad(i + 1)} / ${pad(screenshots.length)}: ${title}`}
          className={`${styles.slide} ${current ? styles.current : leaving ? styles.outgoing : ""}`}>
          <div className={styles.copy}>
            <span className={styles.number}>{pad(i + 1)}</span>
            <h3><RevealWords text={title}/></h3>
            <p><RevealWords text={description}/></p>
            {shots.length > 1 && <div className={styles.tabs} role="group" aria-label={lang === "pl" ? "Widoki funkcji" : "Feature views"}>
              {shots.map((item, j) => <button key={item.file} type="button" aria-pressed={shotIndex === j}
                onClick={() => { setAutoRequested(false); setFrameDirection(j > frame ? 1 : -1); setSelection({ feature: i, frame: j }); }}>{item[lang]}</button>)}
            </div>}
          </div>
          <figure className={styles.figure}>
            <button type="button" className={styles.shot} onClick={() => open(shot)} aria-label={`${enlarge}: ${title} — ${shot[lang]}`}
              onPointerMove={event => {
                if (event.pointerType !== "mouse" || reduceMotion) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty("--mx", `${((event.clientX - bounds.left) / bounds.width - 0.5) * -14}px`);
                event.currentTarget.style.setProperty("--my", `${((event.clientY - bounds.top) / bounds.height - 0.5) * -9}px`);
              }}
              onPointerLeave={event => { event.currentTarget.style.setProperty("--mx", "0px"); event.currentTarget.style.setProperty("--my", "0px"); }}>
              <span className={styles.parallax}>
                <AnimatePresence initial={false}>
                  <motion.span key={shot.file} className={styles.image}
                    initial={{ clipPath: frameDirection > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", scale: 1.08, zIndex: 2 }}
                    animate={{ clipPath: "inset(0 0 0 0)", scale: 1, zIndex: 2 }} exit={{ zIndex: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.85, ease: [0.76, 0, 0.24, 1] }}>
                    <Image src={imagePath(shot)} alt={`${title} — ${shot[lang]}`} fill unoptimized sizes="(max-width: 820px) 100vw, 760px" draggable={false} className="object-contain"/>
                  </motion.span>
                </AnimatePresence>
              </span>
            </button>
            <figcaption><span>fig. {pad(i + 1)}{shots.length > 1 ? "abc"[shotIndex] : ""}: {shot[lang]}</span><span>{lang === "pl" ? "kliknij, aby powiększyć" : "click to enlarge"}</span></figcaption>
          </figure>
        </article>;
      })}
    </div>
    <nav className={styles.rail} aria-label={lang === "pl" ? "Wybierz funkcję" : "Explore features"}>
      {t.features.map(([title], i) => <button type="button" key={i} aria-label={`${pad(i + 1)} ${title}`} aria-pressed={feature === i}
        onClick={() => go(i, i > feature ? 1 : -1)}>
        <span>{pad(i + 1)}</span><span className={styles.railTitle}>{title}</span>
        {feature === i && <span key={`${i}-${auto}`} aria-hidden="true" className={`${styles.progress} ${auto ? styles.playing : ""}`}
          style={{ animationPlayState: paused ? "paused" : "running" }}
          onAnimationEnd={() => { if (auto && !paused) go(feature + 1, 1, false); }}/>}
      </button>)}
    </nav>
    <span className="sr-only" aria-live={auto ? "off" : "polite"} aria-atomic="true">{pad(feature + 1)} / {pad(screenshots.length)}: {t.features[feature][0]} — {screenshots[feature][frame][lang]}</span>
    <p className="mt-8 text-[10px] leading-6 text-[#c8c0a877]">{t.compatibility}</p>
    <dialog ref={dialog} aria-labelledby="navsight-capture-title" onClose={() => setExpanded(null)}
      className="fixed inset-0 m-auto max-h-[94dvh] w-[96vw] max-w-[1600px] overflow-auto border border-[#c8c0a844] bg-[#06080a] p-0 text-[#c8c0a8] backdrop:bg-black/90">
      {expanded && <>
        <div className="flex items-center justify-between gap-4 border-b border-[#c8c0a833] px-4 py-3 sm:px-6">
          <h3 id="navsight-capture-title" className="text-xs leading-6">0{expanded.feature + 1} / {t.features[expanded.feature][0]} — {expanded.shot[lang]}</h3>
          <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label={close}
            className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center border border-[#c8c0a833] hover:bg-[#c8c0a811] ${focus}`}><X size={18}/></button>
        </div>
        <div className="relative h-[72dvh]">
          <Image src={imagePath(expanded.shot)} alt={`${t.features[expanded.feature][0]} — ${expanded.shot[lang]}`} fill unoptimized sizes="96vw" className="object-contain"/>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#c8c0a833] px-4 py-3 text-[10px] text-[#c8c0a888] sm:px-6">
          <span>{lang === "pl" ? "ESC / zamknij podgląd" : "ESC / close preview"}</span>
          <a href={imagePath(expanded.shot)} target="_blank" rel="noopener noreferrer" className={`py-2 underline underline-offset-4 ${focus}`}>{lang === "pl" ? "Otwórz oryginalny obraz ↗" : "Open original image ↗"}</a>
        </div>
      </>}
    </dialog>
  </section>;
}
