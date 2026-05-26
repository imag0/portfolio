"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CircleStop,
  Download,
  ExternalLink,
  FileText,
  Filter,
  HardDrive,
  Loader2,
  Mic,
  Pause,
  Play,
  RefreshCw,
  Search,
  Ship,
  Square,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Mp3Encoder } from "lamejs";

const unlockKey = "spr-assistant-unlocked";
const panelMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

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
  directUploadPublicUrl?: string;
};

type WindowWithAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
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
  checklistDone?: string[];
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

const priorityRank: Record<Task["priority"], number> = {
  Wysoki: 0,
  Średni: 1,
  Niski: 2,
};

const statusRank: Record<Task["status"], number> = Object.fromEntries(statuses.map((item, index) => [item, index])) as Record<Task["status"], number>;

function sectionRank(section: string) {
  const [chapterPart, itemPart] = section.split(".");
  const chapterValue = chapters.indexOf(chapterPart as Task["chapter"]);
  return (chapterValue < 0 ? 99 : chapterValue) * 100 + Number(itemPart ?? 0);
}

function matches(task: Task, query: string, officer: string, chapter: string, status: string, priority: string, sensitivity: string) {
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
    && (status === "all" || task.status === status)
    && (priority === "all" || task.priority === priority)
    && (sensitivity === "all" || task.sensitivity === sensitivity);
}

function sortTasks(tasks: Task[], sortMode: string) {
  return [...tasks].sort((a, b) => {
    if (sortMode === "officer") {
      return a.primaryOfficer.localeCompare(b.primaryOfficer, "pl-PL")
        || priorityRank[a.priority] - priorityRank[b.priority]
        || sectionRank(a.section) - sectionRank(b.section);
    }
    if (sortMode === "priority") {
      return priorityRank[a.priority] - priorityRank[b.priority]
        || a.primaryOfficer.localeCompare(b.primaryOfficer, "pl-PL")
        || sectionRank(a.section) - sectionRank(b.section);
    }
    if (sortMode === "status") {
      return statusRank[a.status] - statusRank[b.status]
        || priorityRank[a.priority] - priorityRank[b.priority]
        || a.primaryOfficer.localeCompare(b.primaryOfficer, "pl-PL");
    }
    return sectionRank(a.section) - sectionRank(b.section)
      || priorityRank[a.priority] - priorityRank[b.priority];
  });
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
  const [priority, setPriority] = useState("all");
  const [sensitivity, setSensitivity] = useState("all");
  const [sortMode, setSortMode] = useState("chapter");
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("Ładowanie zadań z VPS...");
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showTaskList, setShowTaskList] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [audioFile, setAudioFile] = useState<FileItem | null>(null);

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
    () => sortTasks(
      tasks.filter((task) => matches(task, query, officer, chapter, status, priority, sensitivity)),
      sortMode,
    ),
    [tasks, query, officer, chapter, status, priority, sensitivity, sortMode],
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
        <ChapterProgress tasks={tasks} />

        {storage && <StoragePanel storage={storage} onRefresh={() => void refreshStorage()} />}

        <section className="mt-5 grid gap-3 rounded border border-[#d7d0c4] bg-white p-3 md:grid-cols-[2fr_repeat(6,1fr)]">
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
          <Select value={priority} onChange={setPriority} options={["all", "Wysoki", "Średni", "Niski"]} />
          <Select value={sensitivity} onChange={setSensitivity} options={["all", "safe", "ask", "notes", "confidential"]} labels={sensitivityLabels} />
          <Select
            value={sortMode}
            onChange={setSortMode}
            options={["chapter", "officer", "priority", "status"]}
            labels={{
              chapter: "Rozdział",
              officer: "Oficer",
              priority: "Priorytet",
              status: "Status",
            }}
          />
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
              onPlayAudio={setAudioFile}
              onBack={() => setShowTaskList(true)}
              showOnMobile={!showTaskList}
            />
          )}
        </section>
      </div>
      <AnimatePresence>
        {audioFile && <GlobalAudioPlayer file={audioFile} onClose={() => setAudioFile(null)} />}
      </AnimatePresence>
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

function ChapterProgress({ tasks }: { tasks: Task[] }) {
  return (
    <section className="mt-3 grid gap-3 md:grid-cols-4">
      {chapters.map((chapter) => {
        const chapterTasks = tasks.filter((task) => task.chapter === chapter);
        const complete = chapterTasks.filter((task) => writable(task) || task.confirmed).length;
        const percent = chapterTasks.length ? Math.round((complete / chapterTasks.length) * 100) : 0;
        return (
          <div key={chapter} className="rounded border border-[#d7d0c4] bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">Rozdział {chapter}</p>
              <span className="text-sm text-[#667167]">{complete}/{chapterTasks.length}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded bg-[#ede8dc]">
              <div className="h-full rounded bg-[#31513d]" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </section>
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
        {storage.directUploadPublicUrl ? ` Upload idzie bezpośrednio na VPS: ${storage.directUploadPublicUrl}.` : " Upload działa przez bezpieczny proxy endpoint."}
      </p>
    </section>
  );
}

function Select({
  value,
  options,
  onChange,
  labels = {},
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <select className="rounded border border-[#c9c0b3] px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option === "all" ? "Wszystko" : labels[option] ?? option}
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
  onPlayAudio,
  onBack,
  showOnMobile,
}: {
  task: Task;
  onPatch: (patch: Partial<Task>) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  onPlayAudio: (file: FileItem) => void;
  onBack: () => void;
  showOnMobile: boolean;
}) {
  const [notes, setNotes] = useState(task.userNotes);
  const [saving, setSaving] = useState(false);
  const [viewerFile, setViewerFile] = useState<FileItem | null>(null);
  const checklistDone = task.checklistDone ?? [];

  useEffect(() => {
    setNotes(task.userNotes);
  }, [task.id, task.userNotes]);

  async function saveText() {
    setSaving(true);
    try {
      await onPatch({ userNotes: notes });
    } catch {
      setNotes(task.userNotes);
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
        <Checklist
          items={task.taskChecklist ?? []}
          checked={checklistDone}
          onToggle={(item) => {
            const next = checklistDone.includes(item)
              ? checklistDone.filter((value) => value !== item)
              : [...checklistDone, item];
            void onPatch({ checklistDone: next });
          }}
        />
        <Info title="Pytania do oficera po angielsku" items={task.officerQuestions} />
        <Info title="Wymagane materiały" items={task.evidenceRequirements} />
      </div>

      <div className="mt-5 rounded bg-[#f7f4ec] p-4 text-sm leading-6 text-[#4f5c52]">{task.writingTemplate}</div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Notatki
          <textarea className="min-h-36 rounded border border-[#c9c0b3] p-3 font-normal" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <VoiceRecorder task={task} onSave={onUpload} onPlayAudio={onPlayAudio} />
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
        <button
          onClick={() => void onPatch({ lastAskedAt: new Date().toISOString() })}
          className="inline-flex items-center gap-2 rounded border border-[#c9c0b3] px-4 py-2 text-sm font-semibold text-[#31513d] hover:bg-[#f7f4ec]"
        >
          <CheckCircle2 className="h-4 w-4" />
          Zapytano teraz
        </button>
        {task.lastAskedAt && (
          <span className="text-xs text-[#667167]">Ostatnio pytano: {formatDate(task.lastAskedAt)}</span>
        )}
      </div>

      <section className="mt-5">
        <h3 className="font-semibold">Pliki</h3>
        {task.uploadedFiles.length === 0 ? (
          <p className="mt-2 rounded border border-dashed border-[#c9c0b3] p-4 text-sm text-[#667167]">Brak plików dla tego zadania.</p>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {task.uploadedFiles.map((file) => (
              <FileTile key={file.id} file={file} onView={() => setViewerFile(file)} onDelete={() => onDeleteFile(file.id)} onPlayAudio={() => onPlayAudio(file)} />
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

function isAudio(file: FileItem) {
  return file.mimeType.startsWith("audio/");
}

function fileSize(size: number) {
  if (size <= 0) return "0 KB";
  if (size > 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function FileTile({ file, onView, onDelete, onPlayAudio }: { file: FileItem; onView: () => void; onDelete: () => void; onPlayAudio: () => void }) {
  return (
    <div className="overflow-hidden rounded border border-[#d7d0c4] bg-[#fbfaf7]">
      <button onClick={isAudio(file) ? onPlayAudio : onView} className="block w-full text-left">
        {isImage(file) ? (
          // Use the original VPS file directly; Next image optimization can re-encode evidence photos.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.thumbnailUrl || file.url} alt={file.originalName} className="h-36 w-full bg-[#ede8dc] object-cover" loading="lazy" />
        ) : isAudio(file) ? (
          <div className="grid h-36 place-items-center bg-[#ede8dc] text-[#31513d]">
            <div className="grid place-items-center gap-2">
              <Play className="h-10 w-10" />
              <span className="text-xs font-semibold">Notatka głosowa MP3</span>
            </div>
          </div>
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
          {isAudio(file) ? (
            <button onClick={onPlayAudio} className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-[#c9c0b3] px-2 py-2 text-xs font-semibold text-[#31513d] hover:bg-white">
              <Play className="h-3.5 w-3.5" />
              Odtwórz
            </button>
          ) : (
            <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-[#c9c0b3] px-2 py-2 text-xs font-semibold text-[#31513d] hover:bg-white">
              <ExternalLink className="h-3.5 w-3.5" />
              Pełny rozmiar
            </a>
          )}
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

function VoiceRecorder({ task, onSave, onPlayAudio }: { task: Task; onSave: (file: File) => Promise<void>; onPlayAudio: (file: FileItem) => void }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const [recording, setRecording] = useState(false);
  const [encoding, setEncoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<{ file: File; url: string; seconds: number } | null>(null);
  const [status, setStatus] = useState("Gotowy do nagrywania.");
  const audioFiles = task.uploadedFiles.filter(isAudio);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000)), 500);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, [preview]);

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setStatus("Ta przeglądarka nie udostępnia nagrywania mikrofonu.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      chunksRef.current = [];
      const mimeType = getRecorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setStatus("Nagrywanie przerwane przez przeglądarkę.");
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      startedAtRef.current = Date.now();
      setElapsed(0);
      setStatus("Nagrywanie...");
      setRecording(true);
      recorder.start(250);
    } catch {
      setStatus("Nie udało się uzyskać dostępu do mikrofonu.");
      setRecording(false);
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    setRecording(false);
    setStatus("Zatrzymywanie nagrania...");
    try {
      recorder.requestData();
    } catch {
      // Some browsers flush automatically on stop.
    }
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, 120);
    void finishRecording(recorder);
  }

  async function finishRecording(recorder: MediaRecorder) {
    setEncoding(true);
    try {
      const source = await waitForStoppedBlob(recorder, chunksRef.current);
      if (source.size < 64) {
        setStatus("Nagranie było puste. Spróbuj jeszcze raz.");
        return;
      }
      const buffer = await source.arrayBuffer();
      const AudioCtor = window.AudioContext || (window as WindowWithAudioContext).webkitAudioContext;
      const context = new AudioCtor();
      const decoded = await context.decodeAudioData(buffer.slice(0));
      const mp3 = encodeMp3(decoded);
      await context.close();
      const safeTask = task.section.replace(".", "-").toLowerCase();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const file = new File([mp3], `${safeTask}-notatka-glosowa-${stamp}.mp3`, { type: "audio/mpeg" });
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview({ file, url: URL.createObjectURL(file), seconds: Math.round(decoded.duration) });
      setStatus("Nagranie gotowe do odsłuchu i zapisania.");
    } catch {
      setStatus("Nie udało się przekonwertować nagrania do MP3. Spróbuj nagrać krócej albo odśwież stronę.");
    } finally {
      recorder.stream.getTracks().forEach((track) => track.stop());
      setEncoding(false);
    }
  }

  async function savePreview() {
    if (!preview) return;
    setSaving(true);
    try {
      await onSave(preview.file);
      URL.revokeObjectURL(preview.url);
      setPreview(null);
      setStatus("Nagranie zapisane. Możesz dodać kolejne.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.section
      layout
      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="grid gap-3 rounded border border-[#c9c0b3] bg-[#fbfaf7] p-3 text-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Dyktafon MP3</h3>
        <span className="text-xs text-[#667167]">{recording ? formatTime(elapsed) : audioFiles.length ? `${audioFiles.length} nagrań` : "brak nagrań"}</span>
      </div>
      <p className="text-xs text-[#667167]">{status}</p>
      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <button onClick={() => void startRecording()} disabled={encoding || saving} className="inline-flex items-center gap-2 rounded bg-[#31513d] px-4 py-2 font-semibold text-white transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#263f30] disabled:translate-y-0 disabled:opacity-60">
            <Mic className="h-4 w-4" />
            Nagrywaj
          </button>
        ) : (
          <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded bg-[#9a3727] px-4 py-2 font-semibold text-white transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#7b2c20]">
            <Square className="h-4 w-4" />
            Stop
          </button>
        )}
        {encoding && <span className="inline-flex items-center gap-2 px-2 py-2 text-[#667167]"><Loader2 className="h-4 w-4 animate-spin" /> kodowanie MP3...</span>}
      </div>
      <AnimatePresence initial={false}>
        {preview && (
          <motion.div
            key="preview"
            {...panelMotion}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-2 rounded border border-[#d7d0c4] bg-white p-3"
          >
            <p className="font-semibold">Nowe nagranie · {formatTime(preview.seconds)}</p>
            <audio controls src={preview.url} className="w-full" />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void savePreview()} disabled={saving} className="rounded bg-[#31513d] px-3 py-2 font-semibold text-white transition duration-200 ease-out hover:bg-[#263f30] disabled:opacity-60">
                {saving ? "Zapisywanie..." : "Zapisz do zadania"}
              </button>
              <button
                onClick={() => {
                  URL.revokeObjectURL(preview.url);
                  setPreview(null);
                  setStatus("Nagranie odrzucone. Możesz nagrać kolejne.");
                }}
                className="rounded border border-[#c9c0b3] px-3 py-2 font-semibold text-[#31513d] transition duration-200 ease-out hover:bg-[#f7f4ec]"
              >
                Odrzuć
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {audioFiles.length > 0 && (
        <motion.div
          key="recordings"
          {...panelMotion}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-2"
        >
          {audioFiles.map((file) => (
            <motion.button
              layout
              key={file.id}
              onClick={() => onPlayAudio(file)}
              className="flex items-center justify-between gap-2 rounded bg-white px-3 py-2 text-left text-[#31513d] transition duration-200 ease-out hover:bg-[#f7f4ec]"
            >
              <span className="truncate font-semibold">{file.originalName}</span>
              <Play className="h-4 w-4 shrink-0" />
            </motion.button>
          ))}
        </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function encodeMp3(audioBuffer: AudioBuffer) {
  const channels = Math.min(2, audioBuffer.numberOfChannels);
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, 96);
  const blockSize = 1152;
  const chunks: Int8Array[] = [];
  const left = floatTo16Bit(audioBuffer.getChannelData(0));
  const right = channels > 1 ? floatTo16Bit(audioBuffer.getChannelData(1)) : undefined;
  for (let offset = 0; offset < left.length; offset += blockSize) {
    const leftChunk = left.subarray(offset, offset + blockSize);
    const rightChunk = right?.subarray(offset, offset + blockSize);
    const encoded = encoder.encodeBuffer(leftChunk, rightChunk);
    if (encoded.length) chunks.push(encoded);
  }
  const flushed = encoder.flush();
  if (flushed.length) chunks.push(flushed);
  return new Blob(chunks.map((chunk) => new Uint8Array(chunk)), { type: "audio/mpeg" });
}

function getRecorderMimeType() {
  const choices = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return choices.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function waitForStoppedBlob(recorder: MediaRecorder, chunks: Blob[]) {
  return new Promise<Blob>((resolve) => {
    const finish = () => {
      window.setTimeout(() => {
        resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      }, 80);
    };
    if (recorder.state === "inactive") {
      finish();
      return;
    }
    recorder.addEventListener("stop", finish, { once: true });
  });
}

function floatTo16Bit(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const value = Math.max(-1, Math.min(1, input[i] ?? 0));
    output[i] = value < 0 ? value * 0x8000 : value * 0x7fff;
  }
  return output;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function GlobalAudioPlayer({ file, onClose }: { file: FileItem; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = file.url;
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [file]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#c9c0b3] bg-white/95 px-3 py-2 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <button
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            if (audio.paused) void audio.play().then(() => setPlaying(true));
            else {
              audio.pause();
              setPlaying(false);
            }
          }}
          className="rounded bg-[#31513d] p-2 text-white"
          aria-label={playing ? "Pauza" : "Odtwórz"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#31513d]">{file.originalName}</p>
          <audio ref={audioRef} controls className="mt-1 h-8 w-full" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
        </div>
        <a href={file.url} target="_blank" rel="noreferrer" className="hidden rounded border border-[#c9c0b3] px-3 py-2 text-xs font-semibold text-[#31513d] sm:inline-flex">
          Plik
        </a>
        <button
          onClick={() => {
            audioRef.current?.pause();
            onClose();
          }}
          className="rounded border border-[#c9c0b3] p-2 text-[#31513d]"
          aria-label="Zamknij odtwarzacz"
        >
          <CircleStop className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
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

function Checklist({ items, checked, onToggle }: { items: string[]; checked: string[]; onToggle: (item: string) => void }) {
  return (
    <section>
      <h3 className="font-semibold">Checklist</h3>
      <div className="mt-2 grid gap-2 text-sm leading-6 text-[#5f695f]">
        {(items.length ? items : ["Brak pozycji."]).map((item) => {
          const isChecked = checked.includes(item);
          return (
            <label key={item} className="flex cursor-pointer items-start gap-2 rounded border border-[#e2dacf] bg-[#fbfaf7] px-3 py-2 transition hover:bg-white">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(item)}
                className="mt-1"
                disabled={items.length === 0}
              />
              <span className={isChecked ? "text-[#31513d] line-through decoration-[#31513d]/50" : ""}>{item}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
