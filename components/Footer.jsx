import Link from "next/link";
import Logo from "./Logo";

const columns = [
  {
    label: "Product",
    links: [
      { name: "Home", href: "/" },
      { name: "Features", href: "/#features" },
      { name: "How It Works", href: "/#how-it-works" },
      { name: "Try the Assistant", href: "/#assistant" },
      { name: "Whitepaper", href: "/white-paper" },
      { name: "Contact", href: "/#contact" },
    ],
  },
  {
    label: "Hospital Partners",
    links: [
      {
        name: "Aga Khan University Hospital",
        href: "/#assistant",
        note: "Departments, services & appointment guidance in the knowledge base",
      },
      {
        name: "Al Shifa Hospital",
        href: "/#assistant",
        note: "Clinic hours, booking & insurance information",
      },
    ],
  },
  {
    label: "Project Info",
    links: [
      { name: "GitHub", href: "https://github.com/dvlprasher5", external: true },
    ],
  },
  {
    label: "Legal & Trust",
    links: [{ name: "Medical Disclaimer", href: "/#disclaimer" }],
  },
];

const socials = [
  {
    name: "GitHub",
    href: "https://github.com/dvlprasher5",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer
      className="border-t border-slate-800 bg-slate-950 text-slate-300"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-3">
            <Link href="/" aria-label="Medisynix home" className="inline-flex transition-opacity hover:opacity-90">
              <Logo className="h-9 sm:h-11" variant="light" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              An AI-powered healthcare assistant bringing Aga Khan University
              Hospital and Al Shifa Hospital knowledge to anyone, with clarity
              and trust.
            </p>
            <div className="mt-6 flex gap-4">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-4">
            {columns.map((col) => (
              <div key={col.label}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                  {col.label}
                </h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        {...(link.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="text-sm text-slate-400 transition-colors hover:text-white"
                      >
                        {link.name}
                      </Link>
                      {link.note && (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {link.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Medisynix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}