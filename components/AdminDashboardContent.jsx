"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { adminRequest, buildAlerts, formatUptime } from "../lib/admin-client";
import {
  UsersIcon,
  UserGroupIcon,
  HeartIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  UserPlusIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const STAT_TILES = [
  { key: "totalUsers", name: "Total Users", caption: "All registered accounts", icon: UsersIcon, tone: "bg-blue-50 text-blue-600 ring-blue-100" },
  { key: "activeDoctors", name: "Doctors", caption: "Practitioners on the platform", icon: UserGroupIcon, tone: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  { key: "activePatients", name: "Patients", caption: "Registered patients", icon: HeartIcon, tone: "bg-violet-50 text-violet-600 ring-violet-100" },
  { key: "consultations", name: "Consultations", caption: "Booked, not cancelled", icon: CalendarDaysIcon, tone: "bg-amber-50 text-amber-600 ring-amber-100" },
];

const QUICK_ACTIONS = [
  { name: "User Management", text: "Create, edit and remove accounts", href: "/dashboard/admin/users", icon: UsersIcon, tone: "bg-blue-50 text-blue-600" },
  { name: "System Settings", text: "Review platform configuration", href: "/dashboard/admin/settings", icon: Cog6ToothIcon, tone: "bg-slate-100 text-slate-600" },
  { name: "Analytics", text: "Usage and appointment insights", href: "/dashboard/admin/analytics", icon: ChartBarSquareIcon, tone: "bg-emerald-50 text-emerald-600" },
  { name: "Security", text: "Authentication and access checks", href: "/dashboard/admin/security", icon: ShieldCheckIcon, tone: "bg-rose-50 text-rose-600" },
];

const TABS = [
  { name: "Recent Users", value: "users" },
  { name: "System Alerts", value: "alerts" },
  { name: "Reports", value: "reports" },
];

const ROLE_BADGES = {
  doctor: "bg-blue-50 text-blue-700 ring-blue-600/20",
  admin: "bg-rose-50 text-rose-700 ring-rose-600/20",
  patient: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

const ALERT_STYLES = {
  error: { icon: XCircleIcon, tile: "bg-rose-50 text-rose-600" },
  warning: { icon: ExclamationTriangleIcon, tile: "bg-amber-50 text-amber-600" },
  info: { icon: InformationCircleIcon, tile: "bg-blue-50 text-blue-600" },
};

const REPORTS = [
  { name: "User Activity Report", text: "Every registered account with role and join date, exported as CSV.", icon: ClipboardDocumentListIcon },
  { name: "System Health Report", text: "Database mode, security checks and platform totals, exported as JSON.", icon: DocumentChartBarIcon },
];

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";

export default function AdminDashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [showStatus, setShowStatus] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/admin/dashboard-stats", {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setStats(data);
        setRecentUsers(data.recentUsers || []);
        setLoadError("");

        // Live health data powers the alerts and the System Status dialog
        try {
          const statusResult = await adminRequest(user.token, "/api/admin/system-status");
          setSystemStatus(statusResult.data);
        } catch (statusError) {
          console.error("Error fetching system status:", statusError);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoadError("Could not load dashboard data. Please refresh to try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!user?.token) return;
    fetchDashboardData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [user?.token]);

  // System alerts come from the live health check
  const systemAlerts = buildAlerts(systemStatus);
  const firstName = user?.name ? user.name.split(" ")[0] : "Admin";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">Administration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor accounts, activity and platform health in one place.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setShowStatus(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <ServerStackIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            System Status
          </button>
          <Link
            href="/dashboard/admin/users?new=1"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
            Add New User
          </Link>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <XCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {loadError}
        </div>
      )}

      {/* Stats */}
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_TILES.map((tile) => (
          <div key={tile.key} className={`${card} p-6`}>
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-slate-500">{tile.name}</dt>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${tile.tone}`}>
                <tile.icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <dd className="mt-4">
              {isLoading && !stats ? (
                <div className="h-9 w-16 animate-pulse rounded-md bg-slate-100" />
              ) : (
                <p className="text-3xl font-bold tracking-tight text-slate-900">{stats?.[tile.key] ?? 0}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">{tile.caption}</p>
            </dd>
          </div>
        ))}
      </dl>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="mb-4 text-base font-semibold text-slate-900">Quick actions</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={`${card} group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.tone}`}>
                <action.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  {action.name}
                  <ArrowRightIcon className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600" aria-hidden="true" />
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">{action.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Activity panel */}
      <section className={card}>
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Dashboard sections" className="-mb-px flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                type="button"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`border-b-2 pb-3 text-sm font-medium transition ${
                  activeTab === tab.value
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {tab.name}
                {tab.value === "alerts" && systemAlerts.some((a) => a.severity !== "info") && (
                  <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-100 px-1.5 text-xs font-semibold text-rose-700">
                    {systemAlerts.filter((a) => a.severity !== "info").length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="pb-3 text-sm">
            {activeTab === "users" && (
              <Link href="/dashboard/admin/users" className="font-medium text-primary-600 hover:text-primary-700">
                View all users &rarr;
              </Link>
            )}
            {activeTab === "alerts" && (
              <Link href="/dashboard/admin/alerts" className="font-medium text-primary-600 hover:text-primary-700">
                View all alerts &rarr;
              </Link>
            )}
            {activeTab === "reports" && (
              <Link href="/dashboard/admin/reports" className="font-medium text-primary-600 hover:text-primary-700">
                Open reports &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* Recent users */}
        {activeTab === "users" && (
          <div className="overflow-x-auto">
            {isLoading && recentUsers.length === 0 ? (
              <div className="space-y-4 p-6">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-6 py-3">User</th>
                    <th scope="col" className="px-6 py-3">Role</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Joined</th>
                    <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentUsers.length > 0 ? (
                    recentUsers.map((u) => (
                      <tr key={u.id} className="transition hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                              {u.name?.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${ROLE_BADGES[u.type] || ROLE_BADGES.patient}`}>
                            {u.type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <span className={`h-2 w-2 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                            <span className="capitalize">{u.status}</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{u.date}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          <Link href={`/dashboard/admin/users/${u.id}`} className="mr-4 font-medium text-primary-600 hover:text-primary-700">
                            View
                          </Link>
                          <Link href={`/dashboard/admin/users/${u.id}`} className="font-medium text-slate-500 hover:text-slate-800">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm text-slate-500">
                        No recent users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* System alerts */}
        {activeTab === "alerts" && (
          <ul className="divide-y divide-slate-100">
            {systemAlerts.length === 0 ? (
              <li className="px-6 py-12 text-center text-sm text-slate-500">Checking system health...</li>
            ) : (
              systemAlerts.map((alert) => {
                const style = ALERT_STYLES[alert.severity] || ALERT_STYLES.info;
                return (
                  <li key={alert.id} className="flex items-start gap-4 px-6 py-5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.tile}`}>
                      <style.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                        <p className="shrink-0 text-xs text-slate-400">{alert.date}</p>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{alert.description}</p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            {REPORTS.map((report) => (
              <div key={report.name} className="flex flex-col rounded-xl border border-slate-200 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <report.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">{report.name}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{report.text}</p>
                <Link
                  href="/dashboard/admin/reports"
                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  Generate Report
                  <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* System status dialog */}
      {showStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="System status"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <ServerStackIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">System Status</h3>
                  <p className="text-xs text-slate-500">Latest health check</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatus(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {systemStatus ? (
              <dl className="mt-5 divide-y divide-slate-100 text-sm">
                {[
                  ["Database", systemStatus.database.connected ? "Connected (MongoDB)" : "Unavailable - using local file store"],
                  ["Environment", systemStatus.server.environment],
                  ["Node.js", systemStatus.server.nodeVersion],
                  ["Uptime", formatUptime(systemStatus.server.uptimeSeconds)],
                  ["Users", systemStatus.totals.users],
                  ["Appointments", systemStatus.totals.appointments],
                  ["Checked", new Date(systemStatus.checkedAt).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-5 text-sm text-slate-500">Status is not available yet.</p>
            )}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStatus(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
