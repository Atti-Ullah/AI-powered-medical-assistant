"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  BellIcon,
  BellSlashIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { adminRequest, timeAgo } from "../lib/admin-client";

const POLL_MS = 60000;

function iconFor(item) {
  if (item.type === "user") return { Icon: UserPlusIcon, tone: "bg-blue-50 text-blue-600" };
  if (item.type === "appointment") {
    return item.severity === "warning"
      ? { Icon: CalendarDaysIcon, tone: "bg-amber-50 text-amber-600" }
      : { Icon: CalendarDaysIcon, tone: "bg-emerald-50 text-emerald-600" };
  }
  return item.severity === "error"
    ? { Icon: XCircleIcon, tone: "bg-rose-50 text-rose-600" }
    : { Icon: ExclamationTriangleIcon, tone: "bg-amber-50 text-amber-600" };
}

// Bell + dropdown in the dashboard top bar. Administrators see live platform notifications;
// other roles get an empty state until they have notification sources of their own.
export default function NotificationBell({ user }) {
  const isAdmin = user?.type === "admin";
  const storageKey = `medisynix_read_notifications_${user?.id}`;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef(null);

  // Restore which notifications were already read
  useEffect(() => {
    try {
      setReadIds(JSON.parse(localStorage.getItem(storageKey) || "[]"));
    } catch {
      setReadIds([]);
    }
  }, [storageKey]);

  const persist = useCallback(
    (ids) => {
      setReadIds(ids);
      try {
        localStorage.setItem(storageKey, JSON.stringify(ids.slice(-200)));
      } catch {
        // storage unavailable
      }
    },
    [storageKey]
  );

  const load = useCallback(async () => {
    if (!isAdmin || !user?.token) return;
    setLoading(true);
    try {
      const result = await adminRequest(user.token, "/api/admin/notifications");
      setItems(result.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.token]);

  useEffect(() => {
    load();
    if (!isAdmin) return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load, isAdmin]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((item) => !readIds.includes(item.id));
  const markRead = (id) => {
    if (!readIds.includes(id)) persist([...readIds, id]);
  };
  const markAllRead = () => persist(Array.from(new Set([...readIds, ...items.map((i) => i.id)])));

  const toggle = () => {
    setOpen((v) => !v);
    if (!open) load();
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span className="sr-only">
          {unread.length > 0 ? `View notifications (${unread.length} unread)` : "View notifications"}
        </span>
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {unread.length > 0 && (
          <span
            className="absolute right-0.5 top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
            aria-hidden="true"
          >
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Notifications"
          className="fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-500">{unread.length > 0 ? `${unread.length} unread` : "You're all caught up"}</p>
            </div>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
              >
                <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {error ? (
              <p role="alert" className="px-4 py-8 text-center text-sm text-rose-600">{error}</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <BellSlashIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-medium text-slate-900">{loading ? "Loading..." : "No notifications"}</p>
                {!loading && <p className="mt-1 text-xs text-slate-500">New activity will show up here.</p>}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => {
                  const { Icon, tone } = iconFor(item);
                  const isUnread = !readIds.includes(item.id);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          markRead(item.id);
                          setOpen(false);
                        }}
                        className={`flex items-start gap-3 px-4 py-3.5 transition hover:bg-slate-50 ${isUnread ? "bg-primary-50/40" : ""}`}
                      >
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={`text-sm ${isUnread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>{item.title}</span>
                            {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-label="Unread" />}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500">{item.text}</span>
                          <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(item.createdAt)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {isAdmin && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-center">
              <Link
                href="/dashboard/admin/alerts"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                View all system alerts &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
