import Link from "next/link";
import Image from "next/image";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Sign up", href: "/signup" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Tax guide", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-pw-border bg-pw-bg px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/paywise-icon.svg"
                alt="PayWise"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="font-semibold text-pw-text">PayWise</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-pw-text-secondary">
              Give to Caesar! Keep your own. Tax estimates, deadlines, and calm
              books for Nigerian freelancers.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-pw-text">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-pw-text-secondary transition-colors hover:text-pw-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-pw-border pt-8 sm:flex-row">
          <p className="text-xs text-pw-text-tertiary">
            © {new Date().getFullYear()} PayWise
          </p>
          <p className="text-center text-xs text-pw-text-tertiary sm:text-right">
            We never share your data with the NRS unless you ask us to.
          </p>
        </div>
      </div>
    </footer>
  );
}
