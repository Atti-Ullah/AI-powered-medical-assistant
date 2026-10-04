import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const highlights = [
  {
    icon: ChatBubbleLeftRightIcon,
    title: "AI health assistant",
    text: "Plain-language answers trained on AKUH and Al Shifa Hospital information.",
  },
  {
    icon: CalendarDaysIcon,
    title: "Appointments & records",
    text: "Book visits, review vitals and keep your medical history in one place.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Private by design",
    text: "Your health data is protected and only shared with your care team.",
  },
];

/**
 * Shared split-screen layout for the login and register pages: a branded
 * panel on large screens next to the form card passed as children.
 */
export default function AuthShell({ title, description, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-28 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-100/60 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-5xl items-stretch overflow-hidden rounded-[24px] bg-white shadow-hero lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-10 text-white lg:flex">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent-500/20"
          />

          <div className="relative">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-primary-100 ring-1 ring-inset ring-white/20">
              AI-powered healthcare platform
            </span>
            <h2 className="mt-6 text-[2rem] font-bold leading-tight tracking-tight">
              {title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-primary-100">
              {description}
            </p>
          </div>

          <ul className="relative mt-10 space-y-6">
            {highlights.map(({ icon: Icon, title: itemTitle, text }) => (
              <li key={itemTitle} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
                  <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{itemTitle}</p>
                  <p className="mt-0.5 text-sm leading-5 text-primary-100">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="relative mt-10 text-xs leading-5 text-primary-200">
            Medisynix provides informational assistance and does not replace
            professional medical advice, diagnosis or treatment.
          </p>
        </aside>

        {children}
      </div>
    </div>
  );
}
