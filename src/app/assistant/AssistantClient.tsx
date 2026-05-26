"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  ExternalLink,
  FileText,
  Filter,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
  Ship,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const unlockKey = "spr-assistant-unlocked";

type FileItem = {
  id: string;
  taskId: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string | null;
};

type StorageStats = {
  fileCount: number;
  uploadBytes: number;
  thumbnailBytes: number;
  diskTotalBytes: number;
  diskUsedBytes: number;
  diskFreeBytes: number;
  maxUploadMb: number;
  thumbnailSupport: boolean;
  apiPublicUrl: string;
};

type Task = {
  id: string;
  chapter: "I" | "II" | "III" | "IV";
  section: string;
  title: string;
  primaryOfficer: string;
  secondaryOfficer?: string;
  priority: "Wysoki" | "Średni" | "Niski";
  sensitivity: "safe" | "ask" | "notes" | "confidential";
  status: "Nie zaczęte" | "Zapytać oficera" | "W trakcie" | "Zebrane" | "Do pisania" | "Gotowe";
  taskDescription?: string;
  taskChecklist?: string[];
  evidenceRequirements: string[];
  officerQuestions: string[];
  writingTemplate: string;
  userNotes: string;
  userDraft: string;
  uploadedFiles: FileItem[];
  confirmed: boolean;
  lastAskedAt: string | null;
};

const statuses: Task["status"][] = ["Nie zaczęte", "Zapytać oficera", "W trakcie", "Zebrane", "Do pisania", "Gotowe"];
const chapters: Task["chapter"][] = ["I", "II", "III", "IV"];
const officers = ["Master", "Chief Officer", "Second Officer", "Bosun", "Chief Engineer", "ETO"];

const sensitivityLabels: Record<Task["sensitivity"], string> = {
  safe: "Można fotografować",
  ask: "Najpierw zapytać",
  notes: "Bez zdjęć — notatki",
  confidential: "Wrażliwe / zgoda oficera",
};

function writable(task: Task) {
  return ["Zebrane", "Do pisania", "Gotowe"].includes(task.status)
    || task.uploadedFiles.length > 0
    || task.userNotes.trim().length > 40
    || task.confirmed;
}

function matches(task: Task, query: string, officer: string, chapter: string, status: string) {
  const haystack = [
    task.title,
    task.primaryOfficer,
    task.secondaryOfficer ?? "",
    task.chapter,
    task.section,
    task.status,
    task.priority,
    task.userNotes,
    task.userDraft,
    ...task.evidenceRequirements,
    ...task.officerQuestions,
  ].join(" ").toLocaleLowerCase("pl-PL");
  return (!query || haystack.includes(query.toLocaleLowerCase("pl-PL")))
    && (officer === "all" || task.primaryOfficer === officer || task.secondaryOfficer === officer)
    && (chapter === "all" || task.chapter === chapter)
    && (status === "all" || task.status === status);
}

export function AssistantClient() {
  const [unlocked, setUnlocked] = useState(false);
  const [username, setUsername] = useState("ayomi");
  const [password, setPassword] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [officer, setOfficer] = useState("all");
  const [chapter, setChapter] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("Ładowanie zadań z VPS...");
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showTaskList, setShowTaskList] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [response, storageResponse] = await Promise.all([
        fetch("/api/assistant/tasks", { cache: "no-store", credentials: "include" }),
        fetch("/api/assistant/storage", { cache: "no-store", credentials: "include" }),
      ]);
      if (response.status === 401) {
        window.localStorage.removeItem(unlockKey);
        setUnlocked(false);
        setTasks([]);
        setSelected(null);
        setMessage("Sesja wygasła. Zaloguj się ponownie.");
        return;
      }
      if (!response.ok) throw new Error(await response.text());
      const next = await response.json() as Task[];
      setTasks(next);
      if (storageResponse.ok) setStorage(await storageResponse.json() as StorageStats);
      setSelected((current) => current ?? next[0]?.id ?? null);
      setMessage("Połączono z VPS. Pliki i notatki zapisują się po stronie serwera.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nie udało się połączyć z API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const isUnlocked = window.localStorage.getItem(unlockKey) === "true";
    setUnlocked(isUnlocked);
    if (isUnlocked) void load();
    else {
      setLoading(false);
      setMessage("Zaloguj się, żeby otworzyć asystenta.");
    }
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoggingIn(true);
    try {
      const response = await fetch("/api/assistant-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Nie udało się zalogować.");
      window.localStorage.setItem(unlockKey, "true");
      setUnlocked(true);
      setPassword("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nie udało się zalogować.");
    } finally {
      setLoggingIn(false);
    }
  }

  function logout() {
    window.localStorage.removeItem(unlockKey);
    setUnlocked(false);
    setTasks([]);
    setSelected(null);
    setMessage("Wylogowano.");
  }

  const filtered = useMemo(
    () => tasks.filter((task) => matches(task, query, officer, chapter, status)),
    [tasks, query, officer, chapter, status],
  );

  const selectedTask = tasks.find((task) => task.id === selected) ?? filtered[0] ?? null;
  const done = tasks.filter((task) => ["Zebrane", "Do pisania", "Gotowe"].includes(task.status) || task.confirmed).length;
  const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const fileCount = tasks.reduce((sum, task) => sum + task.uploadedFiles.length, 0);
  const readyCount = tasks.filter(writable).length;
  const askCount = tasks.filter((task) => task.status === "Zapytać oficera").length;

  async function patchTask(id: string, patch: Partial<Task>) {
    const previous = tasks;
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
    try {
      const response = await fetch(`/api/assistant/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error(await response.text());
      const saved = await response.json() as Task;
      setTasks((current) => current.map((task) => task.id === id ? saved : task));
      setMessage("Zapisano na VPS.");
    } catch (error) {
      setTasks(previous);
      setMessage(error instanceof Error ? error.message : "Nie udało się zapisać zmian.");
      throw error;
    }
  }

  async function upload(taskId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    setUploadProgress(0);
    setMessage(`Wgrywanie oryginalnego pliku: ${file.name}`);

    let uploadUrl = `/api/assistant/tasks/${taskId}/files`;
    try {
      const ticket = await fetch("/api/assistant-upload-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ taskId, fileName: file.name, mimeType: file.type, size: file.size }),
      });
      if (ticket.ok) {
        const payload = await ticket.json() as { uploadUrl?: string };
        if (payload.uploadUrl && (window.location.protocol === "http:" || payload.uploadUrl.startsWith("https:"))) {
          uploadUrl = payload.uploadUrl;
        }
      }
    } catch {
      // Fall back to the same-origin proxy when a direct VPS upload ticket is unavailable.
    }

    await new Promise<void>((resolve) => {
      const request = new XMLHttpRequest();
      request.open("POST", uploadUrl);
      request.withCredentials = uploadUrl.startsWith("/api/");
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
      };
      request.onload = () => {
        setUploadProgress(null);
        if (request.status < 200 || request.status >= 300) {
          setMessage(request.responseText || "Nie udało się wgrać pliku.");
          resolve();
          return;
        }
        const uploaded = JSON.parse(request.responseText) as FileItem;
        uploaded.url = `/api/assistant/files/${uploaded.id}`;
        if (uploaded.thumbnailUrl) uploaded.thumbnailUrl = `/api/assistant/files/${uploaded.id}/thumbnail`;
        setTasks((current) => current.map((task) => task.id === taskId ? { ...task, uploadedFiles: [uploaded, ...task.uploadedFiles] } : task));
        setMessage(`Wgrano bez kompresji: ${uploaded.originalName}`);
        void refreshStorage();
        resolve();
      };
      request.onerror = () => {
        setUploadProgress(null);
        setMessage("Nie udało się wgrać pliku.");
        resolve();
      };
      request.send(body);
    });
  }

  async function deleteFile(taskId: string, fileId: string) {
    const previous = tasks;
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, uploadedFiles: task.uploadedFiles.filter((file) => file.id !== fileId) } : task));
    try {
      const response = await fetch(`/api/assistant/files/${fileId}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error(await response.text());
      setMessage("Usunięto plik z VPS.");
      await refreshStorage();
    } catch (error) {
      setTasks(previous);
      setMessage(error instanceof Error ? error.message : "Nie udało się usunąć pliku.");
    }
  }

  async function exportMarkdown() {
    try {
      const response = await fetch("/api/assistant/export/markdown", { credentials: "include" });
      if (!response.ok) throw new Error(await response.text());
      const markdown = await response.text();
      const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "materialy-praktyka-morska.md";
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Eksport Markdown pobrany.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nie udało się pobrać eksportu Markdown.");
    }
  }

  async function refreshStorage() {
    const response = await fetch("/api/assistant/storage", { cache: "no-store", credentials: "include" });
    if (response.ok) setStorage(await response.json() as StorageStats);
  }

  if (!unlocked) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f4ec] px-4 text-[#17201b]">
        <form onSubmit={login} className="w-full max-w-sm rounded border border-[#d7d0c4] bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-[#31513d]">
            <Ship className="h-4 w-4" />
            Asystent Praktyki Morskiej
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Logowanie</h1>
          <label className="mt-5 grid gap-2 text-sm font-semibold">
            Login
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded border border-[#c9c0b3] px-3 py-2 font-normal"
              autoFocus
            />
          </label>
          <label className="mt-5 grid gap-2 text-sm font-semibold">
            Hasło
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded border border-[#c9c0b3] px-3 py-2 font-normal"
            />
          </label>
          <button className="mt-4 w-full rounded bg-[#31513d] px-4 py-3 font-semibold text-white hover:bg-[#263f30]" disabled={loggingIn}>
            {loggingIn ? "Sprawdzanie VPS..." : "Otwórz asystenta"}
          </button>
          <p className="mt-4 text-sm text-[#667167]">{message}</p>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ec] text-[#17201b]">
      <header className="border-b border-[#d7d0c4] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-[#31513d]">
              <Ship className="h-4 w-4" />
              Asystent Sprawozdania z Praktyki Morskiej
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Tankowiec olejowy: materiały, pytania, pliki</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void exportMarkdown()}
              className="inline-flex items-center justify-center gap-2 rounded bg-[#31513d] px-4 py-3 font-semibold text-white hover:bg-[#263f30]"
            >
              <Download className="h-4 w-4" />
              Eksport Markdown
            </button>
            <button onClick={logout} className="rounded border border-[#c9c0b3] px-4 py-3 font-semibold text-[#31513d] hover:bg-[#f7f4ec]">
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5">
        <p className="mb-4 rounded border border-[#d7d0c4] bg-white px-4 py-3 text-sm text-[#4f5c52]">
          {loading && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
          {message}
          {uploadProgress !== null && <span className="ml-2 font-semibold">{uploadProgress}%</span>}
        </p>

        <section className="grid gap-3 md:grid-cols-4">
          <Metric label="Ukończenie" value={`${completion}%`} icon={<BadgeCheck />} />
          <Metric label="Pytania do oficerów" value={askCount} icon={<FileText />} />
          <Metric label="Gotowe do pisania" value={readyCount} icon={<ClipboardIcon />} />
          <Metric label="Wgrane pliki" value={fileCount} icon={<UploadCloud />} />
        </section>

        {storage && <StoragePanel storage={storage} onRefresh={() => void refreshStorage()} />}

        <section className="mt-5 grid gap-3 rounded border border-[#d7d0c4] bg-white p-3 md:grid-cols-[2fr_repeat(3,1fr)]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#667167]" />
            <input
              className="w-full rounded border border-[#c9c0b3] py-2 pl-9 pr-3"
              placeholder="Szukaj po tytule, pytaniach, dowodach, notatkach..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Select value={officer} onChange={setOfficer} options={["all", ...officers]} />
          <Select value={chapter} onChange={setChapter} options={["all", ...chapters]} />
          <Select value={status} onChange={setStatus} options={["all", ...statuses]} />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.4fr]">
          <aside className={`${showTaskList ? "block" : "hidden"} max-h-[78vh] overflow-auto rounded border border-[#d7d0c4] bg-white lg:block`}>
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#d7d0c4] bg-white px-4 py-3 font-semibold">
              <Filter className="h-4 w-4" />
              Zadania ({filtered.length})
            </div>
            <div className="grid gap-2 p-3">
              {filtered.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelected(task.id);
                    setShowTaskList(false);
                  }}
                  className={`rounded border p-3 text-left transition ${
                    selectedTask?.id === task.id ? "border-[#31513d] bg-[#edf5ef]" : "border-[#e2dacf] bg-[#fbfaf7] hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[#31513d]">{task.section}</span>
                    <span className="rounded bg-white px-2 py-1 text-xs text-[#667167]">{task.priority}</span>
                  </div>
                  <h2 className="mt-2 text-sm font-semibold leading-5">{task.title}</h2>
                  <p className="mt-2 text-xs text-[#667167]">{task.primaryOfficer}{task.secondaryOfficer ? ` / ${task.secondaryOfficer}` : ""} · {task.status}</p>
                </button>
              ))}
            </div>
          </aside>

          {selectedTask && (
            <TaskDetail
              task={selectedTask}
              onPatch={(patch) => patchTask(selectedTask.id, patch)}
              onUpload={(file) => upload(selectedTask.id, file)}
              onDeleteFile={(fileId) => deleteFile(selectedTask.id, fileId)}
              onBack={() => setShowTaskList(true)}
              showOnMobile={!showTaskList}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function ClipboardIcon() {
  return <FileText className="h-5 w-5" />;
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="rounded border border-[#d7d0c4] bg-white p-4">
      <div className="mb-3 text-[#31513d] [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-sm text-[#667167]">{label}</div>
    </div>
  );
}

function StoragePanel({ storage, onRefresh }: { storage: StorageStats; onRefresh: () => void }) {
  const usedPercent = storage.diskTotalBytes ? Math.round((storage.diskUsedBytes / storage.diskTotalBytes) * 100) : 0;
  return (
    <section className="mt-3 rounded border border-[#d7d0c4] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <HardDrive className="h-4 w-4 text-[#31513d]" />
            Magazyn VPS
          </h2>
          <p className="mt-1 text-sm text-[#667167]">
            Pliki: {storage.fileCount} · oryginały {fileSize(storage.uploadBytes)} · miniatury {fileSize(storage.thumbnailBytes)} · limit pliku {storage.maxUploadMb} MB
          </p>
        </div>
        <button onClick={onRefresh} className="inline-flex items-center justify-center gap-2 rounded border border-[#c9c0b3] px-3 py-2 text-sm font-semibold text-[#31513d] hover:bg-[#f7f4ec]">
          <RefreshCw className="h-4 w-4" />
          Odśwież
        </button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded bg-[#ede8dc]">
        <div className="h-full rounded bg-[#31513d]" style={{ width: `${Math.min(100, usedPercent)}%` }} />
      </div>
      <p className="mt-2 text-xs text-[#667167]">
        Dysk: {fileSize(storage.diskUsedBytes)} użyte z {fileSize(storage.diskTotalBytes)}, wolne {fileSize(storage.diskFreeBytes)}.
        {" "}Miniatury: {storage.thumbnailSupport ? "włączone" : "brak biblioteki Pillow na VPS"}.
        {storage.apiPublicUrl ? ` Bezpośredni adres API: ${storage.apiPublicUrl}.` : " Bezpośrednie HTTPS API nie jest jeszcze skonfigurowane."}
      </p>
    </section>
  );
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select className="rounded border border-[#c9c0b3] px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option === "all" ? "Wszystko" : option}
        </option>
      ))}
    </select>
  );
}

function TaskDetail({
  task,
  onPatch,
  onUpload,
  onDeleteFile,
  onBack,
  showOnMobile,
}: {
  task: Task;
  onPatch: (patch: Partial<Task>) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  onBack: () => void;
  showOnMobile: boolean;
}) {
  const [notes, setNotes] = useState(task.userNotes);
  const [draft, setDraft] = useState(task.userDraft);
  const [saving, setSaving] = useState(false);
  const [viewerFile, setViewerFile] = useState<FileItem | null>(null);

  useEffect(() => {
    setNotes(task.userNotes);
    setDraft(task.userDraft);
  }, [task.id, task.userNotes, task.userDraft]);

  async function saveText() {
    setSaving(true);
    try {
      await onPatch({ userNotes: notes, userDraft: draft });
    } catch {
      setNotes(task.userNotes);
      setDraft(task.userDraft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={`${showOnMobile ? "block" : "hidden"} rounded border border-[#d7d0c4] bg-white p-5 lg:block`}>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded border border-[#c9c0b3] px-3 py-2 text-sm font-semibold text-[#31513d] lg:hidden">
        <ArrowLeft className="h-4 w-4" />
        Wróć do listy zadań
      </button>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold text-[#31513d]">Rozdział {task.chapter} · {task.section}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{task.title}</h2>
          <p className="mt-2 text-sm text-[#667167]">
            {task.primaryOfficer}{task.secondaryOfficer ? ` / ${task.secondaryOfficer}` : ""} · {sensitivityLabels[task.sensitivity]}
          </p>
        </div>
        <select
          className="rounded border border-[#c9c0b3] px-3 py-2"
          value={task.status}
          onChange={(event) => void onPatch({ status: event.target.value as Task["status"] })}
        >
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section>
          <h3 className="font-semibold">Co zrobić</h3>
          <p className="mt-2 text-sm leading-6 text-[#5f695f]">{task.taskDescription || "Brak opisu dla tego zadania."}</p>
        </section>
        <Info title="Checklist" items={task.taskChecklist ?? []} />
        <Info title="Pytania do oficera po angielsku" items={task.officerQuestions} />
        <Info title="Wymagane materiały" items={task.evidenceRequirements} />
      </div>

      <div className="mt-5 rounded bg-[#f7f4ec] p-4 text-sm leading-6 text-[#4f5c52]">{task.writingTemplate}</div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Notatki
          <textarea className="min-h-36 rounded border border-[#c9c0b3] p-3 font-normal" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Opis własny do Worda
          <textarea className="min-h-36 rounded border border-[#c9c0b3] p-3 font-normal" value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void saveText()}
          disabled={saving}
          className="rounded bg-[#31513d] px-4 py-2 font-semibold text-white hover:bg-[#263f30] disabled:cursor-wait disabled:opacity-70"
        >
          {saving ? "Zapisywanie..." : "Zapisz notatki"}
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-[#c9c0b3] px-4 py-2 font-semibold hover:bg-[#f7f4ec]">
          <UploadCloud className="h-4 w-4" />
          Dodaj zdjęcie/plik (do 50 MB)
          <input
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={task.confirmed} onChange={(event) => void onPatch({ confirmed: event.target.checked })} />
          Potwierdzone podpisem/rangą/pieczątką
        </label>
      </div>

      <section className="mt-5">
        <h3 className="font-semibold">Pliki</h3>
        {task.uploadedFiles.length === 0 ? (
          <p className="mt-2 rounded border border-dashed border-[#c9c0b3] p-4 text-sm text-[#667167]">Brak plików dla tego zadania.</p>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {task.uploadedFiles.map((file) => (
              <FileTile key={file.id} file={file} onView={() => setViewerFile(file)} onDelete={() => onDeleteFile(file.id)} />
            ))}
          </div>
        )}
      </section>

      {viewerFile && <FileViewer file={viewerFile} onClose={() => setViewerFile(null)} />}
    </article>
  );
}

function isImage(file: FileItem) {
  return file.mimeType.startsWith("image/");
}

function fileSize(size: number) {
  if (size <= 0) return "0 KB";
  if (size > 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function FileTile({ file, onView, onDelete }: { file: FileItem; onView: () => void; onDelete: () => void }) {
  return (
    <div className="overflow-hidden rounded border border-[#d7d0c4] bg-[#fbfaf7]">
      <button onClick={onView} className="block w-full text-left">
        {isImage(file) ? (
          // Use the original VPS file directly; Next image optimization can re-encode evidence photos.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.thumbnailUrl || file.url} alt={file.originalName} className="h-36 w-full bg-[#ede8dc] object-cover" loading="lazy" />
        ) : (
          <div className="grid h-36 place-items-center bg-[#ede8dc] text-[#31513d]">
            <FileText className="h-10 w-10" />
          </div>
        )}
      </button>
      <div className="grid gap-2 p-3">
        <button onClick={onView} className="truncate text-left text-sm font-semibold text-[#31513d]" title={file.originalName}>
          {file.originalName}
        </button>
        <p className="text-xs text-[#667167]">{file.mimeType} · {fileSize(file.size)}</p>
        <div className="flex gap-2">
          <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-[#c9c0b3] px-2 py-2 text-xs font-semibold text-[#31513d] hover:bg-white">
            <ExternalLink className="h-3.5 w-3.5" />
            Pełny rozmiar
          </a>
          <button onClick={onDelete} className="inline-flex items-center justify-center rounded border border-[#d9b8ad] px-2 py-2 text-[#9a3727] hover:bg-[#fff3ef]" title="Usuń plik">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FileViewer({ file, onClose }: { file: FileItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex h-dvh flex-col bg-black/90 p-2 sm:p-4">
      <div className="flex min-h-0 flex-col gap-2 text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 truncate pr-10 text-sm font-semibold sm:pr-0">{file.originalName}</p>
        <div className="flex shrink-0 gap-2">
          <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-white px-3 py-2 text-sm font-semibold text-[#17201b] sm:flex-none">
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Otwórz pełny rozmiar</span>
            <span className="sm:hidden">Pełny</span>
          </a>
          <button onClick={onClose} className="absolute right-2 top-2 rounded bg-white/15 p-2 hover:bg-white/25 sm:static" aria-label="Zamknij podgląd">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid min-h-0 flex-1 place-items-center overflow-auto sm:mt-4">
        {isImage(file) ? (
          // Use the original VPS file directly; this viewer is for evidence inspection, not optimization.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt={file.originalName} className="max-h-[calc(100dvh-7.5rem)] max-w-full rounded bg-white object-contain sm:max-h-[calc(100dvh-6rem)]" />
        ) : (
          <iframe src={file.url} title={file.originalName} className="h-full min-h-0 w-full rounded bg-white" />
        )}
      </div>
    </div>
  );
}

function Info({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#5f695f]">
        {(items.length ? items : ["Brak pozycji."]).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
