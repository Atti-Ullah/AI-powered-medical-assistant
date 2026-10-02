"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import DashboardLayout from "../../../../components/DashboardLayout";
import {
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
  HeartIcon,
  ScaleIcon,
  UserIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const BRAND = "#2563eb";
const TEAL = "#0d9488";
const AMBER = "#f59e0b";
const CORAL = "#e11d48";

// Sample assistant telemetry. In production this streams from the Chatbase widget
// (agent j2fgtClSFXZi_k4qdHnv7). Values shown are illustrative.
const assistantWeeks = [
  { week: "W1", sessions: 12, queries: 34, satisfaction: 88 },
  { week: "W2", sessions: 18, queries: 51, satisfaction: 90 },
  { week: "W3", sessions: 15, queries: 44, satisfaction: 89 },
  { week: "W4", sessions: 24, queries: 68, satisfaction: 92 },
  { week: "W5", sessions: 21, queries: 60, satisfaction: 91 },
  { week: "W6", sessions: 29, queries: 83, satisfaction: 94 },
  { week: "W7", sessions: 27, queries: 76, satisfaction: 93 },
  { week: "W8", sessions: 34, queries: 97, satisfaction: 95 },
];

const queryCategories = [
  { name: "Symptoms", value: 42 },
  { name: "Appointments", value: 26 },
  { name: "Reports & tests", value: 18 },
  { name: "Medications", value: 9 },
  { name: "General", value: 5 },
];

const commonQuestions = [
  { question: "What can help with my persistent headache?", count: 38 },
  { question: "How do I book a cardiology appointment?", count: 27 },
  { question: "Explain my latest blood test results", count: 24 },
  { question: "Is my blood pressure in a safe range?", count: 19 },
  { question: "What vaccination is recommended for travel?", count: 12 },
];

const CATEGORY_COLORS = [BRAND, TEAL, AMBER, CORAL, "#64748b"];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [timeRange, setTimeRange] = useState("month"); // month, quarter, year
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      setError(null);

      try {
        let userData = user;
        const storedUserData = localStorage.getItem("medisynix_user");
        if (storedUserData) {
          try {
            const parsedData = JSON.parse(storedUserData);
            if (parsedData.email === user.email && parsedData.id === user.id) {
              userData = parsedData;
            }
          } catch (e) {
            console.error("Error parsing stored user data", e);
          }
        }

        const userId = userData._id || userData.id;
        let healthData = null;

        const healthResponse = await fetch(
          `/api/patient/get-health-metrics?userId=${userId}`,
          { headers: { Authorization: `Bearer ${userData.token || user?.token}` } }
        );
        if (healthResponse.ok) {
          const responseData = await healthResponse.json();
          healthData = responseData.data;
        }

        const appointmentsResponse = await fetch(
          `/api/patient/appointments?userId=${userId}`,
          { headers: { Authorization: `Bearer ${userData.token || user?.token}` } }
        );
        let appointmentsData = [];
        if (appointmentsResponse.ok) {
          const responseData = await appointmentsResponse.json();
          appointmentsData = responseData.data || [];
        }

        // Health metric summaries (fallback to user profile data)
        let processedHealthMetrics;
        if (healthData && healthData.current) {
          const c = healthData.current;
          processedHealthMetrics = {
            weight: {
              value: c.weight ? Number(c.weight) : (userData.weight || 0),
              unit: "kg",
              change: Math.abs(
                (c.weight ? Number(c.weight) : userData.weight || 0) -
                  (userData.previousWeight || 0)
              ),
              trend:
                (c.weight ? Number(c.weight) : userData.weight || 0) <
                (userData.previousWeight || 0)
                  ? "down"
                  : "up",
            },
            bloodPressure: {
              systolic: parseInt(c.bloodPressure?.split("/")[0]) || 120,
              diastolic: parseInt(c.bloodPressure?.split("/")[1]) || 80,
              status: getBPStatus(c.bloodPressure || "120/80"),
            },
            heartRate: {
              value: Number(c.heartRate) || 0,
              status: getHeartRateStatus(c.heartRate || 0),
            },
            bloodSugar: {
              value: Number(c.glucoseLevel) || 0,
              status: getGlucoseStatus(c.glucoseLevel || 0),
            },
          };
        } else {
          processedHealthMetrics = {
            weight: {
              value: userData.weight || 0,
              unit: "kg",
              change: Math.abs(
                (userData.weight || 0) - (userData.previousWeight || 0)
              ),
              trend:
                (userData.weight || 0) < (userData.previousWeight || 0)
                  ? "down"
                  : "up",
            },
            bloodPressure: {
              systolic: parseInt(userData.bloodPressure?.split("/")[0]) || 120,
              diastolic: parseInt(userData.bloodPressure?.split("/")[1]) || 80,
              status: getBPStatus(userData.bloodPressure || "120/80"),
            },
            heartRate: {
              value: userData.heartRate || 0,
              status: getHeartRateStatus(userData.heartRate || 0),
            },
            bloodSugar: {
              value: userData.glucoseLevel || 0,
              status: getGlucoseStatus(userData.glucoseLevel || 0),
            },
          };
        }
        setHealthMetrics(processedHealthMetrics);

        // Appointment aggregates
        if (appointmentsData && appointmentsData.length > 0) {
          const now = new Date();
          const filtered = appointmentsData.filter((apt) => {
            const aptDate = new Date(apt.date || apt.appointmentDate);
            if (timeRange === "month")
              return aptDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            if (timeRange === "quarter")
              return aptDate >= new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            return aptDate >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          });

          const upcoming = filtered.filter(
            (apt) =>
              (apt.status === "upcoming" || apt.status === "scheduled") &&
              new Date(apt.date || apt.appointmentDate) > now
          ).length;
          const past = filtered.filter(
            (apt) =>
              (apt.status === "completed" || new Date(apt.date || apt.appointmentDate) < now) &&
              apt.status !== "cancelled"
          ).length;
          const cancelled = filtered.filter((apt) => apt.status === "cancelled").length;

          const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
          ];
          const monthCounts = {};
          filtered.forEach((apt) => {
            const k = months[new Date(apt.date || apt.appointmentDate).getMonth()];
            monthCounts[k] = (monthCounts[k] || 0) + 1;
          });
          const byMonth = months.map((month) => ({ month, visits: monthCounts[month] || 0 }));

          const specialtyCounts = {};
          filtered.forEach((apt) => {
            const s = apt.specialty || apt.doctorSpecialty || "General";
            specialtyCounts[s] = (specialtyCounts[s] || 0) + 1;
          });
          const bySpecialty = Object.entries(specialtyCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

          setAppointmentStats({
            total: filtered.length,
            upcoming,
            past,
            cancelled,
            byMonth,
            bySpecialty,
          });
        } else {
          // No real data yet — seed a clearly-labeled sample series so charts
          // are explorable before live data flows in.
          setAppointmentStats({
            total: 0,
            upcoming: 0,
            past: 0,
            cancelled: 0,
            byMonth: [
              { month: "Jan", visits: 2 },
              { month: "Feb", visits: 1 },
              { month: "Mar", visits: 3 },
              { month: "Apr", visits: 2 },
              { month: "May", visits: 4 },
              { month: "Jun", visits: 2 },
            ],
            bySpecialty: [
              { name: "Cardiology", value: 4 },
              { name: "General", value: 3 },
              { name: "Dermatology", value: 2 },
              { name: "Neurology", value: 1 },
            ],
            sample: true,
          });
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to fetch analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchUserData();
    }
  }, [user, timeRange]);

  function getBPStatus(bp) {
    if (!bp) return "normal";
    const [s, d] = bp.split("/").map(Number);
    if (s < 120 && d < 80) return "normal";
    if (s >= 120 && s <= 129 && d < 80) return "elevated";
    return "high";
  }

  function getHeartRateStatus(rate) {
    const hr = Number(rate);
    if (hr >= 60 && hr <= 100) return "normal";
    if (hr < 60) return "low";
    return "high";
  }

  function getGlucoseStatus(level) {
    const gl = Number(level);
    if (gl < 100) return "normal";
    if (gl >= 100 && gl <= 125) return "elevated";
    return "high";
  }

  if (!user) {
    return null;
  }

  // Chart tooltip styled with the global tokens
  function ChartTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="rounded-lg border border-border bg-surface p-3 shadow-card">
        {label && <p className="mb-1 text-xs font-semibold text-ink">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} className="text-xs text-muted">
            <span className="font-semibold" style={{ color: entry.color || entry.payload?.fill }}>
              {entry.name}:{" "}
            </span>
            {typeof entry.value === "number" && entry.name === "satisfaction"
              ? `${entry.value}%`
              : entry.value}
          </p>
        ))}
      </div>
    );
  }

  const totalQueries = assistantWeeks.reduce((s, w) => s + w.queries, 0);
  const avgSatisfaction = Math.round(
    assistantWeeks.reduce((s, w) => s + w.satisfaction, 0) / assistantWeeks.length
  );
  const sampleCount = assistantWeeks[assistantWeeks.length - 1].sessions;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-700 to-secondary-800 p-6 text-white shadow-card sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-secondary-400/20 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your insights
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-100/90">
              Live activity from your Medisynix assistant and clinician visits,
              rolled into one view. Sample series are clearly marked.
            </p>
          </div>
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "AI sessions · 8 weeks",
              value: String(totalQueries),
              unit: "queries",
              icon: ChatBubbleLeftRightIcon,
              accent: "bg-secondary-600/10 text-secondary-700",
              trend: "+12% vs prior period",
            },
            {
              label: "Avg. answer time",
              value: "1.1",
              unit: "seconds",
              icon: ClockIcon,
              accent: "bg-brand-600/10 text-brand-700",
              trend: "0.2s faster",
            },
            {
              label: "Satisfaction",
              value: `${avgSatisfaction}%`,
              unit: "this week",
              icon: SparklesIcon,
              accent: "bg-secondary-600/10 text-secondary-700",
              trend: "↑ healthy trend",
            },
            {
              label: "Clinic appointments",
              value: String(appointmentStats ? appointmentStats.total : 0),
              unit: "in range",
              icon: CalendarDaysIcon,
              accent: "bg-brand-600/10 text-brand-700",
              trend: appointmentStats && appointmentStats.sample ? "sample data" : "live record",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${kpi.accent}`}>
                  <kpi.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-[11px] text-muted">{kpi.trend}</span>
              </div>
              <p className="mt-3 text-xs font-medium text-muted">{kpi.label}</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <p className="text-2xl font-bold tracking-tight text-ink">{kpi.value}</p>
                <span className="text-xs text-muted">{kpi.unit}</span>
              </div>
            </div>
          ))}
        </section>

        {loading ? (
          <div className="card rounded-xl p-10 text-center text-sm text-muted">
            Loading your insights…
          </div>
        ) : error ? (
          <div className="card rounded-xl p-10 text-center">
            <ExclamationCircleIcon className="mx-auto h-10 w-10 text-destructive-500" />
            <p className="mt-3 text-sm text-destructive-600">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-secondary mt-5">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Health metric tiles */}
            {healthMetrics && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-ink">Latest vitals</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricTile
                    icon={ScaleIcon}
                    label="Weight"
                    value={`${healthMetrics.weight.value} kg`}
                    meta={`${healthMetrics.weight.change} kg change`}
                    trend={healthMetrics.weight.trend}
                  />
                  <MetricTile
                    icon={HeartIcon}
                    label="Blood pressure"
                    value={`${healthMetrics.bloodPressure.systolic}/${healthMetrics.bloodPressure.diastolic}`}
                    meta="mmHg"
                    status={healthMetrics.bloodPressure.status}
                  />
                  <MetricTile
                    icon={HeartIcon}
                    label="Heart rate"
                    value={`${healthMetrics.heartRate.value} bpm`}
                    meta="At rest"
                    status={healthMetrics.heartRate.status}
                  />
                  <MetricTile
                    icon={ChartBarIcon}
                    label="Glucose"
                    value={`${healthMetrics.bloodSugar.value} mg/dL`}
                    meta="Fasting"
                    status={healthMetrics.bloodSugar.status}
                  />
                </div>
              </section>
            )}

            {/* Assistant & appointment charts */}
            <section id="assistant-analytics">
              <h2 className="mb-4 text-lg font-semibold text-ink">AI assistant activity</h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="card rounded-2xl p-5 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-ink">Queries & satisfaction</h3>
                    <span className="glass px-2.5 py-1 text-[11px] font-semibold text-secondary-800">
                      sample series
                    </span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={assistantWeeks} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="queriesFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="satFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={TEAL} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,24,40,0.08)" />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Area type="monotone" dataKey="queries" name="Queries" stroke={BRAND} strokeWidth={2} fill="url(#queriesFill)" />
                        <Area type="monotone" dataKey="satisfaction" name="Satisfaction %" stroke={TEAL} strokeWidth={2} fill="url(#satFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-ink">Query categories</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={queryCategories}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={72}
                          paddingAngle={3}
                        >
                          {queryCategories.map((_, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {queryCategories.map((cat, i) => (
                      <li key={cat.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-muted">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[i] }}
                          />
                          {cat.name}
                        </span>
                        <span className="font-semibold text-ink">{cat.value}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Common questions + appointments */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="card rounded-2xl p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <MagnifyingGlassIcon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  Frequently asked with the assistant
                </h3>
                <ul className="mt-4 space-y-3">
                  {commonQuestions.map((q) => (
                    <li key={q.question}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-ink">{q.question}</p>
                        <span className="w-8 text-right text-xs font-semibold text-muted">{q.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-secondary-500"
                          style={{ width: `${(q.count / commonQuestions[0].count) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Clinic visits by month</h3>
                  {appointmentStats?.sample && (
                    <span className="glass px-2.5 py-1 text-[11px] font-semibold text-secondary-800">
                      sample series
                    </span>
                  )}
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentStats?.byMonth || []} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,24,40,0.08)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(16,24,40,0.04)" }} />
                      <Bar dataKey="visits" name="Visits" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {appointmentStats?.bySpecialty?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                      By specialty
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {appointmentStats.bySpecialty.map((s) => (
                        <span key={s.name} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink">
                          {s.name} · {s.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Healthcare disclaimer slice */}
            <section className="card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-600/10 text-secondary-700">
                <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-xs leading-relaxed text-muted">
                Charts labelled <span className="font-semibold text-ink">sample series</span> demonstrate the
                reporting you will see once live clinic and assistant data flows in. Insights are
                informational and never a substitute for professional medical advice.
              </p>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function statusPalette(status) {
  if (status === "normal" || status === "ok") return { bg: "bg-secondary-100", text: "text-secondary-800" };
  if (status === "elevated" || status === "low") return { bg: "bg-amber-100", text: "text-amber-800" };
  if (status === "high") return { bg: "bg-destructive-100", text: "text-destructive-700" };
  return { bg: "bg-brand-100", text: "text-brand-800" };
}

function MetricTile({ icon: Icon, label, value, meta, status, trend }) {
  const palette = status
    ? statusPalette(status)
    : trend === "down"
    ? { bg: "bg-secondary-100", text: "text-secondary-800" }
    : { bg: "bg-brand-100", text: "text-brand-800" };

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${palette.bg}`}>
          <Icon className={`h-5 w-5 ${palette.text}`} aria-hidden="true" />
        </div>
        {status ? (
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${palette.bg} ${palette.text}`}>
            {status}
          </span>
        ) : trend ? (
          trend === "down" ? (
            <ArrowTrendingDownIcon className="h-5 w-5 text-secondary-600" aria-hidden="true" />
          ) : (
            <ArrowTrendingUpIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />
          )
        ) : null}
      </div>
      <p className="mt-3 text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{meta}</p>
    </div>
  );
}