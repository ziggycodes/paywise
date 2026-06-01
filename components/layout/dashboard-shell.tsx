import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding/profile", label: "Onboarding" },
];

export function DashboardShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-pw-bg text-pw-text">
      <div className="mx-auto flex max-w-6xl">
        <aside className="hidden w-52 shrink-0 border-r border-pw-border py-6 pr-6 md:block">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 text-[15px] font-semibold"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pw-highlight text-xs font-bold text-white">
              P
            </span>
            PayWise
          </Link>
          <nav className="mt-8 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-2 py-1.5 text-sm text-pw-text-secondary transition-colors hover:bg-pw-bg-subtle hover:text-pw-text"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 border-t border-pw-border pt-6">
            <Link
              href="/"
              className="block px-2 text-xs text-pw-text-tertiary hover:text-pw-text"
            >
              ← Back to home
            </Link>
          </div>
        </aside>

        <div className={cn("min-w-0 flex-1", className)}>
          <header className="flex items-center justify-between border-b border-pw-border px-4 py-4 md:hidden">
            <Link href="/" className="font-semibold text-pw-text">
              PayWise
            </Link>
            <Link
              href="/"
              className="text-sm text-pw-text-secondary hover:text-pw-text"
            >
              Home
            </Link>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
