"use client";

import { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
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
      text: "All registered accounts with role and join date (CSV).",
      action: userReport,
    },
    {
      key: "health",
      title: "System Health Report",
      text: "Database mode, security checks and platform totals (JSON).",
      action: healthReport,
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">Generate and download platform reports</p>

      {message && (
        <div role="status" className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <div key={report.key} className="rounded-lg border border-gray-300 bg-white p-6">
            <h2 className="text-base font-medium text-gray-900">{report.title}</h2>
            <p className="mb-4 mt-1 text-sm text-gray-500">{report.text}</p>
            <button
              type="button"
              onClick={report.action}
              disabled={!!busy}
              className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {busy === report.key ? "Generating..." : "Generate Report"}
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
