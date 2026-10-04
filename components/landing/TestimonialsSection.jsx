const featured = {
  quote:
    "As a radiologist, Medisynix has transformed my workflow. The AI surfaces subtle abnormalities in scans that are easy to miss, and it explains its reasoning — so I can verify every suggestion before it reaches a patient record.",
  author: "Dr. Michael Chen",
  role: "Radiologist",
  initials: "MC",
  tone: "bg-brand-700",
};

const supporting = [
  {
    quote:
      "Medisynix's symptom checker helped me spot a condition two doctors hadn't caught. It suggested the exact test that confirmed it.",
    author: "Sarah Johnson",
    role: "Patient",
    initials: "SJ",
    tone: "bg-accent-600",
  },
  {
    quote:
      "Our hospital saw a measurable drop in diagnostic turnaround time. The plain-language report summaries save our clinical team hours every week.",
    author: "Dr. Emily Rodriguez",
    role: "Hospital Administrator",
    initials: "ER",
    tone: "bg-indigo-600",
  },
  {
    quote:
      "I uploaded lab results and got a clear breakdown of what mattered — with the worryingly high values highlighted for my doctor.",
    author: "Robert Patel",
    role: "Patient",
    initials: "RP",
    tone: "bg-emerald-600",
  },
];

function Avatar({ initials, tone }) {
  return (
    <div
      className={`flex h-11 w-11 flex-none items-center justify-center rounded-full text-sm font-bold text-white ${tone}`}
    >
      {initials}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-gray-50 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Testimonials
          </h2>
          <p className="mt-3 font-heading text-[2rem] font-bold tracking-tight text-gray-900">
            Trusted by patients and clinicians
          </p>
        </div>

        {/* Featured quote */}
        <div className="card mx-auto mt-16 max-w-4xl p-8 sm:p-10">
          <svg className="h-8 w-8 text-brand-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.583 17.321C8.553 16.227 8 15 8 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm-8 0C.553 16.227 0 15 0 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C6.409 11.678 7.831 13.159 7.831 15a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
          </svg>
          <blockquote className="mt-6 text-xl leading-relaxed text-gray-800 sm:text-2xl sm:leading-relaxed">
            “{featured.quote}”
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-4">
            <Avatar initials={featured.initials} tone={featured.tone} />
            <div>
              <div className="font-semibold text-gray-900">
                {featured.author}
              </div>
              <div className="text-sm text-gray-500">{featured.role}</div>
            </div>
          </figcaption>
        </div>

        {/* Supporting quotes */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {supporting.map((t) => (
            <figure key={t.author} className="card card-hover p-6">
              <blockquote className="text-base leading-7 text-gray-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar initials={t.initials} tone={t.tone} />
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t.author}
                  </div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}