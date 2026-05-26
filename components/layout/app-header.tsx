import Link from "next/link";

type AppHeaderProps = {
  showNav?: boolean;
};

export function AppHeader({ showNav = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-pw-border bg-pw-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold text-pw-text"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pw-cta text-xs font-bold text-white">
            P
          </span>
          PayWise
        </Link>

        {showNav && (
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-sm text-pw-text-secondary transition-colors hover:bg-pw-bg-subtle hover:text-pw-text"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-pw-text-secondary transition-colors hover:bg-pw-bg-subtle hover:text-pw-text"
            >
              Log in
            </Link>
            <Link
              href="/"
              className="hidden rounded-md px-3 py-1.5 text-sm text-pw-text-secondary transition-colors hover:bg-pw-bg-subtle hover:text-pw-text sm:inline"
            >
              Home
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
