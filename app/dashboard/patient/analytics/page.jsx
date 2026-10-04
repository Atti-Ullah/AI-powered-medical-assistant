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
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const BRAND = "#2563eb";
const TEAL = "#0d9488";
const AMBER = "#f59e0b";
const CORAL = "#e11d48";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [timeRange, setTimeRange] = useState("quarter"); // month, quarter, year
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
          // No visits in the selected range
          setAppointmentStats({
            total: 0,
            upcoming: 0,
            past: 0,
            cancelled: 0,
            byMonth: [],
            bySpecialty: [],
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

  const rangeLabel = { month: "last month", quarter: "last 3 months", year: "last 12 months" }[timeRange];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-700 to-secondary-800 p-6 text-white shadow-card sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-secondary-400/20 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Health insights
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-100/90">
              Your latest vitals and clinic visits in one place, built from the
              information saved in your account.
            </p>
          </div>
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Appointments",
              value: String(appointmentStats ? appointmentStats.total : 0),
              unit: "in range",
              icon: CalendarDaysIcon,
              accent: "bg-brand-600/10 text-brand-700",
              trend: rangeLabel,
            },
            {
              label: "Upcoming",
              value: String(appointmentStats ? appointmentStats.upcoming : 0),
              unit: "booked",
              icon: ClockIcon,
              accent: "bg-secondary-600/10 text-secondary-700",
              trend: "still ahead",
            },
            {
              label: "Completed",
              value: String(appointmentStats ? appointmentStats.past : 0),
              unit: "visits",
              icon: ShieldCheckIcon,
              accent: "bg-secondary-600/10 text-secondary-700",
              trend: "seen by a doctor",
            },
            {
              label: "Cancelled",
              value: String(appointmentStats ? appointmentStats.cancelled : 0),
              unit: "visits",
              icon: ExclamationCircleIcon,
              accent: "bg-brand-600/10 text-brand-700",
              trend: rangeLabel,
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
                    meta="Latest reading"
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

            {/* Clinic visits */}
            <section>
              <div className="card rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Clinic visits by month</h3>
                  <div className="inline-flex rounded-lg bg-muted-background p-0.5" role="group" aria-label="Time range">
                    {[
                      ["month", "1 month"],
                      ["quarter", "3 months"],
                      ["year", "12 months"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTimeRange(value)}
                        aria-pressed={timeRange === value}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                          timeRange === value ? "bg-white text-brand-700 shadow-sm" : "text-muted hover:text-ink"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {appointmentStats && appointmentStats.total === 0 && (
                  <p className="mt-6 text-sm text-muted">
                    No appointments in this period. Book a visit from Find a Doctor and it will appear here.
                  </p>
                )}
                <div className={`h-64 ${appointmentStats && appointmentStats.total === 0 ? "hidden" : ""}`}>
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
                These insights come from the vitals and appointments saved in your account. They are
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