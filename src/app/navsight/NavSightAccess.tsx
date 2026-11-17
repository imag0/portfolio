"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FeatureGallery from "./FeatureGallery";
import { ArrowDownToLine, ArrowRight, Check, Copy, LoaderCircle } from "lucide-react";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { copy, localError, type Language } from "./copy";

type Purchase = { version: string; sha256: string; bytes: number; hardware_id: string | null; license_key: string | null };
type Catalog = { amount: number; regular_amount: number; sale: boolean; terms_version: string; terms: string; privacy: string; terms_pl: string; privacy_pl: string };
type Account = { email: string; paid: boolean; state?: string; amount?: number };
type Device = { hardware_id: string; device_name: string };
const primary = "inline-flex min-h-12 items-center justify-center gap-3 border border-[#c8c0a8] bg-[#c8c0a8] px-5 py-3 text-sm font-bold text-[#06080a] transition hover:bg-[#e0d8c0] disabled:cursor-not-allowed disabled:opacity-40";
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 border border-[#c8c0a844] px-4 py-2 text-xs transition hover:border-[#c8c0a8] hover:bg-[#c8c0a80a] disabled:opacity-40";
const input = "w-full border border-[#c8c0a844] bg-[#06080a] p-3 text-sm text-[#eee7d3] outline-none focus:border-[#c8c0a8]";

class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
async function api(path: string, body?: object, access = "") {
  const response = await fetch(`/api/navsight/${path}`, {
    method: body ? "POST" : "GET", credentials: "same-origin",
    headers: { ...(access ? { Authorization: `Bearer ${access}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined, cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new ApiError(result.error || "Please try again shortly.", response.status);
  return result;
}

export default function NavSightAccess() {
  const [lang, setLang] = useState<Language>("en");
  const t = copy[lang];
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [legacyAccess, setLegacyAccess] = useState("");
  const [recovery, setRecovery] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [device, setDevice] = useState<Device | null>(null);
  const [approved, setApproved] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [register, setRegister] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [authConsent, setAuthConsent] = useState(false);
  const [terms, setTerms] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<keyof typeof copy.en | "">("");
  const [hwid, setHwid] = useState("");
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  function failure(err: unknown) { setError(err instanceof Error ? err.message : "Please try again shortly."); }
  function language(next: Language) {
    setLang(next);
    try { localStorage.setItem("navsight-language", next); } catch { /* URL preference still works. */ }
    const url = new URL(location.href); url.searchParams.set("lang", next); history.replaceState(null, "", url);
  }

  async function refresh() {
    const info: Account = await api("account"); setAccount(info);
    if (info.paid) { setPurchase(await api("status")); setNotice(""); }
    return info;
  }

  useEffect(() => {
    let active = true;
    async function start() {
      let selected = new URLSearchParams(location.search).get("lang");
      let legacy = new URLSearchParams(location.hash.slice(1)).get("access") || "";
      let incomingDevice = new URLSearchParams(location.hash.slice(1)).get("device") || "";
      let oldCode = "";
      try {
        selected ||= localStorage.getItem("navsight-language") || (navigator.language.startsWith("pl") ? "pl" : "en");
        oldCode = localStorage.getItem("navsight-recovery") || "";
        legacy ||= sessionStorage.getItem("navsight-access") || "";
        if (incomingDevice) sessionStorage.setItem("navsight-device", incomingDevice);
        else incomingDevice = sessionStorage.getItem("navsight-device") || "";
      } catch { /* Authentication uses a server cookie, not browser local storage. */ }
      setLang(selected === "pl" ? "pl" : "en"); setRecovery(oldCode); setLegacyAccess(legacy);
      if (location.hash.includes("access=") || location.hash.includes("device=")) history.replaceState(null, "", location.pathname + location.search);
      try {
        const info = await api("catalog"); if (!active) return; setCatalog(info);
        if (incomingDevice) {
          try { const data = await api("device-info", { device_id: incomingDevice }); if (active) { setDeviceId(incomingDevice); setDevice(data); } }
          catch (err) { if (active) failure(err); }
        }
        try {
          const user = await refresh();
          if (!user.paid && (oldCode || legacy)) {
            try {
              await api("claim", oldCode ? { recovery_code: oldCode } : { access: legacy });
              await refresh();
              try { localStorage.removeItem("navsight-recovery"); sessionStorage.removeItem("navsight-access"); } catch { /* Claimed credentials are retired on the server. */ }
              setRecovery(""); setLegacyAccess("");
            } catch { /* An optional older purchase can be linked explicitly below. */ }
          }
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 401)) throw err;
          if (legacy) { try { setPurchase(await api("status", undefined, legacy)); } catch { /* A fresh sign-in can restore access. */ } }
        }
      } catch (err) { if (active) failure(err); }
      finally { if (active) setLoading(false); }
    }
    start();
    const onHash = () => { if (location.hash.includes("device=") || location.hash.includes("access=")) { setApproved(false); setConfirmed(false); start(); } };
    window.addEventListener("hashchange", onHash);
    return () => { active = false; window.removeEventListener("hashchange", onHash); };
  }, []);

  useEffect(() => {
    if (account?.state !== "pending" || account.paid) return;
    let attempts = 0;
    const timer = setInterval(async () => {
      if (++attempts > 24) { clearInterval(timer); return; }
      try { await refresh(); } catch { /* Manual check remains available. */ }
    }, 5000);
    return () => clearInterval(timer);
  }, [account?.state, account?.paid]);

  async function authenticate(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (register && password !== repeat) { setError(t.mismatched); return; }
    setBusy("auth");
    try {
      await api(register ? "register" : "login", { email, password }); setPassword(""); setRepeat("");
      const user = await refresh();
      if (!user.paid && (recovery || legacyAccess)) {
        try { await claim(); } catch { /* Optional legacy import has its own recovery UI. */ }
      }
    } catch (err) { failure(err); } finally { setBusy(""); }
  }

  async function claim() {
    setBusy("claim"); setError("");
    try {
      await api("claim", recovery ? { recovery_code: recovery.trim().toLowerCase() } : { access: legacyAccess });
      await refresh(); setNotice("claimDone"); setRecovery(""); setLegacyAccess("");
      try { localStorage.removeItem("navsight-recovery"); sessionStorage.removeItem("navsight-access"); } catch { /* Server already retired the recovery code. */ }
    } catch (err) { failure(err); } finally { setBusy(""); }
  }

  async function checkout() {
    if (!catalog || !account) return;
    setBusy("checkout"); setError("");
    try {
      const result = await api("checkout", { terms_version: catalog.terms_version, accepted: terms, amount: catalog.amount });
      if (result.price_changed) { setCatalog({ ...catalog, amount: result.amount, sale: result.amount < catalog.regular_amount }); setNotice("priceChanged"); return; }
      if (result.paid) await refresh();
      else if (result.url) location.assign(result.url);
      else { setAccount({ ...account, state: "pending" }); setNotice("processing"); }
    } catch (err) { failure(err); } finally { setBusy(""); }
  }

  async function download() {
    setBusy("download"); setError("");
    try { const data = await api("download-ticket", {}, account ? "" : legacyAccess); setDownloadUrl(data.url); location.assign(data.url); }
    catch (err) { failure(err); } finally { setBusy(""); }
  }

  async function approve() {
    setBusy("approve"); setError("");
    try { await api("device-approve", { device_id: deviceId, confirm: confirmed }, account ? "" : legacyAccess); setApproved(true); setNotice("approved"); setPurchase(await api("status", undefined, account ? "" : legacyAccess)); }
    catch (err) { failure(err); } finally { setBusy(""); }
  }

  async function activate(event: React.FormEvent) {
    event.preventDefault(); setBusy("activate"); setError("");
    try { const result = await api("activate", { hardware_id: hwid.trim(), confirm: manualConfirmed }, account ? "" : legacyAccess); setPurchase(current => current ? { ...current, ...result } : current); }
    catch (err) { failure(err); } finally { setBusy(""); }
  }

  async function logout(everywhere = false) {
    setBusy("logout");
    try { await api("logout", { everywhere }); setAccount(null); setPurchase(null); setLegacyAccess(""); setRecovery(""); setNotice(""); setError(""); setPassword(""); setCurrentPassword(""); setNewPassword(""); try { localStorage.removeItem("navsight-recovery"); sessionStorage.removeItem("navsight-access"); } catch { /* No local access remains required. */ } }
    catch (err) { failure(err); } finally { setBusy(""); }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault(); setBusy("password"); setError("");
    try { await api("password", { current_password: currentPassword, password: newPassword }); setCurrentPassword(""); setNewPassword(""); setNotice("passwordChanged"); }
    catch (err) { failure(err); } finally { setBusy(""); }
  }

  const authForm = <section id="account" className="scroll-mt-8">
    <div className="mb-5 flex flex-wrap gap-3">{[true, false].map(value => <button type="button" key={String(value)} onClick={() => { setRegister(value); setError(""); }} className={`${secondary} ${register === value ? "border-[#c8c0a8] text-[#eee7d3]" : "text-[#c8c0a888]"}`} aria-pressed={register === value}>{value ? t.create : t.signIn}</button>)}</div>
    <form onSubmit={authenticate} className="space-y-4">
      <label className="block text-xs">{t.email}<input name="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className={`${input} mt-2`}/></label>
      <label className="block text-xs">{t.password}<input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className={`${input} mt-2`}/></label>
      {register && <><p className="text-xs leading-6 text-[#c8c0a888]">{t.passwordHint}</p><label className="block text-xs">{t.confirmPassword}<input name="confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={repeat} onChange={e => setRepeat(e.target.value)} className={`${input} mt-2`}/></label><label className="flex items-start gap-3 text-xs leading-6"><input required type="checkbox" checked={authConsent} onChange={e => setAuthConsent(e.target.checked)} className="mt-1 accent-[#c8c0a8]"/><span>{t.authConsent} <a className="underline" href="#privacy">{t.privacy} →</a></span></label></>}
      <button disabled={!!busy || (register && !authConsent)} className={primary}>{busy === "auth" ? t.working : register ? t.create : t.signIn}<ArrowRight size={16}/></button>
    </form>
    <p className="mt-4 text-xs leading-6 text-[#c8c0a888]">{t.remember}</p>
    <details className="mt-4 text-xs"><summary className="cursor-pointer">{t.forgot}</summary><p className="mt-3 leading-6 text-[#c8c0a899]">{t.forgotText} <a className="underline" href="https://t.me/ayomi_nk">{t.support} ↗</a></p></details>
  </section>;

  return <main lang={lang} className="min-h-screen bg-[#06080a] font-mono text-[#c8c0a8] selection:bg-[#c8c0a8] selection:text-[#06080a]">
    <div className="pointer-events-none fixed inset-0 opacity-20" aria-hidden="true" style={{ backgroundImage: "radial-gradient(#c8c0a833 1px, transparent 1px)", backgroundSize: "28px 28px", maskImage: "linear-gradient(black, transparent 80%)" }}/>
    <div className="relative mx-auto max-w-6xl px-6 py-7 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c8c0a822] pb-5">
        <Link href="/" className="flex items-center gap-3 text-sm font-bold tracking-[.25em]"><AnimatedLogo className="h-8 w-12" aria-hidden="true"/> ECHLON</Link>
        <div className="flex items-center gap-4"><span className="hidden text-[10px] uppercase tracking-[.2em] text-[#c8c0a877] sm:block">SMMM / Windows</span><nav aria-label="Language / Język" className="flex border border-[#c8c0a833]">{(["en", "pl"] as const).map(value => <button key={value} onClick={() => language(value)} aria-pressed={lang === value} className={`min-h-10 px-3 text-xs ${lang === value ? "bg-[#c8c0a8] text-[#06080a]" : "hover:bg-[#c8c0a811]"}`}>{value.toUpperCase()}</button>)}</nav></div>
      </header>
      <section className="py-11 sm:py-14"><p className="mb-4 text-[11px] uppercase tracking-[.23em] text-[#c8c0a888]">{t.eyebrow}</p><h1 className="text-5xl font-bold tracking-[-.07em] sm:text-7xl">NavSight<span className="font-normal text-[#c8c0a866]">_</span></h1><p className="mt-5 max-w-3xl text-sm leading-7 text-[#c8c0a8bb]">{t.subtitle}</p><p className="mt-3 max-w-3xl text-xs leading-6 text-[#c8c0a877]">{t.audience}</p><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[10px] uppercase tracking-[.12em] text-[#c8c0a899]"><span>01 / {t.lifetime}</span><span>02 / {t.pc}</span><span>03 / {t.offline}</span></div></section>
      {error && <div role="alert" className="mb-6 border-l-2 border-[#e3a29b] bg-[#e3a29b08] p-4 text-sm leading-6 text-[#e3b6af]">{localError(error, lang)}</div>}
      {notice && <p role="status" className="mb-6 border-l border-[#c8c0a866] p-4 text-sm leading-6">{String(t[notice])}</p>}
      {loading ? <p role="status" className="flex items-center gap-3 py-10 text-sm"><LoaderCircle className="animate-spin" size={16}/>{t.loading}</p> : <>
        {account && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-[#c8c0a833] p-4 text-xs"><p className="break-all">{t.signedIn} <span className="text-[#eee7d3]">{account.email}</span></p><button className="underline underline-offset-4" disabled={!!busy} onClick={() => logout()}>{t.signOut}</button></div>}
        {device && !purchase && <p className="mb-6 border-l border-[#c8c0a866] p-4 text-sm leading-7">{t.request}: <strong>{device.device_name}</strong>. {t.deviceLogin}</p>}
        {purchase ? <>
          {device && <section className="mb-8 border border-[#c8c0a866] bg-[#c8c0a805] p-6"><p className="mb-4 text-[10px] uppercase tracking-[.2em]">{t.request}</p><h2 className="break-all text-xl">{device.device_name}</h2><p className="mt-3 break-all text-xs text-[#c8c0a899]">{t.hardware}: {device.hardware_id}</p>{approved ? <p role="status" className="mt-5 flex items-center gap-3"><Check size={18}/>{t.approved}</p> : <><label className="my-5 flex items-start gap-3 text-xs leading-6"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 accent-[#c8c0a8]"/>{t.approveConfirm}</label><button onClick={approve} disabled={!!busy || !confirmed} className={primary}>{busy === "approve" ? t.working : t.approve}<ArrowRight size={16}/></button></>}</section>}
          <div className="grid gap-10 border-t border-[#c8c0a833] py-8 md:grid-cols-2"><section><p className="mb-4 text-[10px] tracking-[.2em] text-[#c8c0a877]">01 / {t.downloadTitle}</p><h2 className="text-xl">{t.downloadTitle}</h2><p className="my-4 text-sm leading-7 text-[#c8c0a8aa]">{t.downloadText}</p><button onClick={download} disabled={!!busy} className={primary}><ArrowDownToLine size={16}/>{busy === "download" ? t.working : t.download}</button><p className="mt-3 text-[11px] text-[#c8c0a877]">{t.version} {purchase.version} · {(purchase.bytes / 1024 / 1024).toFixed(1)} MB · Windows</p>{downloadUrl && <a className="mt-3 block text-xs underline" href={downloadUrl}>{t.retryDownload}</a>}<details className="mt-5 text-xs text-[#c8c0a877]"><summary className="cursor-pointer">{t.checksum}</summary><p className="mt-3 break-all leading-6">SHA-256: {purchase.sha256}</p></details></section>
            <section><p className="mb-4 text-[10px] tracking-[.2em] text-[#c8c0a877]">02 / {t.activationTitle}</p><h2 className="flex items-center gap-2 text-xl">{purchase.license_key ? <><Check size={18}/>{t.licenseReady}</> : t.activationTitle}</h2><p className="my-4 text-sm leading-7 text-[#c8c0a8aa]">{t.activationText}</p><p className="text-xs leading-6 text-[#c8c0a888]">{t.activationOffline}</p>{purchase.hardware_id && <p className="mt-4 break-all text-xs">{t.hardware}: {purchase.hardware_id}</p>}
              <details className="mt-6 border-t border-[#c8c0a822] pt-4 text-xs"><summary className="cursor-pointer">{t.manual}</summary>{purchase.license_key ? <><p className="my-4 leading-6 text-[#c8c0a899]">{t.keyHint}</p><textarea aria-label={lang === "pl" ? "Klucz licencyjny" : "License key"} readOnly value={purchase.license_key} rows={5} className={`${input} text-xs`}/><button className={`${secondary} mt-3`} onClick={async () => { try { await navigator.clipboard.writeText(purchase.license_key || ""); setCopied(true); } catch { setError(t.copyFail); } }}><Copy size={14}/>{copied ? t.copied : t.copyKey}</button></> : <form onSubmit={activate}><p className="my-4 leading-6 text-[#c8c0a899]">{t.manualText}</p><label className="block">{t.hardware}<input className={`${input} mt-2`} required maxLength={64} value={hwid} onChange={e => setHwid(e.target.value)}/></label><label className="my-4 flex items-start gap-3 leading-6"><input required type="checkbox" checked={manualConfirmed} onChange={e => setManualConfirmed(e.target.checked)} className="mt-1 accent-[#c8c0a8]"/>{t.manualConfirm}</label><button disabled={!!busy || !manualConfirmed} className={secondary}>{t.makeKey}</button></form>}</details>
            </section></div>
          {!account && <div className="border-t border-[#c8c0a822] py-8"><p className="mb-5 text-sm">{t.legacyText}</p>{authForm}</div>}
        </> : <div className="grid gap-10 border-t border-[#c8c0a833] py-8 md:grid-cols-2"><section><p className="mb-5 text-[10px] uppercase tracking-[.2em] text-[#c8c0a877]">{t.priceLabel}</p>{catalog ? <><div className="flex items-baseline gap-4"><span className="text-4xl tracking-tight">{catalog.amount} <span className="text-lg">PLN</span></span>{catalog.sale && <del className="text-lg text-[#c8c0a866]">{catalog.regular_amount} PLN</del>}</div><p className="mt-3 text-xs leading-6 text-[#c8c0a899]">{catalog.sale ? t.launch : t.regular}</p><p className="mt-4 text-sm leading-7 text-[#c8c0a8aa]">{t.checkoutText}</p>{account ? <><label className="my-6 flex items-start gap-3 text-xs leading-6"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-1 accent-[#c8c0a8]"/><span>{t.termsAccept} <a href="#purchase-terms" className="underline">{t.terms} →</a></span></label><button onClick={checkout} disabled={!!busy || !terms} className={primary}>{busy === "checkout" ? t.opening : `${t.pay} ${catalog.amount} ${t.withStripe}`}<ArrowRight size={16}/></button>{account.state === "pending" && <><p className="mt-4 text-xs leading-6 text-[#c8c0a899]">{t.pending}</p><button className={`${secondary} mt-3`} disabled={!!busy} onClick={() => { setError(""); refresh().catch(failure); }}>{t.checkPayment}</button></>}</> : <a className={`${primary} mt-6`} href="#account">{t.create} / {t.signIn}<ArrowRight size={16}/></a>}</> : <button className={secondary} onClick={() => location.reload()}>{t.reload}</button>}</section>{account ? <section><h2 className="text-xl">{t.activationTitle}</h2><p className="mt-4 text-sm leading-7 text-[#c8c0a8aa]">{t.activationText}</p><p className="mt-4 text-xs leading-6 text-[#c8c0a888]">{t.activationOffline}</p><details className="mt-6 text-xs"><summary className="cursor-pointer">{t.legacy}</summary><p className="my-4 leading-6">{t.legacyText}</p><label>{t.recovery}<input className={`${input} mt-2`} value={recovery} onChange={e => setRecovery(e.target.value)} maxLength={128}/></label><button onClick={claim} className={`${secondary} mt-3`} disabled={!!busy || (!recovery && !legacyAccess)}>{t.claim}</button></details></section> : authForm}</div>}
      </>}
      {!purchase && <FeatureGallery lang={lang} />}
      {account && <details className="border-t border-[#c8c0a822] py-5 text-xs"><summary className="cursor-pointer">{t.settings}</summary><form className="mt-5 max-w-md space-y-4" onSubmit={changePassword}><label className="block">{t.currentPassword}<input type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={`${input} mt-2`}/></label><label className="block">{t.newPassword}<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`${input} mt-2`}/></label><button className={secondary} disabled={!!busy}>{t.changePassword}</button></form><button className={`${secondary} mt-4`} disabled={!!busy} onClick={() => logout(true)}>{t.logoutAll}</button></details>}
      {catalog && <section id="purchase-terms" className="border-t border-[#c8c0a822] py-6"><p className="mb-4 text-xs leading-6 text-[#c8c0a888]">{t.practice}</p><details className="py-2 text-xs"><summary className="cursor-pointer">{t.terms}</summary><p className="mt-4 whitespace-pre-wrap leading-7 text-[#c8c0a899]">{lang === "pl" ? catalog.terms_pl : catalog.terms}</p></details><details id="privacy" className="py-2 text-xs"><summary className="cursor-pointer">{t.privacy}</summary><p className="mt-4 whitespace-pre-wrap leading-7 text-[#c8c0a899]">{lang === "pl" ? catalog.privacy_pl : catalog.privacy}</p></details></section>}
      <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-[#c8c0a822] py-7 text-[10px] uppercase tracking-[.12em] text-[#c8c0a888]"><Link href="/">Echlon / Ayomi</Link><a href="https://t.me/ayomi_nk" target="_blank" rel="noopener noreferrer">{t.support} ↗</a><span>{t.noSubscription}</span></footer>
    </div>
  </main>;
}
