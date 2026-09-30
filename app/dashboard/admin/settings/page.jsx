"use client";

import AdminSystemPage from "../../../../components/AdminSystemPage";
import { formatUptime } from "../../../../lib/admin-client";

export default function AdminSettingsPage() {
  return (
    <AdminSystemPage title="System Settings" description="Current platform configuration (set through environment variables)">
      {(status) => {
        const rows = [
          ["Environment", status.server.environment],
          ["Node.js version", status.server.nodeVersion],
          ["Server uptime", formatUptime(status.server.uptimeSeconds)],
          ["Data store", status.database.connected ? "MongoDB" : "Local file store (MongoDB unreachable)"],
          ["Site URL", status.config.siteUrl],
          ["AI assistant (Gemini)", status.config.aiAssistantConfigured ? "Configured" : "Not configured"],
          ["Session lifetime", status.security.tokenLifetime],
        ];
        return (
          <>
            <dl className="divide-y divide-gray-200 rounded-lg bg-white shadow">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between px-6 py-4 text-sm">
                  <dt className="text-gray-600">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-gray-500">
              These values are read-only. Change them in <code>.env.local</code> and restart the server.
            </p>
          </>
        );
      }}
    </AdminSystemPage>
  );
}
