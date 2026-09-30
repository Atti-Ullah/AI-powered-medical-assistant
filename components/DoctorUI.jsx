"use client";

import { useState, useEffect, useCallback } from "react";
import { XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../lib/api-client";

// ---------------------------------------------------------------------------
// Shared style tokens and small building blocks for the doctor workspace
// ---------------------------------------------------------------------------

export const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
export const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50 disabled:text-slate-500";
export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

// Risk levels produced by the screening rules
export const RISK_STYLES = {
  high: { label: "High priority", badge: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500", bar: "bg-rose-500" },
  medium: { label: "Needs review", badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500", bar: "bg-amber-500" },
  low: { label: "Monitor", badge: "bg-blue-50 text-blue-700 ring-blue-600/20", dot: "bg-blue-500", bar: "bg-blue-500" },
  none: { label: "No concerns", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  unknown: { label: "No vitals", badge: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400", bar: "bg-slate-400" },
  info: { label: "Note", badge: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400", bar: "bg-slate-400" },
};

export const STATUS_STYLES = {
  upcoming: "bg-blue-50 text-blue-700 ring-blue-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function RiskBadge({ risk }) {
  const style = RISK_STYLES[risk] || RISK_STYLES.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.upcoming}`}>
      {status}
    </span>
  );
}

export function Avatar({ name, src, size = "h-10 w-10", text = "text-sm" }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`${size} ${text} flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600`} aria-hidden="true">
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

export function StatTile({ label, value, caption, icon: Icon, tone, loading }) {
  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <div className="mt-4 h-9 w-16 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      )}
      {caption && <p className="mt-1 text-xs text-slate-500">{caption}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <p className="mt-3 text-sm font-medium text-slate-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function InlineAlert({ kind = "error", children, onDismiss }) {
  const styles =
    kind === "success"
      ? { box: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: CheckCircleIcon, role: "status" }
      : { box: "border-rose-200 bg-rose-50 text-rose-700", Icon: XCircleIcon, role: "alert" };
  return (
    <div role={styles.role} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles.box}`}>
      <styles.Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-xs font-medium underline-offset-2 hover:underline">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "h-24" }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} aria-hidden="true" />;
}

export function Field({ label, htmlFor, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Modal dialog with a dimmed backdrop; closes on Escape or a backdrop click
export function Dialog({ title, description, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl ${wide ? "sm:max-w-lg" : "sm:max-w-md"}`}>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>}
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

// "2026-09-30" -> local Date without the UTC shift new Date("2026-09-30") would cause
export function parseDay(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

export function formatDate(value) {
  const d = parseDay(value);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
}

export function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "Today", "Tomorrow", "In 3 days", "2 days ago"
export function relativeDay(value) {
  const d = parseDay(value);
  if (!d) return "";
  const [y, m, day] = localToday().split("-").map(Number);
  const diff = Math.round((d - new Date(y, m - 1, day)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
}

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

// Loads `url` with the signed-in user's token and reloads when `url` changes.
// Pass null to skip loading (e.g. while waiting for an id).
export function useApiData(url) {
  const { user } = useAuth();
  const token = user?.token;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !url) return;
    try {
      const result = await apiRequest(token, url);
      setData(result.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, url]);

  useEffect(() => {
    setLoading(!!url);
    load();
  }, [load, url]);

  return { data, loading, error, reload: load, token };
}
