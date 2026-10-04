function MockSymptomChecker() {
  return (
    <div className="space-y-3 p-4">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Describe your symptoms
        </p>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
          Persistent headache, mild fever, fatigue
        </div>
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Suggested guidance
      </div>
      <div className="space-y-2">
        {[
          { label: "Consider hydration & rest monitoring", pct: 88 },
          { label: "Schedule a blood count test", pct: 82 },
          { label: "Rule out influenza A/B", pct: 74 },
        ].map((row) => (
          <div key={row.label} className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>{row.label}</span>
              <span className="text-xs font-semibold text-brand-700">
                {row.pct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-600 to-accent-500"
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockReportAnalysis() {
  return (
    <div className="space-y-3 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        CBC Report — Plain-language summary
      </p>
      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        Hemoglobin is{" "}
        <span className="rounded bg-rose-100 px-1.5 py-0.5 font-semibold text-alert-700">
          slightly low (11.2 g/dL)
        </span>
        , suggesting mild anemia. Your white cell count is{" "}
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
          within range
        </span>
        . Consider discussing iron supplementation.
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Hemoglobin", value: "11.2", mark: "low" },
          { label: "WBC", value: "6.4", mark: "ok" },
          { label: "Platelets", value: "248", mark: "ok" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-gray-200 bg-white p-2.5 text-center"
          >
            <div className="text-[10px] font-medium uppercase text-gray-400">
              {m.label}
            </div>
            <div
              className={`mt-1 text-sm font-bold ${
                m.mark === "low"
                  ? "text-alert-600"
                  : "text-emerald-600"
              }`}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>
      <div className="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-teal-700">
        Sample summary · key values highlighted
      </div>
    </div>
  );
}

function MockHospitalChat() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2 text-xs text-white">
          How do I book at Al Shifa?
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2 text-xs text-gray-700">
          Book via the Al Shifa front desk at 021-111-002-002, or online
          through their patient portal. AKUH accepts bookings online at
          aghakanhospitals.org.
        </div>
      </div>
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2 text-xs text-white">
          Do they accept insurance?
        </div>
      </div>
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2 text-xs text-gray-700">
          Both hospitals partner with major insurers. Bring your card and ID;
          the admissions desk will verify coverage.
        </div>
      </div>
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Health profile
        </p>
        <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Up to date
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Heart rate", value: "72 bpm" },
          { label: "BP", value: "118/76" },
          { label: "Glucose", value: "96 mg/dL" },
          { label: "BMI", value: "23.4" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="text-[10px] font-medium uppercase text-gray-400">
              {m.label}
            </div>
            <div className="mt-1 text-sm font-bold text-gray-800">
              {m.value}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-gradient-to-r from-brand-600 to-accent-600 p-3 text-xs text-white">
        <p className="font-semibold">Recommended follow-up</p>
        <p className="mt-1 opacity-90">
          Annual lipid panel + cardiology consult — next 30 days
        </p>
      </div>
    </div>
  );
}

const features = [
  {
    id: "symptom-guide",
    title: "AI Symptom & Test Guidance",
    description:
      "Describe your symptoms and get possible conditions plus suggested tests, each with a confidence score you can inspect.",
    mockup: <MockSymptomChecker />,
    accent: "text-brand-600 bg-brand-50",
  },
  {
    id: "report-analysis",
    title: "Plain-Language Report Analysis",
    description:
      "Upload a lab report and receive an understandable summary with abnormal values highlighted for your doctor visit.",
    mockup: <MockReportAnalysis />,
    accent: "text-teal-600 bg-teal-50",
  },
  {
    id: "hospital-assistant",
    title: "Hospital Knowledge Assistant",
    description:
      "Instant, cited answers about services, departments, appointments, and insurance at AKUH and Al Shifa Hospital.",
    mockup: <MockHospitalChat />,
    accent: "text-indigo-600 bg-indigo-50",
  },
  {
    id: "health-profile",
    title: "Personal Health Profile",
    description:
      "Track vitals, appointments, past AI conversations, and recommended follow-ups in one privacy-first dashboard.",
    mockup: <MockDashboard />,
    accent: "text-emerald-600 bg-emerald-50",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Features
          </h2>
          <p className="mt-3 font-heading text-[2rem] font-bold tracking-tight text-gray-900">
            A health assistant that shows its reasoning
          </p>
          <p className="mt-4 text-[1.0625rem] leading-8 text-gray-600">
            Every feature ships a working interface — from diagnostic guidance
            to hospital lookup — so you can judge the experience for yourself.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="card card-hover overflow-hidden"
            >
              <div className="flex items-start gap-4 p-6 pb-4">
                <span
                  className={`flex h-11 w-11 flex-none items-center justify-center rounded-lg ${feature.accent}`}
                >
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 8.25v.007m-2.25 7.49l1.5-1.5m-8.25-3h16.5"
                    />
                  </svg>
                </span>
                <div>
                  <h3 className="text-[1.375rem] font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
              <div className="mx-6 mb-6 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/60">
                {feature.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}