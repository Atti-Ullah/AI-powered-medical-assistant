"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "./DashboardLayout";
import { adminRequest } from "../lib/admin-client";

// Shared shell for the admin pages that render from the live system status
// (analytics, alerts, security, settings). `children` receives the status.
export default function AdminSystemPage({ title, description, children }) {
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {status ? children(status) : !error && <p className="text-gray-500">Loading...</p>}
    </DashboardLayout>
  );
}
