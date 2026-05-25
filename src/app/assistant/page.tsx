import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  ClipboardList,
  Download,
  FileQuestion,
  FileText,
  Filter,
  HardDrive,
  KeyRound,
  Lock,
  MessageSquareText,
  Ship,
  UploadCloud,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Maritime Practice Report Assistant",
  description: "A single-user evidence, officer-question and Markdown export tool for an oil tanker practice report.",
};

const chapters = [
  ["I", "Seamanship and watchkeeping", "Deck machinery, mooring, pilot ladder, watch handover and port manoeuvres."],
  ["II", "Shipbuilding, stability and cargo", "Tank plan, cargo piping, sounding, load line, ballast sequence and GM notes."],
  ["III", "Navigation", "Bridge layout, antennas, passage plan, ECDIS settings, UKC and compass error."],
  ["IV", "Safety and pollution prevention", "Fire systems, lifesaving appliances, enclosed spaces, SOPEP and waste streams."],
];

const features = [
  {
    icon: ClipboardList,
    title: "Chapter gap tracking",
    body: "Shows exactly what is still missing for chapters I-IV: materials, confirmations, files, notes and current task status.",
  },
  {
    icon: MessageSquareText,
    title: "Officer question batching",
    body: "Groups questions by Master, Chief Officer, Second Officer, Bosun, Chief Engineer and ETO so the student does not bother officers one item at a time.",
  },
  {
    icon: UploadCloud,
    title: "VPS file uploads",
    body: "Photos, PDFs and documents go to a small VPS with authenticated API routes and local filesystem storage, not browser-only localStorage.",
  },
  {
    icon: Filter,
    title: "Search, filters and sorting",
    body: "Searches through titles, officers, chapters, statuses, priorities, evidence requirements, questions, notes and drafts.",
  },
  {
    icon: BadgeCheck,
    title: "Confirmation tracking",
    body: "Each task can be marked as confirmed by signature, rank or stamp and can record when an officer was last asked.",
  },
  {
    icon: Download,
    title: "Markdown export",
    body: "Exports vessel data, task status, evidence, file links, notes and user drafts for later manual Word writing.",
  },
];

const stack = [
  "Next.js frontend",
  "Small VPS backend",
  "SQLite persistence",
  "Filesystem uploads",
  "Bearer-token API protection",
  "Markdown export",
];

export default function AssistantPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ec] text-[#17201b]">
      <header className="border-b border-[#d7d0c4] bg-white/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="font-mono text-sm font-semibold tracking-[0.18em] text-[#31513d]">
            ECHLON
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <a className="rounded border border-[#c9c0b3] px-3 py-2 hover:bg-[#eee8dc]" href="#features">
              Features
            </a>
            <a className="rounded border border-[#c9c0b3] px-3 py-2 hover:bg-[#eee8dc]" href="#stack">
              Stack
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded border border-[#b7c7bd] bg-[#edf5ef] px-3 py-2 text-sm font-medium text-[#31513d]">
            <Ship className="h-4 w-4" />
            Oil tanker practice report assistant
          </p>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            A practical tool for collecting report evidence without writing the report for the student.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4f5c52]">
            The app helps one maritime navigation student organize materials for a Polish practice report:
            officer questions, missing chapter evidence, uploaded files, confirmations, notes and drafts.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:echlondev@gmail.com?subject=Maritime%20assistant%20demo"
              className="inline-flex items-center gap-2 rounded bg-[#31513d] px-5 py-3 font-semibold text-white hover:bg-[#263f30]"
            >
              Request demo
              <FileQuestion className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded border border-[#bdb5a8] px-5 py-3 font-semibold hover:bg-white"
            >
              View feature map
            </a>
          </div>
        </div>

        <div className="rounded border border-[#d7d0c4] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#31513d]">Dashboard snapshot</p>
              <p className="text-sm text-[#667167]">The real app tracks live progress from saved task data.</p>
            </div>
            <span className="rounded bg-[#edf5ef] px-3 py-1 text-sm font-medium text-[#31513d]">single-user</span>
          </div>

          <div className="grid gap-3">
            {chapters.map(([number, title, description]) => (
              <div key={number} className="rounded border border-[#e2dacf] bg-[#fbfaf7] p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#31513d] font-semibold text-white">
                    {number}
                  </div>
                  <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#5f695f]">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[#d7d0c4] bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#31513d]">Feature map</p>
              <h2 className="mt-2 text-3xl font-semibold">Built around the actual workflow on board.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#667167]">
              The important constraint: it organizes the student&apos;s own material. It does not generate final
              academic prose and does not pretend to be the author of the report.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded border border-[#d7d0c4] bg-[#fbfaf7] p-5">
                <feature.icon className="h-6 w-6 text-[#31513d]" />
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f695f]">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="stack" className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#31513d]">Implementation</p>
          <h2 className="mt-2 text-3xl font-semibold">Simple deployment split.</h2>
          <p className="mt-4 leading-7 text-[#5f695f]">
            The frontend can live on Vercel while the upload API and SQLite database run on a low-resource VPS.
            That keeps files persistent without exposing secrets in the browser.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-[#d7d0c4] bg-white p-5">
            <KeyRound className="h-6 w-6 text-[#31513d]" />
            <h3 className="mt-4 font-semibold">Protected API</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f695f]">
              All private routes require a bearer token. File URLs are stable, but served through authenticated
              endpoints instead of public directory listing.
            </p>
          </div>
          <div className="rounded border border-[#d7d0c4] bg-white p-5">
            <HardDrive className="h-6 w-6 text-[#31513d]" />
            <h3 className="mt-4 font-semibold">Low-resource VPS friendly</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f695f]">
              Storage is local filesystem plus SQLite. The backend is small enough for a tiny VPS already running
              another service.
            </p>
          </div>
          <div className="rounded border border-[#d7d0c4] bg-white p-5 md:col-span-2">
            <FileText className="h-6 w-6 text-[#31513d]" />
            <h3 className="mt-4 font-semibold">Seeded tanker task database</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f695f]">
              The built-in tasks cover deck machinery, mooring, tank plans, cargo piping, stability, ECDIS,
              fire-fighting systems, SOPEP, bunkering, enclosed spaces and medical equipment.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="rounded border border-[#d7d0c4] bg-[#17201b] p-5 text-white">
          <div className="flex items-start gap-3">
            <Lock className="mt-1 h-5 w-5 shrink-0 text-[#b7d8c0]" />
            <div>
              <h2 className="font-semibold">Security note</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Single-user does not mean public. The app is intended for private use with a strong admin token,
                configured CORS, upload size limits, MIME checks, sanitized filenames and no public arbitrary file
                serving.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {stack.map((item) => (
            <span key={item} className="rounded border border-[#d7d0c4] bg-white px-3 py-2 text-sm text-[#4f5c52]">
              {item}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
