"use client";

import { ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import AdminSystemPage from "../../../../components/AdminSystemPage";
import { buildAlerts } from "../../../../lib/admin-client";

const STYLES = {
  error: { icon: XCircleIcon, tile: "bg-rose-50 text-rose-600", badge: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  warning: { icon: ExclamationTriangleIcon, tile: "bg-amber-50 text-amber-600", badge: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  info: { icon: InformationCircleIcon, tile: "bg-blue-50 text-blue-600", badge: "bg-blue-50 text-blue-700 ring-blue-600/20" },
};

export default function AdminAlertsPage() {
  return (
    <AdminSystemPage title="System Alerts" description="Issues detected in the latest health check">
      {(status) => {
        const alerts = buildAlerts(status);
        return (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {alerts.map((alert) => {
              const style = STYLES[alert.severity] || STYLES.info;
              return (
                <li key={alert.id} className="flex items-start gap-4 px-6 py-5">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.tile}`}>
                    <style.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold text-slate-900">{alert.title}</h2>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${style.badge}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{alert.description}</p>
                    <p className="mt-2 text-xs text-slate-400">Checked {alert.date}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        );
      }}
    </AdminSystemPage>
  );
}
