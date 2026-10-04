import Link from "next/link";

const messages = [
  {
    role: "user",
    text: "What cardiology services does AKUH offer?",
  },
  {
    role: "assistant",
    text: "Aga Khan University Hospital's cardiology department provides diagnostic imaging, interventional procedures like angioplasty, and preventive cardiology clinics. Would you like appointment guidance?",
    confidence: 94,
    sources: "AKUH Knowledge Base",
  },
  {
    role: "user",
    text: "What are the visiting hours?",
  },
  {
    role: "assistant",
    text: "AKUH runs 24/7 emergency services; outpatient clinics open 08:00–17:00 Mon–Sat. For Al Shifa Hospital, clinic hours are 09:00–16:00.",
    confidence: 91,
    sources: "Al Shifa Knowledge Base",
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Layered background glow behind the mockup */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute -top-32 right-[10%] h-[420px] w-[420px] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[360px] w-[360px] rounded-full bg-teal-100/50 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[280px] w-[280px] rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Copy */}
          <div className="max-w-xl">
            <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-brand-800">
              <span className="h-2 w-2 rounded-full bg-accent-500" />
              AI-powered healthcare assistant
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-[2.75rem] lg:text-[3.25rem]">
              Clinical answers you can{" "}
              <span className="bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">
                trust
              </span>
            </h1>
            <p className="mt-6 text-[1.25rem] leading-relaxed text-gray-600">
              Medisynix answers your healthcare questions in plain language —
              trained on the Aga Khan University Hospital and Al Shifa Hospital
              knowledge base, with AI explainability on every recommendation.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link href="#assistant" className="btn btn-secondary">
                Try the AI Assistant
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              No credit card required · Privacy-first by design
            </p>
          </div>

          {/* Chat mockup — floating above the page, subtle tilt that straightens on hover */}
          <div className="group relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-brand-600/10 via-transparent to-accent-500/10 blur-2xl"
            />
            <div className="relative rounded-2xl bg-white shadow-hero ring-1 ring-black/5 transition-transform duration-300 group-hover:rotate-0 rotate-[-1.5deg] sm:rotate-[-2deg] max-sm:rotate-0">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
                <span className="h-3 w-3 rounded-full bg-rose-300" />
                <span className="h-3 w-3 rounded-full bg-amber-300" />
                <span className="h-3 w-3 rounded-full bg-emerald-300" />
                <span className="ml-3 inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                  </svg>
                  Medisynix Assistant
                </span>
              </div>

              {/* Conversation */}
              <div className="space-y-4 p-6">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-3 text-sm text-white shadow-raised">
                    What cardiology services does AKUH offer?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-sm text-gray-800">
                    AKUH&apos;s cardiology department provides diagnostic
                    imaging, interventional procedures like angioplasty, and
                    preventive cardiology clinics.
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-brand-800">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Confidence 94%
                      </span>
                      <span className="glass inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-teal-700">
                        AI analyzed — AKUH KB
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-3 text-sm text-white shadow-raised">
                    What are the visiting hours?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-sm text-gray-800">
                    AKUH runs 24/7 emergency services; outpatient clinics open
                    08:00–17:00 Mon–Sat. Al Shifa Hospital clinics run
                    09:00–16:00.
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div className="border-t border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
                  <span className="flex-1 text-sm text-gray-400">
                    Ask about hospitals, symptoms, or services…
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-raised">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}