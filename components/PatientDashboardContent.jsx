"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import {
  HeartIcon,
  BeakerIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserPlusIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

// Quick action links
const quickActions = [
  {
    name: "AI Doctor",
    href: "/dashboard/patient/ai-doctor",
    icon: ChatBubbleLeftRightIcon,
    tile: "bg-secondary-600",
    description: "Ask Medisynix anything",
  },
  {
    name: "Health Profile",
    href: "/dashboard/patient/profile",
    icon: UserIcon,
    tile: "bg-brand-600",
    description: "Update your vitals",
  },
  {
    name: "Book Appointment",
    href: "/dashboard/patient/appointments",
    icon: CalendarIcon,
    tile: "bg-secondary-700",
    description: "See a clinician",
  },
  {
    name: "AI Health Insights",
    href: "/dashboard/patient/analytics",
    icon: ChartBarIcon,
    tile: "bg-brand-500",
    description: "Trends and charts",
  },
  {
    name: "Upload Report",
    href: "/dashboard/patient/upload-report",
    icon: DocumentArrowUpIcon,
    tile: "bg-secondary-500",
    description: "Get a plain-language summary",
  },
  {
    name: "My Records",
    href: "/dashboard/patient/records",
    icon: DocumentTextIcon,
    tile: "bg-brand-700",
    description: "Lab reports & documents",
  },
  {
    name: "Find a Doctor",
    href: "/dashboard/patient/find-doctor",
    icon: UserPlusIcon,
    tile: "bg-brand-800",
    description: "Browse specialists",
  },
];

export default function PatientDashboardContent() {
  const { user } = useAuth();
  const [healthMetrics, setHealthMetrics] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Effect to load user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setLoading(true);

        try {
          // Try to get the most up-to-date data from localStorage first
          let userData = user;
          const storedUserData = localStorage.getItem("medisynix_user");

          if (storedUserData) {
            try {
              const parsedData = JSON.parse(storedUserData);
              // Use localStorage data if it's for the current user
              if (
                parsedData.email === user.email &&
                parsedData.id === user.id
              ) {
                userData = parsedData;
              }
            } catch (e) {
              console.error("Error parsing stored user data", e);
            }
          }

          const metrics = [];

          // MongoDB stores IDs as ObjectId, so ensure we use the right ID
          const userId = userData._id || userData.id;

          // Fetch health metrics from API
          let healthData = null;
          try {
            const healthResponse = await fetch(
              `/api/patient/get-health-metrics?userId=${userId}`,
              { headers: { Authorization: `Bearer ${userData.token || user?.token}` } }
            );
            if (healthResponse.ok) {
              const responseData = await healthResponse.json();
              healthData = responseData.data;
            }
          } catch (error) {
            console.error("Error fetching health metrics:", error);
          }

          // Fetch appointments from API
          let appointmentsData = [];
          try {
            const appointmentsResponse = await fetch(
              `/api/patient/appointments?userId=${userId}`,
              { headers: { Authorization: `Bearer ${userData.token || user?.token}` } }
            );
            if (appointmentsResponse.ok) {
              const responseData = await appointmentsResponse.json();
              appointmentsData = responseData.data || [];
            } else {
              appointmentsData = userData.appointments || [];
            }
          } catch (error) {
            console.error("Error fetching appointments:", error);
            appointmentsData = userData.appointments || [];
          }

          // Use health metrics from API if available, otherwise fallback to user data
          const source = healthData && healthData.current ? healthData.current : userData;

          const lastUpdated = healthData && healthData.current
            ? new Date(healthData.current.timestamp).toLocaleDateString()
            : userData.lastMetricsUpdate || "Not updated";

          // Blood pressure
          if (source.bloodPressure) {
            metrics.push({
              id: 1,
              name: "Blood Pressure",
              value: source.bloodPressure,
              unit: "mmHg",
              status: getBPStatus(source.bloodPressure),
              date: lastUpdated,
              icon: HeartIcon,
            });
          }

          // Heart rate
          if (source.heartRate) {
            metrics.push({
              id: 2,
              name: "Heart Rate",
              value: String(source.heartRate),
              unit: "bpm",
              status: getHeartRateStatus(source.heartRate),
              date: lastUpdated,
              icon: HeartIcon,
            });
          }

          // Glucose level
          if (source.glucoseLevel) {
            metrics.push({
              id: 3,
              name: "Glucose Level",
              value: String(source.glucoseLevel),
              unit: "mg/dL",
              status: getGlucoseStatus(source.glucoseLevel),
              date: lastUpdated,
              icon: BeakerIcon,
            });
          }

          // Weight / BMI
          if (source.weight && source.height) {
            const bmi = calculateBMI(source.weight, source.height);
            metrics.push({
              id: 4,
              name: "Weight & BMI",
              value: `${source.weight} kg`,
              unit: `BMI ${bmi.toFixed(1)}`,
              status: getBMIStatus(bmi),
              date: lastUpdated,
              icon: UserIcon,
            });
          } else if (source.weight) {
            metrics.push({
              id: 4,
              name: "Weight",
              value: `${source.weight} kg`,
              unit: "",
              status: "info",
              date: lastUpdated,
              icon: UserIcon,
            });
          }

          setHealthMetrics(metrics);

          // Upcoming appointments (filter out cancelled/old ones)
          setUpcomingAppointments(
            appointmentsData.filter(
              (apt) => apt.status === "upcoming" || apt.status === "scheduled"
            ) || []
          );

          // Reports: the patient's real medical records, newest first
          try {
            const recordsRes = await fetch(
              `/api/patient/records?userId=${user._id || user.id}`,
              { headers: { Authorization: `Bearer ${user.token}` } }
            );
            if (recordsRes.ok) {
              const recordsData = await recordsRes.json();
              const sorted = [...(recordsData.records || [])].sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              );
              setRecentReports(sorted);
            }
          } catch (recordsError) {
            console.warn("Could not load medical records:", recordsError);
          }
        } catch (error) {
          console.error("Error fetching patient data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Helper functions for determining health status
  function getBPStatus(bp) {
    const [systolic, diastolic] = bp.split("/").map(Number);
    if (systolic < 120 && diastolic < 80) return "normal";
    if (systolic >= 120 && systolic <= 129 && diastolic < 80) return "elevated";
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

  function calculateBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  function getBMIStatus(bmi) {
    if (bmi < 18.5) return "underweight";
    if (bmi >= 18.5 && bmi < 25) return "normal";
    if (bmi >= 25 && bmi < 30) return "overweight";
    return "obese";
  }

  // Synthesize a simple AI health signal from the metrics we have.
  // This is a demonstration of explainability — every claim is traceable
  // back to a specific metric so a clinician can audit it.
  function deriveHealthSignal() {
    if (healthMetrics.length === 0) {
      return {
        status: "Insufficient data",
        tone: "neutral",
        confidence: 0,
        reasons: [
          "Add vitals such as blood pressure, heart rate, or glucose to your profile so Medisynix can build a health signal.",
        ],
        recommendations: [
          "Complete your health profile",
          "Ask the AI Assistant about any concerns",
        ],
      };
    }

    const reasons = [];
    const recommendations = [];
    let abnormal = 0;

    healthMetrics.forEach((metric) => {
      switch (metric.status) {
        case "normal":
          reasons.push(
            `Your ${metric.name.toLowerCase()} (${metric.value}${
              metric.unit ? " " + metric.unit : ""
            }) is within a healthy range.`
          );
          break;
        case "elevated":
        case "high":
          abnormal++;
          reasons.push(
            `Your ${metric.name.toLowerCase()} (${metric.value}${
              metric.unit ? " " + metric.unit : ""
            }) is ${metric.status} — higher than the typical resting range.`
          );
          recommendations.push(
            `Ask Medisynix to explain your ${metric.name.toLowerCase()} reading`
          );
          break;
        case "low":
          abnormal++;
          reasons.push(
            `Your ${metric.name.toLowerCase()} (${metric.value}${
              metric.unit ? " " + metric.unit : ""
            }) is below the typical resting range.`
          );
          break;
        default:
          reasons.push(
            `Your ${metric.name.toLowerCase()} is ${metric.value}${
              metric.unit ? " " + metric.unit : ""
            }.`
          );
      }
    });

    const status =
      abnormal === 0 ? "Stable" : abnormal <= 1 ? "Attention suggested" : "Needs follow-up";
    const confidence = abnormal === 0 ? 94 : 88 - abnormal * 4;

    recommendations.push(
      abnormal === 0
        ? "Keep a weekly record of your vitals"
        : "Book a check-up if readings repeat over 3 days",
      "Reviews are informational only — confirm with a clinician"
    );

    return { status, tone: abnormal === 0 ? "ok" : "warn", confidence, reasons, recommendations };
  }

  const firstName = user?.name?.split(" ")[0] || "Patient";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const signal = deriveHealthSignal();
  const nextAppointment = upcomingAppointments[0];

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-700 to-secondary-800 p-6 text-white shadow-card sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-secondary-400/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-100/80">
                {greeting} — patient portal
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {firstName}&apos;s Health Overview
              </h1>
              <p className="mt-2 max-w-xl text-sm text-brand-100/90">
                A quick look at your latest vitals, upcoming visits and records.
                These are general indicators, not a diagnosis. Talk to a doctor
                about anything that worries you.
              </p>
            </div>
            <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white">
              <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
              Patient account
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Quick actions</h2>
          <span className="hidden text-sm text-muted sm:block">
            {healthMetrics.length > 0
              ? `${healthMetrics.length} active health metrics`
              : "Add vitals to unlock insights"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="card card-hover group flex flex-col items-center gap-2.5 rounded-xl p-4 text-center"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${action.tile} text-white shadow-sm transition-transform group-hover:scale-110`}
              >
                <action.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-ink">
                {action.name}
              </span>
              <span className="text-[11px] leading-tight text-muted">
                {action.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Health metrics strip */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Health metrics</h2>
          <Link
            href="/dashboard/patient/profile"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <PlusCircleIcon className="h-4 w-4" aria-hidden="true" />
            Update profile
          </Link>
        </div>
        {loading ? (
          <div className="card rounded-xl p-8 text-center text-sm text-muted">
            Loading your latest vitals…
          </div>
        ) : healthMetrics.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {healthMetrics.map((metric) => (
              <div key={metric.id} className="card rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      statusChip(metric.status).bg
                    }`}
                  >
                    <metric.icon
                      className={`h-5 w-5 ${statusChip(metric.status).text}`}
                      aria-hidden="true"
                    />
                  </div>
                  <StatusBadge status={metric.status} />
                </div>
                <p className="mt-3 text-sm font-medium text-secondary-700">
                  {metric.name}
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold tracking-tight text-ink">
                    {metric.value}
                  </p>
                  {metric.unit && (
                    <p className="text-xs text-muted">{metric.unit}</p>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Updated {metric.date}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card rounded-xl p-8 text-center">
            <ExclamationCircleIcon className="mx-auto h-10 w-10 text-muted" />
            <h3 className="mt-3 text-base font-semibold text-ink">
              No health metrics yet
            </h3>
            <p className="mt-1 text-sm text-muted">
              Add your blood pressure, heart rate, and weight to unlock the AI
              health signal.
            </p>
            <Link href="/dashboard/patient/profile" className="btn btn-primary mt-5">
              Update health profile
            </Link>
          </div>
        )}
      </section>

      {/* AI health signal (explainability) + upcoming appointment */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card rounded-2xl p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
                <SparklesIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-ink">
                AI health signal
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={signal.tone} override={signal.status} />
              {signal.confidence > 0 && (
                <span className="glass text-xs font-semibold text-secondary-800">
                  {signal.confidence}% confidence
                </span>
              )}
            </div>
          </div>

          {signal.confidence > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-[11px] font-medium uppercase tracking-wide text-muted">
                <span>Signal strength</span>
                <span>{signal.confidence}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-secondary-500"
                  style={{ width: `${signal.confidence}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              How this was reached
            </h3>
            <ul className="mt-3 space-y-2.5">
              {signal.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                  <CheckCircleIcon
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary-600"
                    aria-hidden="true"
                  />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-xl bg-surface p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Suggested next steps
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {signal.recommendations.map((rec, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink"
                >
                  {rec}
                </span>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              This signal is informational and generated from data you provide.
              It is not a diagnosis — always confirm with a licensed clinician.
              See the public <Link href="/#disclaimer" className="underline">disclaimer</Link>.
            </p>
          </div>
        </div>

        <div className="card flex flex-col rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">
              Upcoming appointment
            </h2>
            <Link
              href="/dashboard/patient/appointments"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-muted">Checking your schedule…</p>
          ) : nextAppointment ? (
            <div className="mt-5 flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-600/10 text-secondary-700">
                  <CalendarIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {nextAppointment.doctor || "Doctor visit"}
                  </p>
                  <p className="text-xs text-muted">
                    {nextAppointment.specialty || "General consultation"}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-surface p-4">
                <p className="flex items-center gap-2 text-sm text-ink">
                  <CalendarIcon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  {nextAppointment.date}
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-sm text-ink">
                  <ClockIcon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  {nextAppointment.time}
                </p>
              </div>
              <Link
                href="/dashboard/patient/ai-doctor"
                className="btn btn-secondary mt-auto"
              >
                Prepare with the AI Assistant
              </Link>
            </div>
          ) : (
            <div className="mt-5 flex flex-1 flex-col items-center justify-center text-center">
              <CalendarIcon className="h-10 w-10 text-muted" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-ink">
                No upcoming appointments
              </p>
              <p className="mt-1 text-xs text-muted">
                Book a session with a clinician near you.
              </p>
              <Link
                href="/dashboard/patient/appointments"
                className="btn btn-primary mt-5"
              >
                Book appointment
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recent AI sessions + medical reports */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Talk to the AI Doctor</h2>
            <Link
              href="/dashboard/patient/ai-doctor"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Open
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            Ask health questions in plain language, any time. Answers are informational and never replace a doctor.
          </p>
          <ul className="mt-4 space-y-3">
            {[
              {
                title: "General AI Doctor",
                text: "Symptoms, hospital services, clinic hours and booking guidance for AKUH and Al Shifa.",
                href: "/dashboard/patient/ai-doctor",
              },
              {
                title: "Symptom Checker",
                text: "Pick your symptoms and see which common conditions fit, with a suggested next step.",
                href: "/dashboard/patient/symptom-checker",
              },
              {
                title: "Find a doctor",
                text: "Browse specialists and book a free time slot in a few clicks.",
                href: "/dashboard/patient/find-doctor",
              },
            ].map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-surface"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink group-hover:text-brand-700">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.text}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Medical reports</h2>
            <Link
              href="/dashboard/patient/records"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-muted">Loading reports…</p>
          ) : recentReports.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {recentReports.slice(0, 4).map((report) => (
                <li key={report._id || report.id}>
                  <Link
                    href="/dashboard/patient/records"
                    className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-surface"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
                      <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {report.title || report.name}
                      </p>
                      <p className="text-[11px] capitalize text-muted">
                        {report.type} · {report.date}
                      </p>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-xl bg-surface p-8 text-center">
              <DocumentArrowUpIcon className="h-10 w-10 text-muted" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-ink">
                No reports uploaded yet
              </p>
              <p className="mt-1 text-xs text-muted">
                Upload a lab report and Medisynix will translate it into plain
                language.
              </p>
              <Link
                href="/dashboard/patient/upload-report"
                className="btn btn-accent mt-5"
              >
                Upload report
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Render a small colored status badge
function StatusBadge({ status, override }) {
  const label = override || status;
  const palette = {
    ok: "bg-secondary-100 text-secondary-800",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-destructive-100 text-destructive-700",
    neutral: "bg-muted text-muted.foreground",
    normal: "bg-secondary-100 text-secondary-800",
    elevated: "bg-amber-100 text-amber-800",
    high: "bg-destructive-100 text-destructive-700",
    low: "bg-amber-100 text-amber-800",
    underweight: "bg-amber-100 text-amber-800",
    overweight: "bg-amber-100 text-amber-800",
    obese: "bg-destructive-100 text-destructive-700",
    info: "bg-brand-100 text-brand-800",
  };
  const cls = palette[status] || palette.neutral;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${cls}`}
    >
      {label}
    </span>
  );
}

// Icon chip palette for metric tiles
function statusChip(status) {
  const map = {
    normal: { bg: "bg-secondary-100", text: "text-secondary-700" },
    elevated: { bg: "bg-amber-100", text: "text-amber-600" },
    high: { bg: "bg-destructive-100", text: "text-destructive-600" },
    low: { bg: "bg-amber-100", text: "text-amber-600" },
    info: { bg: "bg-brand-100", text: "text-brand-700" },
  };
  return map[status] || map.info;
}