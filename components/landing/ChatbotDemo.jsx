import Link from "next/link";

const CHATBASE_AGENT_ID = "j2fgtClSFXZi_k4qdHnv7";

const exampleQuestions = [
  "What departments does AKUH offer?",
  "How do I book an appointment at Al Shifa?",
  "What are AKUH visiting hours?",
  "Does Al Shifa accept insurance?",
];

export default function ChatbotDemo() {
  return (
    <section id="assistant" className="relative overflow-hidden bg-white py-24 sm:py-28">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 rounded-full bg-teal-100/40 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-600">
            Try the AI Assistant
          </h2>
          <p className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
            Ask it live. It&apos;s trained on real hospital knowledge.
          </p>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            This is the production assistant running on Chatbase, focused on
            the Aga Khan University Hospital and Al Shifa Hospital knowledge
            bases. Try one of the questions below.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-3">
          {exampleQuestions.map((q) => (
            <span
              key={q}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-card transition-transform hover:-translate-y-0.5 cursor-pointer"
            >
              <svg className="mr-1.5 h-4 w-4 text-accent-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              {q}
            </span>
          ))}
        </div>

        <div className="card mx-auto mt-10 max-w-4xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-gray-800">
                Medisynix AI Assistant
              </span>
              <span className="glass inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-gray-600">
                Live · Chatbase
              </span>
            </div>
            <Link
              href="/dashboard/patient/ai-doctor"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Open full assistant →
            </Link>
          </div>
          <iframe
            src={`https://www.chatbase.co/chatbot-iframe/${CHATBASE_AGENT_ID}`}
            title="Medisynix AI Assistant"
            className="h-[600px] w-full border-0"
            allow="microphone"
          />
        </div>
      </div>
    </section>
  );
}