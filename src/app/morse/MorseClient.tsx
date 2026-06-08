"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Ear,
  Eye,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  Trash2,
  Volume2,
  Zap,
} from "lucide-react";

type Tab = "chat" | "light" | "sound";

type Message = {
  id: number;
  callsign: string;
  morse: string;
  translation: string;
  cpm: number;
  time: string;
};

const MORSE_RELAY_URL = (process.env.NEXT_PUBLIC_MORSE_RELAY_URL || "/api/morse").replace(/\/$/, "");

const MORSE_TO_LATIN: Record<string, string> = {
  ".-": "A",
  "-...": "B",
  "-.-.": "C",
  "-..": "D",
  ".": "E",
  "..-.": "F",
  "--.": "G",
  "....": "H",
  "..": "I",
  ".---": "J",
  "-.-": "K",
  ".-..": "L",
  "--": "M",
  "-.": "N",
  "---": "O",
  ".--.": "P",
  "--.-": "Q",
  ".-.": "R",
  "...": "S",
  "-": "T",
  "..-": "U",
  "...-": "V",
  ".--": "W",
  "-..-": "X",
  "-.--": "Y",
  "--..": "Z",
  ".----": "1",
  "..---": "2",
  "...--": "3",
  "....-": "4",
  ".....": "5",
  "-....": "6",
  "--...": "7",
  "---..": "8",
  "----.": "9",
  "-----": "0",
  ".-.-.-": ".",
  "--..--": ",",
  "..--..": "?",
  "-.-.--": "!",
  "-....-": "-",
  "-..-.": "/",
  ".-.-.": "+",
  ".--.-.": "@",
};

const LATIN_TO_MORSE = Object.entries(MORSE_TO_LATIN).reduce<Record<string, string>>(
  (map, [morse, latin]) => {
    map[latin] = morse;
    return map;
  },
  {},
);

function generateCallsign() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("") +
    Math.floor(Math.random() * 10);
}

function generateTrainingText() {
  return `VVV ${Array.from({ length: 6 }, generateCallsign).join(" ")} +`;
}

function normalizeMorse(value: string) {
  return value.replace(/\s*\|\s*/g, " | ").replace(/\s+/g, " ").replace(/^\s*\|\s*/, "").replace(/\s*\|\s*$/, "").trim();
}

function translateMorse(value: string) {
  return normalizeMorse(value)
    .split(" | ")
    .map((word) =>
      word
        .trim()
        .split(" ")
        .map((letter) => MORSE_TO_LATIN[letter] ?? "")
        .join(""),
    )
    .join(" ");
}

function textToMorse(value: string) {
  return value
    .toUpperCase()
    .split("")
    .map((char) => (char === " " ? "|" : LATIN_TO_MORSE[char] ?? ""))
    .filter(Boolean)
    .join(" ");
}

function calculateCpm(morse: string, elapsedMs: number) {
  const units = morse.split("").reduce((sum, char) => sum + (char === "-" ? 3 : char === "." ? 1 : 0), 0);
  if (!units || !elapsedMs) return 0;
  return Math.round(((units / 50) * (60000 / elapsedMs)) * 100) / 100;
}

function formatMorse(value: string) {
  return normalizeMorse(value).replace(/ /g, "   ").replace(/\|/g, " / ");
}

export function MorseClient() {
  const [tab, setTab] = useState<Tab>("chat");
  const [callsign] = useState(generateCallsign);
  const [morse, setMorse] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [relayStatus, setRelayStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [showTranslations, setShowTranslations] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [threshold, setThreshold] = useState(180);
  const [letterPause, setLetterPause] = useState(420);
  const [cpm, setCpm] = useState(80);
  const [volume, setVolume] = useState(0.35);
  const [trainingText, setTrainingText] = useState(generateTrainingText);
  const [trainingInput, setTrainingInput] = useState("");
  const [isKeyDown, setIsKeyDown] = useState(false);
  const [isSignalOn, setIsSignalOn] = useState(false);
  const [isPlayingTraining, setIsPlayingTraining] = useState(false);
  const pressStartedAt = useRef(0);
  const inputStartedAt = useRef(0);
  const letterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trainingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const translated = useMemo(() => translateMorse(morse), [morse]);
  const encodedTraining = useMemo(() => textToMorse(trainingText), [trainingText]);
  const unitMs = useMemo(() => Math.max(28, Math.round(6000 / cpm)), [cpm]);

  const clearTimers = useCallback(() => {
    if (letterTimer.current) clearTimeout(letterTimer.current);
    if (wordTimer.current) clearTimeout(wordTimer.current);
  }, []);

  const appendSymbol = useCallback(
    (symbol: "." | "-") => {
      clearTimers();
      if (!inputStartedAt.current) inputStartedAt.current = Date.now();
      setMorse((current) => `${current}${symbol}`);
      letterTimer.current = setTimeout(() => setMorse((current) => `${current} `), letterPause);
      wordTimer.current = setTimeout(() => setMorse((current) => `${current.trimEnd()} | `), letterPause * 4);
    },
    [clearTimers, letterPause],
  );

  const playMorse = useCallback(
    (value: string) => {
      if (!soundEnabled || typeof window === "undefined") return;
      const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
      const AudioContextClass = window.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 620;
      oscillator.type = "sine";
      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(context.destination);

      let cursor = context.currentTime + 0.02;
      normalizeMorse(value)
        .split("")
        .forEach((char) => {
          if (char === "." || char === "-") {
            const duration = ((char === "." ? unitMs : unitMs * 3) / 1000);
            gain.gain.setValueAtTime(volume, cursor);
            cursor += duration;
            gain.gain.setValueAtTime(0, cursor);
            cursor += unitMs / 1000;
          } else if (char === " ") {
            cursor += (unitMs * 2) / 1000;
          } else if (char === "|") {
            cursor += (unitMs * 5) / 1000;
          }
        });

      oscillator.start(context.currentTime);
      oscillator.stop(cursor + 0.05);
      setTimeout(() => void context.close(), Math.max(100, (cursor - context.currentTime + 0.1) * 1000));
    },
    [soundEnabled, unitMs, volume],
  );

  const sendMessage = useCallback(async () => {
    const clean = normalizeMorse(morse);
    if (!/[.-]/.test(clean)) return;
    clearTimers();
    const elapsed = inputStartedAt.current ? Date.now() - inputStartedAt.current : 0;
    const nextMessage: Message = {
      id: Date.now(),
      callsign,
      morse: clean,
      translation: translateMorse(clean) || "...",
      cpm: calculateCpm(clean, elapsed),
      time: new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()),
    };
    try {
      const response = await fetch(`${MORSE_RELAY_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callsign: nextMessage.callsign,
          morse: nextMessage.morse,
          translation: nextMessage.translation,
          cpm: nextMessage.cpm,
        }),
      });
      if (!response.ok) throw new Error(`Relay returned ${response.status}`);
      const payload = await response.json() as { message?: Message };
      setMessages((current) => [...current, payload.message ?? nextMessage].sort((a, b) => a.id - b.id).slice(-80));
      setRelayStatus("online");
    } catch {
      setMessages((current) => [...current, nextMessage].slice(-80));
      setRelayStatus("offline");
    }
    playMorse(clean);
    setMorse("");
    inputStartedAt.current = 0;
  }, [callsign, clearTimers, morse, playMorse]);

  const startPress = useCallback(() => {
    pressStartedAt.current = Date.now();
    setIsKeyDown(true);
    setIsSignalOn(true);
  }, []);

  const endPress = useCallback(() => {
    if (!pressStartedAt.current) return;
    const duration = Date.now() - pressStartedAt.current;
    appendSymbol(duration < threshold ? "." : "-");
    pressStartedAt.current = 0;
    setIsKeyDown(false);
    setIsSignalOn(false);
  }, [appendSymbol, threshold]);

  const generateTraining = useCallback(() => {
    setTrainingText(generateTrainingText());
    setTrainingInput("");
  }, []);

  const stopTraining = useCallback(() => {
    trainingTimers.current.forEach(clearTimeout);
    trainingTimers.current = [];
    setIsSignalOn(false);
    setIsPlayingTraining(false);
  }, []);

  const playTraining = useCallback(
    (visualOnly = false) => {
      stopTraining();
      const encoded = encodedTraining || textToMorse(trainingText);
      if (!encoded) return;

      let cursor = 0;
      setIsPlayingTraining(true);
      encoded.split("").forEach((char) => {
        if (char === "." || char === "-") {
          const duration = char === "." ? unitMs : unitMs * 3;
          trainingTimers.current.push(setTimeout(() => setIsSignalOn(true), cursor));
          trainingTimers.current.push(setTimeout(() => setIsSignalOn(false), cursor + duration));
          cursor += duration + unitMs;
        } else if (char === " ") {
          cursor += unitMs * 2;
        } else if (char === "|") {
          cursor += unitMs * 6;
        }
      });

      if (!visualOnly) playMorse(encoded);
      trainingTimers.current.push(setTimeout(() => setIsPlayingTraining(false), cursor + 80));
    },
    [encodedTraining, playMorse, stopTraining, trainingText, unitMs],
  );

  useEffect(() => {
    return () => {
      clearTimers();
      stopTraining();
    };
  }, [clearTimers, stopTraining]);

  useEffect(() => {
    let disposed = false;
    let lastSeen = 0;

    const loadMessages = async () => {
      try {
        const response = await fetch(`${MORSE_RELAY_URL}/messages?after=${lastSeen}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Relay returned ${response.status}`);
        const payload = await response.json() as { messages?: Array<Message & { created_at?: string }> };
        const incoming = (payload.messages ?? []).map((message) => ({
          id: message.id,
          callsign: message.callsign,
          morse: message.morse,
          translation: message.translation || translateMorse(message.morse) || "...",
          cpm: message.cpm,
          time: message.time || (message.created_at ? new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(message.created_at)) : "--:--:--"),
        }));
        if (disposed) return;
        if (incoming.length) {
          lastSeen = Math.max(lastSeen, ...incoming.map((message) => message.id));
          setMessages((current) => {
            const known = new Set(current.map((message) => message.id));
            return [...current, ...incoming.filter((message) => !known.has(message.id))].sort((a, b) => a.id - b.id).slice(-80);
          });
          incoming.forEach((message) => playMorse(message.morse));
        }
        setRelayStatus("online");
      } catch {
        if (!disposed) setRelayStatus("offline");
      }
    };

    void loadMessages();
    const interval = window.setInterval(loadMessages, 1800);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [playMorse]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === "z" || event.key === ".") {
        event.preventDefault();
        appendSymbol(".");
      }
      if (event.key === "x" || event.key === "-") {
        event.preventDefault();
        appendSymbol("-");
      }
      if (event.code === "Space") {
        event.preventDefault();
        startPress();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void sendMessage();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        endPress();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [appendSymbol, endPress, sendMessage, startPress]);

  const score = trainingText
    ? trainingText.replaceAll(" ", "").split("").filter((char, index) => trainingInput.toUpperCase().replaceAll(" ", "")[index] === char).length
    : 0;
  const scoreTotal = trainingText.replaceAll(" ", "").length;

  return (
    <main className="min-h-screen bg-[#050608] text-[#c8c0a8] selection:bg-[#c8c0a8] selection:text-black">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c8c0a8]/15 pb-5">
          <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#c8c0a8]/65 transition hover:text-[#c8c0a8]">
            <ArrowLeft className="h-4 w-4" />
            Echlon
          </Link>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[#c8c0a8]/55">
            <span className={`h-2 w-2 ${relayStatus === "online" ? "bg-[#00c853] shadow-[0_0_16px_#00c853]" : relayStatus === "connecting" ? "bg-[#00F0FF] shadow-[0_0_16px_#00F0FF]" : "bg-[#FF003C] shadow-[0_0_16px_#FF003C]"}`} />
            {relayStatus === "online" ? "VPS relay online" : relayStatus === "connecting" ? "Connecting relay" : "Relay offline"}
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-8 lg:grid-cols-[minmax(0,1.15fr)_390px]">
          <div className="flex min-h-[620px] flex-col rounded-sm border border-[#c8c0a8]/18 bg-[#06080a]/80 shadow-[0_0_60px_rgba(0,240,255,0.06)]">
            <div className="border-b border-[#c8c0a8]/12 p-5 sm:p-6">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 border border-[#00F0FF]/25 bg-[#00F0FF]/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#00F0FF]">
                    <Radio className="h-3.5 w-3.5" />
                    MorseChat
                  </div>
                  <h1 className="text-4xl font-bold uppercase tracking-tight text-[#c8c0a8] sm:text-6xl">Signal_Station</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c8c0a8]/62">
                    Browser-native Morse input, instant decoding, audio playback, and callsign drills rebuilt from the old Flask experiment.
                  </p>
                </div>
                <div className="min-w-[160px] border border-[#c8c0a8]/15 bg-black/25 p-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#c8c0a8]/45">Assigned call</div>
                  <div className="mt-2 text-3xl font-bold text-[#00F0FF]">{callsign}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-sm border border-[#c8c0a8]/12 bg-black/20 p-1">
                {[
                  { id: "chat" as const, label: "Chat", icon: Radio },
                  { id: "light" as const, label: "Lights", icon: Eye },
                  { id: "sound" as const, label: "Sounds", icon: Ear },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`flex h-11 items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] transition ${
                        tab === item.id ? "bg-[#c8c0a8] text-black" : "text-[#c8c0a8]/62 hover:bg-[#c8c0a8]/8 hover:text-[#c8c0a8]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {tab === "chat" && (
              <section className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_310px]">
                <div className="flex min-h-[430px] flex-col border-b border-[#c8c0a8]/12 lg:border-b-0 lg:border-r">
                  <div className="terminal-scroll flex-1 space-y-3 overflow-y-auto p-5">
                    {messages.length === 0 ? (
                      <div className="flex h-full min-h-[260px] items-center justify-center text-center text-sm text-[#c8c0a8]/42">
                        No transmissions yet. Hold the key, tap dots/dashes, then send.
                      </div>
                    ) : (
                      messages.map((message) => (
                        <article key={message.id} className="border border-[#c8c0a8]/12 bg-black/20 p-4">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <span className="font-bold text-[#00F0FF]">{message.callsign}</span>
                            <span className="text-[#c8c0a8]/45">{message.time} | {message.cpm} CPM</span>
                          </div>
                          <p className="break-words text-lg text-[#c8c0a8]">{formatMorse(message.morse)}</p>
                          {showTranslations && <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[#00c853]">{message.translation}</p>}
                        </article>
                      ))
                    )}
                  </div>

                  <div className="border-t border-[#c8c0a8]/12 p-5">
                    <div className="mb-4 min-h-20 border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-4">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#00F0FF]/75">Live buffer</div>
                      <div className="break-words text-2xl text-[#c8c0a8]">{morse ? formatMorse(morse) : "..."}</div>
                      <div className="mt-3 text-sm uppercase tracking-[0.18em] text-[#c8c0a8]/45">{translated || "awaiting decode"}</div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                      <button
                        onPointerDown={startPress}
                        onPointerUp={endPress}
                        onPointerLeave={() => isKeyDown && endPress()}
                        className={`flex h-16 items-center justify-center gap-3 border text-sm font-bold uppercase tracking-[0.2em] transition ${
                          isKeyDown ? "border-[#00F0FF] bg-[#00F0FF] text-black" : "border-[#c8c0a8]/25 bg-black/20 text-[#c8c0a8] hover:border-[#00F0FF]/70"
                        }`}
                      >
                        <Zap className="h-5 w-5" />
                        Hold key
                      </button>
                      <button onClick={() => appendSymbol(".")} className="h-16 border border-[#c8c0a8]/20 px-5 text-2xl hover:border-[#c8c0a8]">.</button>
                      <button onClick={() => appendSymbol("-")} className="h-16 border border-[#c8c0a8]/20 px-5 text-2xl hover:border-[#c8c0a8]">-</button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <button onClick={() => void sendMessage()} className="inline-flex h-11 items-center justify-center gap-2 bg-[#00c853] px-4 text-xs font-bold uppercase tracking-[0.16em] text-black">
                        <Send className="h-4 w-4" />
                        Send
                      </button>
                      <button onClick={() => { clearTimers(); setMorse(""); inputStartedAt.current = 0; }} className="inline-flex h-11 items-center justify-center gap-2 border border-[#FF003C]/40 px-4 text-xs uppercase tracking-[0.16em] text-[#FF003C] hover:bg-[#FF003C]/10">
                        <Trash2 className="h-4 w-4" />
                        Clear
                      </button>
                      <button onClick={() => setShowTranslations((value) => !value)} className="h-11 border border-[#c8c0a8]/20 px-4 text-xs uppercase tracking-[0.16em] text-[#c8c0a8]/70 hover:text-[#c8c0a8]">
                        {showTranslations ? "Hide text" : "Show text"}
                      </button>
                      <button onClick={() => setMessages([])} className="h-11 border border-[#c8c0a8]/20 px-4 text-xs uppercase tracking-[0.16em] text-[#c8c0a8]/70 hover:text-[#c8c0a8]">
                        Flush log
                      </button>
                    </div>
                  </div>
                </div>

                <Controls
                  threshold={threshold}
                  letterPause={letterPause}
                  cpm={cpm}
                  volume={volume}
                  soundEnabled={soundEnabled}
                  setThreshold={setThreshold}
                  setLetterPause={setLetterPause}
                  setCpm={setCpm}
                  setVolume={setVolume}
                  setSoundEnabled={setSoundEnabled}
                />
              </section>
            )}

            {tab !== "chat" && (
              <section className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_310px]">
                <div className="flex flex-col justify-between border-b border-[#c8c0a8]/12 p-5 lg:border-b-0 lg:border-r">
                  <div>
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold uppercase text-[#c8c0a8]">{tab === "light" ? "Light trainer" : "Sound trainer"}</h2>
                        <p className="mt-2 text-sm text-[#c8c0a8]/55">Copy the generated callsigns, then compare your receive accuracy.</p>
                      </div>
                      <div className={`h-20 w-20 border border-[#c8c0a8]/20 ${isSignalOn ? "bg-[#00F0FF] shadow-[0_0_34px_#00F0FF]" : "bg-black/40"}`} />
                    </div>

                    <div className="mb-5 border border-[#c8c0a8]/12 bg-black/25 p-4">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#c8c0a8]/45">Training sequence</div>
                      <div className="break-words text-2xl font-bold tracking-[0.12em] text-[#00F0FF]">{trainingText}</div>
                      <div className="mt-3 break-words text-sm text-[#c8c0a8]/45">{encodedTraining}</div>
                    </div>

                    <textarea
                      value={trainingInput}
                      onChange={(event) => setTrainingInput(event.target.value.toUpperCase())}
                      className="h-36 w-full resize-none border border-[#c8c0a8]/18 bg-[#050608] p-4 text-xl uppercase tracking-[0.18em] text-[#c8c0a8] outline-none transition placeholder:text-[#c8c0a8]/25 focus:border-[#00F0FF]/70"
                      placeholder="TYPE RECEIVED CALLSIGNS"
                    />

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <button onClick={() => playTraining(tab === "light")} className="inline-flex h-11 items-center justify-center gap-2 bg-[#c8c0a8] px-4 text-xs font-bold uppercase tracking-[0.16em] text-black">
                        <Play className="h-4 w-4" />
                        Play
                      </button>
                      <button onClick={stopTraining} disabled={!isPlayingTraining} className="inline-flex h-11 items-center justify-center gap-2 border border-[#c8c0a8]/20 px-4 text-xs uppercase tracking-[0.16em] text-[#c8c0a8]/70 disabled:opacity-35">
                        <Pause className="h-4 w-4" />
                        Stop
                      </button>
                      <button onClick={generateTraining} className="inline-flex h-11 items-center justify-center gap-2 border border-[#c8c0a8]/20 px-4 text-xs uppercase tracking-[0.16em] text-[#c8c0a8]/70 hover:text-[#c8c0a8]">
                        <RotateCcw className="h-4 w-4" />
                        New
                      </button>
                      <button onClick={() => setTrainingInput("")} className="h-11 border border-[#c8c0a8]/20 px-4 text-xs uppercase tracking-[0.16em] text-[#c8c0a8]/70 hover:text-[#c8c0a8]">
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <Readout label="Accuracy" value={`${score}/${scoreTotal || 0}`} />
                    <Readout label="Rate" value={`${cpm} CPM`} />
                    <Readout label="Unit" value={`${unitMs} ms`} />
                  </div>
                </div>

                <Controls
                  threshold={threshold}
                  letterPause={letterPause}
                  cpm={cpm}
                  volume={volume}
                  soundEnabled={soundEnabled}
                  setThreshold={setThreshold}
                  setLetterPause={setLetterPause}
                  setCpm={setCpm}
                  setVolume={setVolume}
                  setSoundEnabled={setSoundEnabled}
                />
              </section>
            )}
          </div>

          <aside className="grid content-start gap-4">
            <div className="border border-[#c8c0a8]/18 bg-[#06080a]/80 p-5">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#00F0FF]">
                <Activity className="h-4 w-4" />
                Operator notes
              </div>
              <div className="space-y-4 text-sm leading-6 text-[#c8c0a8]/58">
                <p>Spacebar works like a straight key: hold for duration input. `Z` or `.` inserts a dot, `X` or `-` inserts a dash, and Enter transmits.</p>
                <p>Messages are stored and shared through the VPS relay at `{MORSE_RELAY_URL}`. The page polls the relay so several devices can use the same signal log.</p>
              </div>
            </div>

            <div className="border border-[#c8c0a8]/18 bg-[#06080a]/80 p-5">
              <div className="mb-4 text-xs uppercase tracking-[0.2em] text-[#c8c0a8]/45">Decoder sheet</div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
                {Object.entries(LATIN_TO_MORSE).slice(0, 36).map(([letter, code]) => (
                  <div key={letter} className="flex justify-between gap-3 border-b border-[#c8c0a8]/8 pb-1">
                    <span className="text-[#00F0FF]">{letter}</span>
                    <span className="text-[#c8c0a8]/65">{code}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

type ControlsProps = {
  threshold: number;
  letterPause: number;
  cpm: number;
  volume: number;
  soundEnabled: boolean;
  setThreshold: (value: number) => void;
  setLetterPause: (value: number) => void;
  setCpm: (value: number) => void;
  setVolume: (value: number) => void;
  setSoundEnabled: (value: boolean) => void;
};

function Controls(props: ControlsProps) {
  return (
    <aside className="space-y-5 p-5">
      <div className="flex items-center justify-between border border-[#c8c0a8]/12 bg-black/20 p-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#c8c0a8]/45">Incoming sound</div>
          <div className="mt-1 text-sm text-[#c8c0a8]">{props.soundEnabled ? "Enabled" : "Muted"}</div>
        </div>
        <button
          onClick={() => props.setSoundEnabled(!props.soundEnabled)}
          className={`flex h-10 w-14 items-center justify-center border transition ${
            props.soundEnabled ? "border-[#00c853]/60 bg-[#00c853]/15 text-[#00c853]" : "border-[#c8c0a8]/20 text-[#c8c0a8]/35"
          }`}
          aria-label="Toggle sound"
        >
          <Volume2 className="h-4 w-4" />
        </button>
      </div>

      <Slider label="Dot/dash split" value={props.threshold} min={80} max={520} step={10} unit="ms" onChange={props.setThreshold} />
      <Slider label="Letter pause" value={props.letterPause} min={160} max={1000} step={20} unit="ms" onChange={props.setLetterPause} />
      <Slider label="Playback rate" value={props.cpm} min={40} max={240} step={10} unit="CPM" onChange={props.setCpm} />
      <Slider label="Volume" value={Math.round(props.volume * 100)} min={0} max={100} step={1} unit="%" onChange={(value) => props.setVolume(value / 100)} />
    </aside>
  );
}

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
};

function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  return (
    <label className="block border border-[#c8c0a8]/12 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-[10px] uppercase tracking-[0.22em] text-[#c8c0a8]/45">{label}</span>
        <span className="text-sm text-[#00F0FF]">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full accent-[#00F0FF]"
      />
    </label>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#c8c0a8]/12 bg-black/20 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#c8c0a8]/45">{label}</div>
      <div className="mt-2 text-xl font-bold text-[#00F0FF]">{value}</div>
    </div>
  );
}
