"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../../../../components/DashboardLayout";
import PageHeader from "../../../../components/PageHeader";
import {
  card,
  inputClass,
  Avatar,
  RiskBadge,
  RISK_STYLES,
  EmptyState,
  InlineAlert,
  Skeleton,
  formatDate,
  useApiData,
} from "../../../../components/DoctorUI";

const LEVELS = ["high", "medium", "low", "none", "unknown"];

function vitalsSummary(v) {
  if (!v) return "No vitals recorded";
  return [v.bloodPressure && `BP ${v.bloodPressure}`, v.heartRate && `HR ${v.heartRate}`, v.glucoseLevel && `Glucose ${v.glucoseLevel}`, v.bmi && `BMI ${v.bmi}`].filter(Boolean).join("  ·  ") || "No vitals recorded";
}

export default function DoctorAiAnalysisPage() {
  const { data, loading, error } = useApiData("/api/doctor/analysis");
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState({});

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.items || []).filter((i) => (!level || i.risk === level) && (!term || i.patient.name.toLowerCase().includes(term)));
  }, [data, level, search]);

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Doctor workspace"
        title="AI analysis"
        description="Vitals screening across your patients, ranked by how urgently they may need review."
      />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
        <p className="leading-relaxed">
          This is <strong>rule-based screening</strong> of the vitals each patient has recorded (blood pressure, heart rate, glucose and BMI) against standard reference ranges.
          It highlights readings worth a second look; it does not diagnose, and it only knows what patients have entered.
        </p>
      </div>

      {error && <div className="mb-6"><InlineAlert>{error}</InlineAlert></div>}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 [&>:last-child:nth-child(odd)]:col-span-2 sm:[&>:last-child:nth-child(odd)]:col-span-1" role="group" aria-label="Filter by priority">
        {LEVELS.map((l) => {
          const style = RISK_STYLES[l];
          const count = data?.counts?.[l] ?? 0;
          const active = level === l;
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(active ? "" : l)}
              aria-pressed={active}
              className={`${card} p-4 text-left transition hover:border-primary-200 hover:shadow-md ${active ? "ring-2 ring-primary-500" : ""}`}
            >
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
                {style.label}
              </span>
              <span className="mt-2 block text-2xl font-bold text-slate-900">{loading && !data ? "-" : count}</span>
            </button>
          );
        })}
      </div>

      <div className={card}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="text" role="searchbox" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients" aria-label="Search patients" className={`${inputClass} pl-10`} />
          </div>
          <p className="text-sm text-slate-500" aria-live="polite">
            {level ? `${RISK_STYLES[level].label}: ` : ""}{items.length} {items.length === 1 ? "patient" : "patients"}
            {data?.generatedAt && <span className="ml-2 hidden text-xs text-slate-400 md:inline">Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
          </p>
        </div>

        {loading && !data ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : items.length ? (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const clinical = item.flags.filter((f) => f.severity !== "info");
              const expanded = !!open[item.patient.id];
              return (
                <li key={item.patient.id} className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <Avatar name={item.patient.name} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.patient.name}</p>
                          <RiskBadge risk={item.risk} />
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[item.patient.age ? `${item.patient.age} yrs` : null, item.patient.nextAppointment ? `Next visit ${formatDate(item.patient.nextAppointment.date)}` : null].filter(Boolean).join(" · ")}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-600">{vitalsSummary(item.vitals)}</p>
                        {clinical.length === 0 && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                            {item.risk === "none" ? <><CheckBadgeIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />Recorded vitals are within the expected ranges.</> : "No vitals on file to screen."}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {clinical.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setOpen({ ...open, [item.patient.id]: !expanded })}
                          aria-expanded={expanded}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          {clinical.length} {clinical.length === 1 ? "flag" : "flags"}
                          <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                      )}
                      <Link href={`/dashboard/doctor/patients/${item.patient.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-700">
                        Open
                        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  {expanded && clinical.length > 0 && (
                    <ul className="mt-4 space-y-3 sm:ml-14">
                      {clinical.map((f) => (
                        <li key={f.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                            <RiskBadge risk={f.severity} />
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{f.detail}</p>
                          <p className="mt-1 text-xs text-slate-500">Consider: {f.suggestion}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={SparklesIcon}
            title={data?.total ? "No patients match" : "No patients to analyse yet"}
            text={data?.total ? "Try a different priority filter or search." : "Screening starts once patients have booked with you and recorded their vitals."}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
