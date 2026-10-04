import { EnvelopeIcon, CodeBracketIcon, ClockIcon } from "@heroicons/react/24/outline";
import ContactForm from "./ContactForm";

const details = [
  {
    icon: EnvelopeIcon,
    title: "Email",
    // Placeholder address: shown as text only, intentionally not a mailto link
    text: "contact@medisynix.com",
    interactive: true,
  },
  {
    icon: CodeBracketIcon,
    title: "Project on GitHub",
    text: "github.com/dvlprasher5",
    href: "https://github.com/dvlprasher5",
    external: true,
  },
  {
    icon: ClockIcon,
    title: "Replies",
    text: "We answer messages by email.",
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden bg-white py-24 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent-600">Contact</h2>
          <p className="mt-3 font-heading text-[2rem] font-bold tracking-tight text-gray-900">Get in touch</p>
          <p className="mt-4 text-[1.0625rem] leading-8 text-gray-600">
            Questions, feedback or ideas for Medisynix? Send us a message and we&apos;ll get back to you.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-10 lg:grid-cols-5">
          <ul className="space-y-4 lg:col-span-2">
            {details.map(({ icon: Icon, title, text, href, external, interactive }) => {
              const body = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{title}</span>
                    <span className="mt-0.5 block break-words text-sm leading-6 text-gray-600">{text}</span>
                  </span>
                </>
              );
              const base = "flex items-start gap-4 rounded-xl bg-white p-4 ring-1 ring-gray-200";
              const hoverable =
                "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:ring-primary-200";
              return (
                <li key={title}>
                  {href ? (
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`${base} ${hoverable}`}
                    >
                      {body}
                    </a>
                  ) : (
                    // Not a link: the pointer cursor and hover lift are purely visual
                    <div className={interactive ? `${base} ${hoverable} cursor-pointer` : base}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
