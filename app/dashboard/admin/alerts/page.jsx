"use client";

import AdminSystemPage from "../../../../components/AdminSystemPage";
import { buildAlerts } from "../../../../lib/admin-client";

const STYLES = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function AdminAlertsPage() {
  return (
    <AdminSystemPage title="System Alerts" description="Issues detected in the latest health check">
      {(status) => (
        <ul className="space-y-3">
          {buildAlerts(status).map((alert) => (
            <li key={alert.id} className={`rounded-lg border px-4 py-4 ${STYLES[alert.severity]}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{alert.title}</h2>
                <span className="text-xs uppercase tracking-wide">{alert.severity}</span>
              </div>
              <p className="mt-1 text-sm">{alert.description}</p>
              <p className="mt-2 text-xs opacity-75">Checked {alert.date}</p>
            </li>
          ))}
        </ul>
      )}
    </AdminSystemPage>
  );
}
