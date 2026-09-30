"use client";

import {
  UsersIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import AdminSystemPage from "../../../../components/AdminSystemPage";

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";

const ROLE_COLORS = { patient: "bg-violet-500", doctor: "bg-emerald-500", admin: "bg-rose-500" };
const STATUS_COLORS = { upcoming: "bg-blue-500", scheduled: "bg-blue-500", completed: "bg-emerald-500", cancelled: "bg-rose-500", rescheduled: "bg-amber-500" };

function Bar({ label, value, total, color }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 capitalize text-slate-700">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden="true" />
          {label}
        </span>
        <span className="text-slate-500">
          <span className="font-semibold text-slate-900">{value}</span> &middot; {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, caption, icon: Icon, tone }) {
  return (
    <div className={`${card} p-6`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <AdminSystemPage title="Analytics" description="Live platform usage figures">
      {(status) => {
        const { users, usersByType, appointments, appointmentsByStatus } = status.totals;
        const cancelled = appointmentsByStatus.cancelled || 0;
        return (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Total users" value={users} caption="All registered accounts" icon={UsersIcon} tone="bg-blue-50 text-blue-600 ring-blue-100" />
              <Stat label="Doctors" value={usersByType.doctor || 0} caption="Practitioners on the platform" icon={UserGroupIcon} tone="bg-emerald-50 text-emerald-600 ring-emerald-100" />
              <Stat label="Patients" value={usersByType.patient || 0} caption="Registered patients" icon={HeartIcon} tone="bg-violet-50 text-violet-600 ring-violet-100" />
              <Stat label="Appointments" value={appointments} caption={`${appointments - cancelled} active, ${cancelled} cancelled`} icon={CalendarDaysIcon} tone="bg-amber-50 text-amber-600 ring-amber-100" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className={`${card} p-6`} aria-label="Users by role">
                <h2 className="text-base font-semibold text-slate-900">Users by role</h2>
                <p className="mt-0.5 text-sm text-slate-500">How accounts are distributed across roles</p>
                <div className="mt-6 space-y-5">
                  {Object.entries(usersByType).map(([type, count]) => (
                    <Bar key={type} label={type} value={count} total={users} color={ROLE_COLORS[type] || "bg-slate-400"} />
                  ))}
                </div>
              </section>

              <section className={`${card} p-6`} aria-label="Appointments by status">
                <h2 className="text-base font-semibold text-slate-900">Appointments by status</h2>
                <p className="mt-0.5 text-sm text-slate-500">Where bookings currently stand</p>
                {Object.keys(appointmentsByStatus).length === 0 ? (
                  <p className="mt-8 rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No appointments have been booked yet.</p>
                ) : (
                  <div className="mt-6 space-y-5">
                    {Object.entries(appointmentsByStatus).map(([s, count]) => (
                      <Bar key={s} label={s} value={count} total={appointments} color={STATUS_COLORS[s] || "bg-slate-400"} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        );
      }}
    </AdminSystemPage>
  );
}
