"use client";

import Link from "next/link";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import PageHeader from "./PageHeader";
import {
  card,
  primaryButton,
  secondaryButton,
  StatTile,
  RiskBadge,
  Avatar,
  EmptyState,
  InlineAlert,
  Skeleton,
  formatDate,
  relativeDay,
  useApiData,
} from "./DoctorUI";

const QUICK_ACTIONS = [
  { name: "My patients", text: "Browse and search your patients", href: "/dashboard/doctor/patients", icon: UserGroupIcon, tone: "bg-blue-50 text-blue-600" },
  { name: "Consultations", text: "Complete, reschedule or cancel visits", href: "/dashboard/doctor/consultations", icon: ChatBubbleLeftRightIcon, tone: "bg-emerald-50 text-emerald-600" },
  { name: "Upload report", text: "Add a lab or imaging report", href: "/dashboard/doctor/upload-report", icon: DocumentArrowUpIcon, tone: "bg-amber-50 text-amber-600" },
  { name: "AI analysis", text: "Vitals screening across patients", href: "/dashboard/doctor/ai-analysis", icon: SparklesIcon, tone: "bg-violet-50 text-violet-600" },
];

function AppointmentRow({ a }) {
  return (
    <li>
      <Link href={`/dashboard/doctor/patients/${a.patientId}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6">
        <div className="w-16 shrink-0 text-center sm:w-20">
          <p className="text-sm font-semibold text-slate-900">{a.time}</p>
          <p className="text-xs text-slate-500">{relativeDay(a.date) === "Today" ? "Today" : formatDate(a.date).replace(/, \d{4}$/, "")}</p>
        </div>
        <Avatar name={a.patientName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{a.patientName}</p>
          <p className="truncate text-xs text-slate-500">
            {[a.patientAge ? `${a.patientAge} yrs` : null, a.reason].filter(Boolean).join(" · ") || "No reason given"}
          </p>
        </div>
        {(a.risk === "high" || a.risk === "medium") && <RiskBadge risk={a.risk} />}
      </Link>
    </li>
  );
}

export default function DoctorDashboardContent() {
  const { user } = useAuth();
  const { data, loading, error } = useApiData("/api/doctor/overview");
  const lastName = user?.name ? user.name.split(" ").slice(-1)[0] : "";

  const stats = data?.stats;
  const tiles = [
    { label: "Patients", value: stats?.patients, caption: "Under your care", icon: UserGroupIcon, tone: "bg-blue-50 text-blue-600 ring-blue-100" },
    { label: "Today", value: stats?.today, caption: "Visits scheduled today", icon: ClockIcon, tone: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
    { label: "Upcoming", value: stats?.upcoming, caption: "From today onwards", icon: CalendarDaysIcon, tone: "bg-violet-50 text-violet-600 ring-violet-100" },
    { label: "Completed", value: stats?.completedThisMonth, caption: "Visits this month", icon: CheckBadgeIcon, tone: "bg-amber-50 text-amber-600 ring-amber-100" },
    { label: "Need attention", value: stats?.needAttention, caption: "Flagged by vitals screening", icon: ExclamationTriangleIcon, tone: "bg-rose-50 text-rose-600 ring-rose-100" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Doctor workspace"
        title={lastName ? `Good day, Dr. ${lastName}` : "Welcome back"}
        description="Your schedule, patients and anything that needs your attention."
        actions={
          <>
            <Link href="/dashboard/doctor/consultations" className={secondaryButton}>
              <CalendarDaysIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
              Consultations
            </Link>
            <Link href="/dashboard/doctor/upload-report" className={primaryButton}>
              <DocumentArrowUpIcon className="h-5 w-5" aria-hidden="true" />
              Upload report
            </Link>
          </>
        }
      />

      {error && <InlineAlert>{error}</InlineAlert>}

      <dl className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5 [&>:last-child:nth-child(odd)]:col-span-2 lg:[&>:last-child:nth-child(odd)]:col-span-1">
        {tiles.map((tile) => (
          <StatTile key={tile.label} {...tile} value={tile.value ?? 0} loading={loading && !data} />
        ))}
      </dl>

      {data?.overdue?.length > 0 && (
        <div role="status" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {data.overdue.length} past {data.overdue.length === 1 ? "visit is" : "visits are"} still open
              </p>
              <p className="mt-0.5 text-sm text-amber-800">
                {data.overdue.slice(0, 2).map((a) => `${a.patientName} (${formatDate(a.date)})`).join(", ")}
                {data.overdue.length > 2 ? ` and ${data.overdue.length - 2} more` : ""}. Mark them completed or cancelled.
              </p>
            </div>
          </div>
          <Link href="/dashboard/doctor/consultations?tab=overdue" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700">
            Review now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className={card} aria-labelledby="today-heading">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 id="today-heading" className="text-base font-semibold text-slate-900">Today&apos;s schedule</h2>
                <p className="text-xs text-slate-500">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              </div>
              <Link href="/dashboard/doctor/consultations?tab=today" className="text-sm font-medium text-primary-600 hover:text-primary-700">Manage</Link>
            </div>
            {loading && !data ? (
              <div className="space-y-3 p-5"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
            ) : data?.today?.length ? (
              <ul className="divide-y divide-slate-100">{data.today.map((a) => <AppointmentRow key={a.id} a={a} />)}</ul>
            ) : (
              <EmptyState icon={CalendarDaysIcon} title="Nothing scheduled for today" text="Bookings made by your patients for today will appear here." />
            )}
          </section>

          <section className={card} aria-labelledby="upcoming-heading">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 id="upcoming-heading" className="text-base font-semibold text-slate-900">Coming up</h2>
              <Link href="/dashboard/doctor/consultations?tab=upcoming" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
            </div>
            {loading && !data ? (
              <div className="space-y-3 p-5"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
            ) : data?.upcoming?.length ? (
              <ul className="divide-y divide-slate-100">{data.upcoming.map((a) => <AppointmentRow key={a.id} a={a} />)}</ul>
            ) : (
              <EmptyState icon={CalendarDaysIcon} title="No upcoming visits" text="Future bookings will be listed here as patients make them." />
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className={card} aria-labelledby="attention-heading">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="attention-heading" className="text-base font-semibold text-slate-900">Needs attention</h2>
              <Link href="/dashboard/doctor/ai-analysis" className="text-sm font-medium text-primary-600 hover:text-primary-700">Analysis</Link>
            </div>
            {loading && !data ? (
              <div className="space-y-3 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            ) : data?.attention?.length ? (
              <ul className="divide-y divide-slate-100">
                {data.attention.map((p) => (
                  <li key={p.id}>
                    <Link href={`/dashboard/doctor/patients/${p.id}`} className="block px-5 py-3.5 transition hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                        <RiskBadge risk={p.risk} />
                      </div>
                      {p.topFlag && <p className="mt-1 truncate text-xs text-slate-500">{p.topFlag.title}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CheckBadgeIcon} title="All clear" text="No patient has readings that need review." />
            )}
          </section>

          <section className={card} aria-labelledby="recent-heading">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="recent-heading" className="text-base font-semibold text-slate-900">Recent patients</h2>
              <Link href="/dashboard/doctor/patients" className="text-sm font-medium text-primary-600 hover:text-primary-700">All</Link>
            </div>
            {loading && !data ? (
              <div className="space-y-3 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            ) : data?.recentPatients?.length ? (
              <ul className="divide-y divide-slate-100">
                {data.recentPatients.map((p) => (
                  <li key={p.id}>
                    <Link href={`/dashboard/doctor/patients/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50">
                      <Avatar name={p.name} size="h-9 w-9" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {p.lastVisit ? `Last visit ${formatDate(p.lastVisit)}` : p.nextAppointment ? `Next ${formatDate(p.nextAppointment.date)}` : "No visits yet"}
                        </p>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={UserGroupIcon} title="No patients yet" text="Patients appear once they book an appointment with you." />
            )}
          </section>
        </div>
      </div>

      <section aria-labelledby="quick-heading">
        <h2 id="quick-heading" className="mb-4 text-base font-semibold text-slate-900">Quick actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.name} href={action.href} className={`${card} group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md`}>
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
        <p className="mt-4 text-xs text-slate-500">
          <UserCircleIcon className="mr-1 inline h-4 w-4 align-text-bottom" aria-hidden="true" />
          Keep your <Link href="/dashboard/doctor/profile" className="font-medium text-primary-600 hover:text-primary-700">profile</Link> up to date: your fee, hospital and available slots are what patients see when booking.
        </p>
      </section>
    </div>
  );
}
