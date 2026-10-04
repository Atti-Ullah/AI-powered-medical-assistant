"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../contexts/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
import PageHeader from "../../../../components/PageHeader";

const RECORD_TYPES = ["all", "lab", "imaging", "prescription", "consultation", "surgery", "other"];

const TYPE_STYLES = {
  lab: "bg-blue-50 text-blue-700 ring-blue-200",
  imaging: "bg-purple-50 text-purple-700 ring-purple-200",
  prescription: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  consultation: "bg-amber-50 text-amber-700 ring-amber-200",
  surgery: "bg-red-50 text-red-700 ring-red-200",
  other: "bg-slate-100 text-slate-700 ring-slate-200",
};

// Providers are stored both as "Dr. Sarah Johnson" and "Sarah Johnson"; show them consistently
function providerName(record) {
  const raw = (record.doctor || "").trim();
  if (!raw || /^(not specified|unknown)$/i.test(raw)) return "Provider not specified";
  // Only people get a "Dr." prefix: not already-prefixed names, the Medisynix summary or labs/hospitals
  return /^(dr\.?\s|medisynix|.*(lab|labs|hospital|clinic|diagnostic|diagnostics|centre|center))/i.test(raw) ? raw : `Dr. ${raw}`;
}

function statusLabel(status) {
  if (!status) return "Saved";
  const s = String(status).toLowerCase();
  if (s === "active") return "Saved";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// A file we can still open: stored data (doctor uploads) or a normal URL. Temporary blob: links
// from older uploads stop working after a reload, so they count as unavailable.
const hasUsableFile = (record) => !!record.fileUrl && !String(record.fileUrl).startsWith("blob:");

// Browsers refuse to navigate to data: URLs, so turn stored files into a blob first
async function openFile(record, download = false) {
  const url = record.fileUrl;
  let target = url;
  let revoke = null;
  if (url.startsWith("data:")) {
    const blob = await (await fetch(url)).blob();
    target = URL.createObjectURL(blob);
    revoke = target;
  }
  if (download) {
    const link = document.createElement("a");
    link.href = target;
    link.download = record.fileName || `${record.title || "record"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } else {
    window.open(target, "_blank", "noopener,noreferrer");
  }
  if (revoke) setTimeout(() => URL.revokeObjectURL(revoke), 60_000);
}

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState("all");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    async function fetchRecords() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const userId = user._id || user.id;
        const response = await fetch(`/api/patient/records?userId=${userId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch medical records");
        const data = await response.json();
        setRecords(
          [...(data.records || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      } catch (err) {
        console.error("Error fetching medical records:", err);
        setError("Failed to load your medical records. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, [user]);

  const counts = useMemo(() => {
    const result = { all: records.length };
    records.forEach((r) => {
      const type = (r.type || "other").toLowerCase();
      result[type] = (result[type] || 0) + 1;
    });
    return result;
  }, [records]);

  const filteredRecords = records.filter((record) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (record.title || "").toLowerCase().includes(q) ||
      (record.type || "").toLowerCase().includes(q) ||
      (record.findings || "").toLowerCase().includes(q) ||
      (record.doctor || "").toLowerCase().includes(q);
    const matchesType = currentFilter === "all" || (record.type || "").toLowerCase() === currentFilter;
    return matchesSearch && matchesType;
  });

  const handleFile = async (record, download) => {
    setActionError("");
    try {
      await openFile(record, download);
    } catch (err) {
      console.error("Could not open file:", err);
      setActionError("We couldn't open that file. Please try again.");
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete "${record.title}"? This cannot be undone.`)) return;
    setActionError("");
    try {
      const response = await fetch(`/api/patient/delete-record?recordId=${encodeURIComponent(record._id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete record");
      }
      setRecords((prev) => prev.filter((r) => r._id !== record._id));
      setSelected(null);
    } catch (err) {
      setActionError(err.message || "Failed to delete record");
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Patient"
          title="Medical Records"
          description="Reports and documents from your doctors, plus anything you add yourself."
          actions={
            <Link
              href="/dashboard/patient/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
            >
              <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
              Add record
            </Link>
          }
        />

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by record type">
              {RECORD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCurrentFilter(type)}
                  aria-pressed={currentFilter === type}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${
                    currentFilter === type
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {type}
                  {(counts[type] || 0) > 0 && (
                    <span className={`ml-1.5 text-xs ${currentFilter === type ? "text-white/80" : "text-slate-500"}`}>
                      {counts[type]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records..."
                aria-label="Search records"
                className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-600"
              />
            </div>
          </div>

          {actionError && (
            <p role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {actionError}
            </p>
          )}

          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
              <p className="mt-4 text-sm text-slate-500">Loading medical records...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <ExclamationCircleIcon className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
              <p className="mt-3 text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
              >
                Retry
              </button>
            </div>
          ) : filteredRecords.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const type = (record.type || "other").toLowerCase();
                return (
                  <li key={record._id}>
                    <button
                      type="button"
                      onClick={() => setSelected(record)}
                      className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                        <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{record.title}</span>
                        <span className="mt-0.5 block truncate text-sm text-slate-500">
                          {providerName(record)} · {formatDate(record.date)}
                        </span>
                      </span>
                      <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset sm:inline ${TYPE_STYLES[type] || TYPE_STYLES.other}`}>
                        {type}
                      </span>
                      <span className="hidden w-20 text-right text-xs font-medium text-slate-500 md:inline">
                        {statusLabel(record.status)}
                      </span>
                      <span className="text-sm font-semibold text-primary-600">View</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">No records found</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                {searchQuery || currentFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "You don't have any medical records yet. Add your first record to get started."}
              </p>
              <Link
                href="/dashboard/patient/upload"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
              >
                <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
                Add record
              </Link>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={selected.title}>
          <div className="menu-overlay-enter absolute inset-0 bg-slate-900/50" onClick={() => setSelected(null)} />
          <div className="menu-panel-enter relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <p className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${TYPE_STYLES[(selected.type || "other").toLowerCase()] || TYPE_STYLES.other}`}>
              {selected.type || "other"}
            </p>
            <h2 className="mt-3 pr-8 text-xl font-bold text-slate-900">{selected.title}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Provider</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{providerName(selected)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Date</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{formatDate(selected.date)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{statusLabel(selected.status)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Added by</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{selected.uploadedByDoctor ? "Your doctor" : "You"}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-900">Findings</h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                {selected.findings || "No findings were recorded."}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {hasUsableFile(selected) ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleFile(selected, false)}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
                  >
                    Open file
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFile(selected, true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                    Download
                  </button>
                </>
              ) : (
                <span className="text-sm text-slate-500">No file attached to this record.</span>
              )}
              {!selected.uploadedByDoctor && (
                <button
                  type="button"
                  onClick={() => handleDelete(selected)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
