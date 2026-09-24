const items = [
  {
    title: "Medical disclaimer",
    body: "Medisynix provides informational assistance only and does not replace professional medical diagnosis, treatment, or consultation. Always consult a qualified healthcare provider for medical decisions, and call emergency services in urgent situations.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    tone: "text-alert-600 bg-alert-100",
  },
  {
    title: "AI limitations",
    body: "AI responses depend on the knowledge configured in the Chatbase knowledge base and may be incomplete or outdated. Verify important healthcare information directly with the relevant hospital or provider.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
    tone: "text-indigo-600 bg-indigo-50",
  },
  {
    title: "Data privacy",
    body: "The platform is designed around a privacy-first approach: health data stays in your own account and is not used to train shared AI models. Chatbase conversations are subject to Chatbase's own data handling policies.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    tone: "text-teal-600 bg-teal-50",
  },
];

export default function Disclaimer() {
  return (
    <section
      id="disclaimer"
      className="border-t border-gray-200 bg-white py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Trust &amp; safety
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Informational assistance, with clear guardrails
          </p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 p-7"
            >
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${item.tone}`}
              >
                {item.icon}
              </span>
              <h3 className="mt-5 text-lg font-bold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-gray-600">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}