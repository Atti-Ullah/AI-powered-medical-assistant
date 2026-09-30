"use client";

import { useState } from "react";
import {
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../contexts/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
import PageHeader from "../../../../components/PageHeader";
import { adminRequest, downloadFile, toCsv } from "../../../../lib/admin-client";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const token = user?.token;
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const stamp = () => new Date().toISOString().split("T")[0];

  const run = async (key, job) => {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      setMessage(await job());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const userReport = () =>
    run("users", async () => {
      const result = await adminRequest(token, "/api/admin/users");
      const csv = toCsv(result.data, [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "type", label: "Role" },
        { key: "phone", label: "Phone" },
        { key: "date", label: "Joined" },
      ]);
      downloadFile(`users-report-${stamp()}.csv`, csv, "text/csv");
      return `User report downloaded (${result.data.length} accounts).`;
    });

  const healthReport = () =>
    run("health", async () => {
      const result = await adminRequest(token, "/api/admin/system-status");
      downloadFile(`system-health-${stamp()}.json`, JSON.stringify(result.data, null, 2), "application/json");
      return "System health report downloaded.";
    });

  if (!user) return null;

  const reports = [
    {
      key: "users",
      title: "User Activity Report",
      text: "Every registered account with role, phone and join date.",
      format: "CSV",
      icon: ClipboardDocumentListIcon,
      action: userReport,
    },
    {
      key: "health",
      title: "System Health Report",
      text: "Database mode, security checks and platform totals.",
      format: "JSON",
      icon: DocumentChartBarIcon,
      action: healthReport,
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Reports" description="Generate and download platform reports" />

      {message && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {message}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <XCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <div key={report.key} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <report.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{report.format}</span>
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">{report.title}</h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{report.text}</p>
            <button
              type="button"
              onClick={report.action}
              disabled={!!busy}
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              {busy === report.key ? "Generating..." : "Generate Report"}
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
