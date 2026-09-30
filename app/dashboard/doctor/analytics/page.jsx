"use client";

import {
  UserGroupIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../../../../components/DashboardLayout";
import PageHeader from "../../../../components/PageHeader";
import {
  card,
  StatTile,
  InlineAlert,
  Skeleton,
  EmptyState,
  RISK_STYLES,
  useApiData,
} from "../../../../components/DoctorUI";

const STATUS_COLORS = { upcoming: "bg-blue-500", completed: "bg-emerald-500", cancelled: "bg-rose-500" };
const GENDER_COLORS = ["bg-violet-500", "bg-sky-500", "bg-amber-500", "bg-slate-400"];

function Bar({ label, value, total, color }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 capitalize text-slate-700">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden="true" />
          {label}
        </span>
        <span className="text-slate-500"><span className="font-semibold text-slate-900">{value}</span> &middot; {percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Panel({ title, text, children }) {
  return (
    <section className={`${card} p-5 sm:p-6`} aria-label={title}>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {text && <p className="mt-0.5 text-sm text-slate-500">{text}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function DoctorAnalyticsPage() {
  const { data, loading, error } = useApiData("/api/doctor/analytics");
  const t = data?.totals;
  const noData = data && t.appointments === 0;
  const maxMonth = Math.max(1, ...(data?.months || []).map((m) => m.total));
  const maxDay = Math.max(1, ...(data?.weekdays || []).map((d) => d.count));
  const maxReason = Math.max(1, ...(data?.topReasons || []).map((r) => r.count));
  const genderTotal = Object.values(data?.gender || {}).reduce((a, b) => a + b, 0);
  const riskTotal = Object.values(data?.risk || {}).reduce((a, b) => a + b, 0);

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Doctor workspace" title="Analytics" description="How your practice is doing: visits, outcomes and your patient mix." />

      {error && <div className="mb-6"><InlineAlert>{error}</InlineAlert></div>}

      <dl className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4">
        <StatTile label="Patients" value={t?.patients ?? 0} caption="Total under your care" icon={UserGroupIcon} tone="bg-blue-50 text-blue-600 ring-blue-100" loading={loading && !data} />
        <StatTile label="Appointments" value={t?.appointments ?? 0} caption={t ? `${t.upcoming} upcoming` : ""} icon={CalendarDaysIcon} tone="bg-violet-50 text-violet-600 ring-violet-100" loading={loading && !data} />
        <StatTile label="Completion rate" value={t?.completionRate == null ? "-" : `${t.completionRate}%`} caption="Completed of finished visits" icon={CheckBadgeIcon} tone="bg-emerald-50 text-emerald-600 ring-emerald-100" loading={loading && !data} />
        <StatTile label="New patients" value={t?.newPatientsThisMonth ?? 0} caption="First seen this month" icon={UserPlusIcon} tone="bg-amber-50 text-amber-600 ring-amber-100" loading={loading && !data} />
      </dl>

      {loading && !data ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      ) : noData ? (
        <div className={`${card} mt-6`}>
          <EmptyState icon={CalendarDaysIcon} title="No appointments yet" text="Charts will fill in as patients book visits with you." />
        </div>
      ) : data ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Visits per month" text="Last six months, by outcome">
            <div className="flex h-44 items-end gap-2 sm:gap-4" role="img" aria-label={`Visits per month: ${data.months.map((m) => `${m.label} ${m.total}`).join(", ")}`}>
              {data.months.map((m) => {
                const height = (m.total / maxMonth) * 100;
                const done = m.total ? (m.completed / m.total) * 100 : 0;
                const cancelled = m.total ? (m.cancelled / m.total) * 100 : 0;
                return (
                  <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-xs font-semibold text-slate-700">{m.total || ""}</span>
                    <div className="flex w-full max-w-[3rem] flex-col-reverse overflow-hidden rounded-t-md bg-blue-500 transition-all duration-500" style={{ height: `${height}%`, minHeight: m.total ? "6px" : "2px", backgroundColor: m.total ? undefined : "#e2e8f0" }}>
                      <div className="bg-emerald-500" style={{ height: `${done}%` }} />
                      <div className="bg-rose-500" style={{ height: `${cancelled}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{m.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Completed</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />Upcoming / open</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Cancelled</span>
            </div>
          </Panel>

          <Panel title="Appointments by status" text="Where your bookings currently stand">
            <div className="space-y-5">
              {Object.entries(data.byStatus).map(([status, count]) => (
                <Bar key={status} label={status} value={count} total={t.appointments} color={STATUS_COLORS[status] || "bg-slate-400"} />
              ))}
            </div>
          </Panel>

          <Panel title="Busiest days" text="Visits by weekday">
            <div className="flex h-36 items-end gap-2 sm:gap-3" role="img" aria-label={`Visits by weekday: ${data.weekdays.map((d) => `${d.label} ${d.count}`).join(", ")}`}>
              {data.weekdays.map((d) => (
                <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-xs font-semibold text-slate-700">{d.count || ""}</span>
                  <div className="w-full max-w-[2.5rem] rounded-t-md bg-primary-500 transition-all duration-500" style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? "6px" : "2px", backgroundColor: d.count ? undefined : "#e2e8f0" }} />
                  <span className="text-xs text-slate-500">{d.label}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Top reasons for visits" text="What patients book for most often">
            {data.topReasons.length ? (
              <div className="space-y-4">
                {data.topReasons.map((r) => (
                  <div key={r.reason}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="truncate pr-3 text-slate-700">{r.reason}</span>
                      <span className="font-semibold text-slate-900">{r.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${(r.count / maxReason) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No reasons recorded yet.</p>
            )}
          </Panel>

          <Panel title="Patients by gender">
            <div className="space-y-5">
              {Object.entries(data.gender).map(([g, count], i) => (
                <Bar key={g} label={g} value={count} total={genderTotal} color={GENDER_COLORS[i % GENDER_COLORS.length]} />
              ))}
            </div>
          </Panel>

          <Panel title="Vitals screening" text="Current priority across your patients">
            <div className="space-y-5">
              {["high", "medium", "low", "none", "unknown"].map((r) => (
                <Bar key={r} label={RISK_STYLES[r].label} value={data.risk[r] || 0} total={riskTotal} color={RISK_STYLES[r].bar} />
              ))}
            </div>
          </Panel>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
