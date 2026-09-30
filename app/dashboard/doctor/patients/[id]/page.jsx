"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  HeartIcon,
  BoltIcon,
  BeakerIcon,
  ScaleIcon,
  ChartBarSquareIcon,
  CalendarDaysIcon,
  FolderOpenIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldExclamationIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import DashboardLayout from "../../../../../components/DashboardLayout";
import {
  card,
  primaryButton,
  secondaryButton,
  Avatar,
  RiskBadge,
  StatusBadge,
  RISK_STYLES,
  EmptyState,
  InlineAlert,
  Skeleton,
  formatDate,
  relativeDay,
  useApiData,
} from "../../../../../components/DoctorUI";

const VITAL_SEVERITY_TEXT = { high: "text-rose-600", medium: "text-amber-600", low: "text-blue-600" };

function VitalTile({ label, value, unit, icon: Icon, severity }) {
  const missing = value === null || value === undefined || value === "";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2 text-slate-500">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        <Icon className={`h-4 w-4 shrink-0 ${severity ? VITAL_SEVERITY_TEXT[severity] : ""}`} aria-hidden="true" />
      </div>
      <p className={`mt-2 flex flex-wrap items-baseline gap-x-1 text-lg font-bold tracking-tight sm:text-xl ${missing ? "text-slate-300" : severity ? VITAL_SEVERITY_TEXT[severity] : "text-slate-900"}`}>
        <span>{missing ? "-" : value}</span>
        {!missing && unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </p>
    </div>
  );
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          {Icon && <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DoctorPatientDetailPage() {
  const params = useParams();
  const { data, loading, error } = useApiData(params.id ? `/api/doctor/patients/${params.id}` : null);

  const notFound = error && /not found/i.test(error);

  return (
    <DashboardLayout>
      <Link href="/dashboard/doctor/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-primary-600">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        Back to patients
      </Link>

      {loading && !data ? (
        <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
      ) : notFound ? (
        <div className={card}>
          <EmptyState
            icon={ShieldExclamationIcon}
            title="Patient not found"
            text="You can only open patients who have an appointment with you."
            action={<Link href="/dashboard/doctor/patients" className={secondaryButton}>Back to my patients</Link>}
          />
        </div>
      ) : error ? (
        <InlineAlert>{error}</InlineAlert>
      ) : data ? (
        (() => {
          const { patient: p, analysis, vitalsHistory, appointments, records, medications } = data;
          const v = p.vitals;
          const sev = (id) => analysis.flags.find((f) => f.id === id && f.severity !== "info")?.severity;
          const clinicalFlags = analysis.flags.filter((f) => f.severity !== "info");

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className={`${card} p-5 sm:p-6`}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar name={p.name} size="h-16 w-16" text="text-xl" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">{p.name}</h1>
                        <RiskBadge risk={analysis.risk} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {[p.age ? `${p.age} years` : null, p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : null, p.bloodType ? `Blood type ${p.bloodType}` : null].filter(Boolean).join(" · ") || "Profile details not provided"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                        {p.email && <span className="inline-flex items-center gap-1.5"><EnvelopeIcon className="h-4 w-4" aria-hidden="true" />{p.email}</span>}
                        {p.phone && <span className="inline-flex items-center gap-1.5"><PhoneIcon className="h-4 w-4" aria-hidden="true" />{p.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-3">
                    <Link href={`/dashboard/doctor/consultations?search=${encodeURIComponent(p.name)}`} className={secondaryButton}>
                      <CalendarDaysIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                      Visits
                    </Link>
                    <Link href={`/dashboard/doctor/upload-report?patient=${p.id}`} className={primaryButton}>
                      <DocumentArrowUpIcon className="h-5 w-5" aria-hidden="true" />
                      Upload report
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                  {/* Vitals */}
                  <Section title="Latest vitals" icon={HeartIcon} action={v?.timestamp && <span className="text-xs text-slate-500">Recorded {formatDate(v.timestamp)}</span>}>
                    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 sm:p-6 lg:grid-cols-5 [&>:last-child:nth-child(odd)]:col-span-2 sm:[&>:last-child:nth-child(odd)]:col-span-1">
                      <VitalTile label="Blood pressure" value={v?.bloodPressure} unit="mmHg" icon={HeartIcon} severity={sev("bp")} />
                      <VitalTile label="Heart rate" value={v?.heartRate} unit="bpm" icon={BoltIcon} severity={sev("hr")} />
                      <VitalTile label="Glucose" value={v?.glucoseLevel} unit="mg/dL" icon={BeakerIcon} severity={sev("glucose")} />
                      <VitalTile label="BMI" value={analysis.bmi} icon={ScaleIcon} severity={sev("bmi")} />
                      <VitalTile label="Weight" value={v?.weight} unit="kg" icon={ScaleIcon} />
                    </div>
                    {vitalsHistory.length > 1 && (
                      <div className="overflow-x-auto border-t border-slate-100">
                        <table className="min-w-full text-sm">
                          <caption className="sr-only">Recent vitals readings</caption>
                          <thead>
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                              {["Recorded", "BP", "Heart rate", "Glucose", "Weight"].map((h) => <th key={h} scope="col" className="px-5 py-3 sm:px-6">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {vitalsHistory.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                <td className="whitespace-nowrap px-5 py-3 text-slate-600 sm:px-6">{formatDate(row.timestamp)}</td>
                                <td className="whitespace-nowrap px-5 py-3 text-slate-900 sm:px-6">{row.bloodPressure || "-"}</td>
                                <td className="whitespace-nowrap px-5 py-3 text-slate-900 sm:px-6">{row.heartRate ?? "-"}</td>
                                <td className="whitespace-nowrap px-5 py-3 text-slate-900 sm:px-6">{row.glucoseLevel ?? "-"}</td>
                                <td className="whitespace-nowrap px-5 py-3 text-slate-900 sm:px-6">{row.weight ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Section>

                  {/* Screening */}
                  <Section title="Vitals screening" icon={ChartBarSquareIcon}>
                    {clinicalFlags.length ? (
                      <ul className="divide-y divide-slate-100">
                        {clinicalFlags.map((f) => (
                          <li key={f.id} className="flex gap-4 px-5 py-4 sm:px-6">
                            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${RISK_STYLES[f.severity].dot}`} aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                                <RiskBadge risk={f.severity} />
                              </div>
                              <p className="mt-1 text-sm text-slate-600">{f.detail}</p>
                              <p className="mt-1 text-xs text-slate-500">Consider: {f.suggestion}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        icon={HeartIcon}
                        title={analysis.hasVitals ? "No concerns from recorded vitals" : "No vitals on file"}
                        text={analysis.hasVitals ? "Every recorded reading is within the expected range." : "Ask the patient to record their vitals in their health profile."}
                      />
                    )}
                    <p className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-slate-500 sm:px-6">
                      Rule-based screening of the readings above. It supports, and never replaces, your clinical judgement.
                    </p>
                  </Section>

                  {/* Visits */}
                  <Section title="Visits with you" icon={CalendarDaysIcon}>
                    {appointments.length ? (
                      <ul className="divide-y divide-slate-100">
                        {appointments.map((a) => (
                          <li key={a.id} className="px-5 py-4 sm:px-6">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatDate(a.date)} <span className="font-normal text-slate-500">at {a.time}</span>
                              </p>
                              <StatusBadge status={a.status} />
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{a.reason || "No reason given"}</p>
                            {a.diagnosis && <p className="mt-2 text-sm text-slate-900"><span className="font-medium">Diagnosis:</span> {a.diagnosis}</p>}
                            {a.doctorNotes && <p className="mt-1 text-sm text-slate-600"><span className="font-medium text-slate-700">Notes:</span> {a.doctorNotes}</p>}
                            {a.status === "upcoming" && <p className="mt-1 text-xs text-slate-500">{relativeDay(a.date)}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState icon={CalendarDaysIcon} title="No visits yet" />
                    )}
                  </Section>
                </div>

                <div className="space-y-6">
                  <Section title="Medical profile" icon={ClipboardDocumentListIcon}>
                    <dl className="divide-y divide-slate-100 text-sm">
                      {[
                        ["Conditions", p.medicalConditions],
                        ["Allergies", p.allergies],
                        ["Reported medications", p.medications],
                        ["Date of birth", p.dateOfBirth ? formatDate(p.dateOfBirth) : ""],
                      ].map(([label, value]) => (
                        <div key={label} className="px-5 py-3.5 sm:px-6">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
                          <dd className="mt-1 text-slate-900">{value || <span className="text-slate-400">Not provided</span>}</dd>
                        </div>
                      ))}
                    </dl>
                  </Section>

                  <Section title="Medications" icon={BeakerIcon}>
                    {medications.length ? (
                      <ul className="divide-y divide-slate-100">
                        {medications.map((m) => (
                          <li key={m.id} className="px-5 py-3.5 sm:px-6">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900">{m.name}</p>
                              <span className={`text-xs font-medium ${m.active ? "text-emerald-600" : "text-slate-400"}`}>{m.active ? "Active" : "Ended"}</span>
                            </div>
                            <p className="text-xs text-slate-500">{[m.dosage, m.frequency].filter(Boolean).join(" · ")}</p>
                            {m.prescribedBy && <p className="text-xs text-slate-400">Prescribed by {m.prescribedBy}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState icon={BeakerIcon} title="No medications recorded" />
                    )}
                  </Section>

                  <Section title="Medical records" icon={FolderOpenIcon}>
                    {records.length ? (
                      <ul className="divide-y divide-slate-100">
                        {records.map((r) => (
                          <li key={r.id} className="px-5 py-3.5 sm:px-6">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900">{r.title}</p>
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">{r.type}</span>
                            </div>
                            <p className="text-xs text-slate-500">{formatDate(r.date)}{r.doctor ? ` · ${r.doctor}` : ""}{r.hasFile ? " · file attached" : ""}</p>
                            {r.findings && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{r.findings}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        icon={FolderOpenIcon}
                        title="No records yet"
                        action={<Link href={`/dashboard/doctor/upload-report?patient=${p.id}`} className={secondaryButton}>Upload a report</Link>}
                      />
                    )}
                  </Section>
                </div>
              </div>
            </div>
          );
        })()
      ) : null}
    </DashboardLayout>
  );
}
