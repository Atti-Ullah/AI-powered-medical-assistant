"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  BellIcon,
  DocumentArrowUpIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// ---------------------------------------------------------------- mock data
const doctorStats = [
  { name: "Patients seen today", value: 8, icon: UserGroupIcon, accent: "bg-brand-600/10 text-brand-700" },
  { name: "Pending reports", value: 3, icon: DocumentTextIcon, accent: "bg-amber-100 text-amber-700" },
  { name: "Upcoming appointments", value: 12, icon: CalendarIcon, accent: "bg-secondary-600/10 text-secondary-700" },
  { name: "Assistant flags", value: 2, icon: ExclamationTriangleIcon, accent: "bg-destructive-100 text-destructive-700" },
];

const quickActions = [
  { name: "Add Patient", href: "/dashboard/doctor/patients/add", icon: UserIcon, tile: "bg-brand-600" },
  { name: "Schedule Appointment", href: "/dashboard/doctor/appointments/schedule", icon: CalendarIcon, tile: "bg-secondary-600" },
  { name: "Upload Report", href: "/dashboard/doctor/upload-report", icon: DocumentArrowUpIcon, tile: "bg-amber-500" },
  { name: "Review AI Flags", href: "/dashboard/doctor/reports", icon: ExclamationTriangleIcon, tile: "bg-destructive-500" },
  { name: "Patient Messages", href: "/dashboard/doctor/messages", icon: ChatBubbleLeftRightIcon, tile: "bg-brand-700" },
];

const upcomingAppointments = [
  {
    id: 1,
    patient: "John Smith",
    age: 45,
    time: "10:00 AM",
    type: "Follow-up",
    complaint: "Chest pain, shortness of breath",
    urgent: true,
  },
  {
    id: 2,
    patient: "Emily Johnson",
    age: 32,
    time: "11:30 AM",
    type: "New Patient",
    complaint: "Migraine, dizziness",
    urgent: false,
  },
  {
    id: 3,
    patient: "Michael Rodriguez",
    age: 58,
    time: "2:15 PM",
    type: "Follow-up",
    complaint: "Post-surgery check-up",
    urgent: false,
  },
];

const patientRequests = [
  {
    id: 1,
    patientName: "Thomas Clark",
    age: 62,
    gender: "Male",
    requestType: "New Patient",
    reason: "Unusual heart palpitations and shortness of breath",
    requestDate: "Jun 13",
    status: "pending",
    severity: "urgent",
  },
  {
    id: 2,
    patientName: "Sophia Martinez",
    age: 28,
    gender: "Female",
    requestType: "Second Opinion",
    reason: "Seeking second opinion on thyroid condition diagnosis",
    requestDate: "Jun 12",
    status: "pending",
    severity: "routine",
  },
  {
    id: 3,
    patientName: "Maria Wilson",
    age: 35,
    gender: "Female",
    requestType: "New Patient",
    reason: "Chronic migraines, seeking specialist care after medication failure",
    requestDate: "Jun 14",
    status: "pending",
    severity: "routine",
  },
];

const recentPatients = [
  { id: 1, name: "James Wilson", age: 67, lastVisit: "Jun 10", condition: "Hypertension, Diabetes" },
  { id: 2, name: "Sarah Thompson", age: 42, lastVisit: "Jun 8", condition: "Asthma" },
  { id: 3, name: "Robert Garcia", age: 35, lastVisit: "Jun 5", condition: "Anxiety, Insomnia" },
  { id: 4, name: "Jennifer Lee", age: 29, lastVisit: "Jun 1", condition: "Migraine" },
];

const aiInsights = [
  {
    id: 1,
    title: "Escalation flag — symptoms consistent with cardiac patterns",
    description:
      "John Smith's reported chest pain and shortness of breath align with patterns Medisynix flags for early escalation. Automated triage suggested a same-week cardiology review.",
    confidence: "high",
    patientName: "John Smith",
    patientId: 1,
  },
  {
    id: 2,
    title: "Treatment recommendation",
    description:
      "Based on recent guidelines and Sarah Thompson's history, consider reviewing her current asthma controller dose at the next visit.",
    confidence: "medium",
    patientName: "Sarah Thompson",
    patientId: 2,
  },
  {
    id: 3,
    title: "Test recommendation",
    description:
      "For Robert Garcia, a home sleep study would help clarify insomnia patterns and rule out sleep apnea.",
    confidence: "high",
    patientName: "Robert Garcia",
    patientId: 3,
  },
];

export default function DoctorDashboardContent() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecentPatients = recentPatients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-700 to-secondary-800 p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-secondary-400/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-100/80">
              Clinician workspace — Dr. Sarah Johnson
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, Doctor
            </h1>
            <p className="mt-2 max-w-xl text-sm text-brand-100/90">
              {upcomingAppointments.length} appointments today. Medisynix has{" "}
              <span className="font-semibold text-white">
                {aiInsights.filter((i) => i.confidence === "high").length} high-confidence flags
              </span>{" "}
              for your review.
            </p>
          </div>
          <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white">
            <BellIcon className="h-5 w-5" aria-hidden="true" />
            2 urgent flags
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {doctorStats.map((stat) => (
          <div key={stat.name} className="card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${stat.accent}`}>
                <stat.icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-muted">{stat.name}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-ink">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Quick actions</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href} className="card card-hover group flex flex-col items-center gap-3 rounded-xl p-5 text-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${action.tile} text-white shadow-sm transition-transform group-hover:scale-110`}>
                <action.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold text-ink">{action.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Urgent flags */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <ExclamationTriangleIcon className="h-5 w-5 text-destructive-500" aria-hidden="true" />
            Needs your attention
          </h2>
          <span className="rounded-full bg-destructive-100 px-2.5 py-1 text-[11px] font-semibold text-destructive-700">
            {patientRequests.filter((r) => r.severity === "urgent").length} urgent
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {patientRequests
            .filter((r) => r.severity === "urgent")
            .map((request) => (
              <div key={request.id} className="card rounded-2xl border-l-4 border-l-destructive-500 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive-100 text-destructive-700">
                      <UserIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{request.patientName}</p>
                      <p className="text-xs text-muted">{request.age} years · {request.requestType}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-destructive-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-destructive-700">
                    Urgent
                  </span>
                </div>
                <p className="mt-3 text-sm text-ink">{request.reason}</p>
                <p className="mt-2 text-[11px] text-muted">
                  Requested {request.requestDate} · AI-assigned triage priority
                </p>
              </div>
            ))}
        </div>
      </section>

      {/* Today's appointments + AI insights */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <CalendarIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Today&apos;s appointments
            </h2>
            <Link href="/dashboard/doctor/appointments" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="py-2.5 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Patient</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Time</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Type</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Complaint</th>
                  <th className="py-2.5 pl-3 pr-0 text-right text-xs font-semibold uppercase tracking-wide text-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {upcomingAppointments.map((appointment) => (
                  <tr key={appointment.id} className={appointment.urgent ? "bg-destructive-100/40" : ""}>
                    <td className="whitespace-nowrap py-3.5 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
                          <UserIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">{appointment.patient}</p>
                          <p className="text-xs text-muted">{appointment.age} y/o</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <p className="text-sm font-medium text-ink">{appointment.time}</p>
                      <p className="text-[11px] text-muted">Today</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          appointment.type === "New Patient"
                            ? "bg-brand-100 text-brand-800"
                            : "bg-secondary-100 text-secondary-800"
                        }`}
                      >
                        {appointment.type}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="flex items-center gap-1.5 text-sm text-ink">
                        {appointment.urgent && (
                          <ExclamationTriangleIcon className="h-4 w-4 text-destructive-500" aria-hidden="true" />
                        )}
                        {appointment.complaint}
                      </p>
                    </td>
                    <td className="whitespace-nowrap py-3.5 pl-3 pr-0 text-right">
                      <Link href={`/dashboard/doctor/patients/${appointment.id}`} className="btn btn-secondary !px-3 !py-1.5 !text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <ShieldCheckIcon className="h-5 w-5 text-secondary-600" aria-hidden="true" />
            AI clinical insights
          </h2>
          <p className="mt-1 text-xs text-muted">
            Generated from patient queries and records. Every flag shows its
            confidence so you can audit the reasoning.
          </p>
          <ul className="mt-4 space-y-3">
            {aiInsights.map((insight) => (
              <li key={insight.id}>
                <div className="rounded-xl border border-border p-4 transition-colors hover:bg-surface">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted">{insight.patientName}</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        insight.confidence === "high"
                          ? "bg-secondary-100 text-secondary-800"
                          : insight.confidence === "medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-destructive-100 text-destructive-700"
                      }`}
                    >
                      {insight.confidence} confidence
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-ink">{insight.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{insight.description}</p>
                  <button type="button" className="btn btn-secondary mt-3 w-full !px-3 !py-2 !text-xs">
                    Review details & reasoning
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Flags are decision support only — clinical judgment stays with you.
          </p>
        </div>
      </section>

      {/* Patient requests */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">New patient requests</h2>
          <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-800">
            {patientRequests.length} pending
          </span>
        </div>
        <div className="card rounded-2xl p-5">
          <ul className="divide-y divide-border">
            {patientRequests.map((request) => (
              <li key={request.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
                    <UserIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{request.patientName}</p>
                    <p className="text-xs text-muted">
                      {request.age} years · {request.gender} · {request.requestDate}
                    </p>
                  </div>
                </div>
                <div className="min-w-0 sm:max-w-md sm:flex-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      request.requestType === "New Patient"
                        ? "bg-brand-100 text-brand-800"
                        : "bg-secondary-100 text-secondary-800"
                    }`}
                  >
                    {request.requestType}
                  </span>
                  <p className="mt-1.5 text-sm text-ink">{request.reason}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-primary !px-3 !py-2 !text-xs">
                    Accept
                  </button>
                  <button type="button" className="btn btn-secondary !px-3 !py-2 !text-xs">
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Patient search */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink">Patient search</h2>
          <p className="mt-1 text-sm text-muted">Find patients by name, ID, or condition.</p>
        </div>
        <div className="flex max-w-lg gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search patients…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <button type="button" className="btn btn-primary !py-2.5">Search</button>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredRecentPatients.map((patient) => (
            <li key={patient.id}>
              <Link href={`/dashboard/doctor/patients/${patient.id}`} className="card card-hover flex items-center gap-3 rounded-xl p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/10 text-brand-700">
                  <UserIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{patient.name}</p>
                  <p className="truncate text-xs text-muted">{patient.condition}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted">{patient.lastVisit}</p>
                  <p className="flex items-center justify-end gap-1 text-[11px] text-muted">
                    <ClockIcon className="h-3 w-3" aria-hidden="true" />
                    Last visit
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {filteredRecentPatients.length === 0 && (
            <li className="card rounded-xl p-6 text-center text-sm text-muted sm:col-span-2">
              No patients match “{searchQuery}”.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}