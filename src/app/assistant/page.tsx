import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Database, FileArchive, LockKeyhole, ShipWheel, UploadCloud } from "lucide-react";

export const metadata: Metadata = {
  title: "ECHLON Assistant • Maritime Practice Report",
  description: "Private evidence and notes assistant for maritime practice reporting.",
};

const modules = [
  {
    icon: ShipWheel,
    label: "Officer batching",
    text: "Questions grouped by master, chief officer, second officer, bosun, chief engineer and ETO.",
  },
  {
    icon: UploadCloud,
    label: "Evidence vault",
    text: "Photos, PDFs and documents stored on a small VPS instead of disappearing into browser storage.",
  },
  {
    icon: Database,
    label: "SQLite logbook",
    text: "Tasks, confirmations, notes, drafts and vessel data persist between sessions.",
  },
  {
    icon: FileArchive,
    label: "Markdown export",
    text: "Clean notes package for later manual writing in Word, without pretending to author the report.",
  },
];

export default function AssistantPage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-12 lg:px-24 selection:bg-[#c8c0a8] selection:text-black">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image
              src="/logo_echlon.png"
              alt="Echlon Logo"
              fill
              className="object-contain invert drop-shadow-[0_0_12px_rgba(200,192,168,0.25)] transition duration-500 group-hover:drop-shadow-[0_0_28px_rgba(200,192,168,0.45)]"
            />
          </div>
          <div className="hidden font-mono md:block">
            <div className="text-xs font-bold tracking-[0.3em] text-[#c8c0a8]">ECHLON_SYS</div>
            <div className="text-[10px] tracking-widest text-[#c8c0a8]/45">ASSISTANT_NODE</div>
          </div>
        </Link>

        <Link
          href="/"
          className="border border-[#c8c0a822] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#c8c0a8]/75 transition hover:border-[#c8c0a8] hover:bg-[#c8c0a8] hover:text-black"
        >
          portfolio
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-3 border border-[#c8c0a822] bg-[#06080a]/70 px-3 py-2 font-mono text-xs uppercase tracking-[0.25em] text-[#c8c0a8]/70">
            <span className="h-2 w-2 animate-pulse bg-[#00c853]" />
            private maritime report assistant
          </div>

          <h1 className="font-mono text-5xl font-bold tracking-tighter text-[#c8c0a8] md:text-7xl">
            Asystent
            <span className="block text-[#c8c0a8]/55">Praktyki Morskiej</span>
          </h1>

          <p className="mt-8 max-w-2xl font-mono text-base leading-8 text-[#c8c0a8]/72 md:text-lg">
            A single-user operations console for collecting tanker practice evidence, tracking chapter gaps,
            preparing officer questions and exporting your own notes for the final Polish report.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="https://asystent-praktyki-morskiej.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 bg-[#c8c0a8] px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black transition hover:bg-white"
            >
              open console
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="mailto:echlondev@gmail.com"
              className="inline-flex items-center gap-2 border border-[#c8c0a822] px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em] text-[#c8c0a8] transition hover:border-[#c8c0a8]"
            >
              request access
            </a>
          </div>
        </div>

        <div className="relative overflow-hidden border border-[#c8c0a822] bg-[#050608]/80 p-5 shadow-[0_0_80px_rgba(200,192,168,0.05)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8c0a8]/60 to-transparent" />
          <div className="mb-5 flex items-center justify-between border-b border-[#c8c0a822] pb-4 font-mono text-xs uppercase tracking-[0.22em] text-[#c8c0a8]/55">
            <span>tankowiec_olejowy</span>
            <span>secure</span>
          </div>

          <div className="grid gap-3">
            {[
              ["I", "Wiedza okretowa i wachty", "73%"],
              ["II", "Statecznosc, ladunek, balast", "61%"],
              ["III", "Nawigacja, ECDIS, UKC", "84%"],
              ["IV", "Safety, fire, pollution", "58%"],
            ].map(([chapter, label, value]) => (
              <div key={chapter} className="border border-[#c8c0a814] bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-4 font-mono text-sm">
                  <span className="text-[#c8c0a8]">
                    {chapter} / {label}
                  </span>
                  <span className="text-[#c8c0a8]/55">{value}</span>
                </div>
                <div className="h-1 bg-[#c8c0a814]">
                  <div className="h-1 bg-[#c8c0a8]" style={{ width: value }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border border-[#c8c0a814] bg-black/25 p-4 font-mono text-xs leading-6 text-[#c8c0a8]/62">
            <div className="mb-2 flex items-center gap-2 text-[#c8c0a8]">
              <LockKeyhole className="h-4 w-4" />
              ADMIN_TOKEN required
            </div>
            API routes stay protected, uploaded files are served through authenticated endpoints, and the
            assistant does not generate academic prose on behalf of the student.
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 pb-16 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((module) => (
          <article key={module.label} className="border border-[#c8c0a822] bg-[#050608]/70 p-5">
            <module.icon className="mb-5 h-6 w-6 text-[#c8c0a8]" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.22em] text-[#c8c0a8]">
              {module.label}
            </h2>
            <p className="mt-4 font-mono text-sm leading-6 text-[#c8c0a8]/58">{module.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
