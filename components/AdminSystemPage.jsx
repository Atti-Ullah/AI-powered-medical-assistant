"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowPathIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "./DashboardLayout";
import PageHeader from "./PageHeader";
import { adminRequest } from "../lib/admin-client";

// Shared shell for the admin pages that render from the live system status
// (analytics, alerts, security, settings). `children` receives the status.
export default function AdminSystemPage({ title, description, sections = null, children }) {
  const { user } = useAuth();
  const token = user?.token;
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await adminRequest(token, "/api/admin/system-status");
      setStatus(result.data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return null;

  return (
    <DashboardLayout>
      <PageHeader
        title={title}
        description={description}
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 text-slate-400 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            {loading ? "Refreshing" : "Refresh"}
          </button>
        }
      />

      {error && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <XCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {sections}

      {status ? (
        children(status)
      ) : (
        !error && (
          <div className="space-y-4" aria-label="Loading">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        )
      )}
    </DashboardLayout>
  );
}
