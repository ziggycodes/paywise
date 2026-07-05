import Link from "next/link";
import Image from "next/image";

type AppHeaderProps = {
  showNav?: boolean;
};

export function AppHeader({ showNav = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-pw-border bg-pw-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex cursor-pointer items-center gap-2 text-[15px] font-semibold text-pw-text"
        >
          <Image
            src="/paywise-icon.svg"
            alt="PayWise"
            width={28}
            height={28}
            className="h-7 w-7"
            priority
          />
          PayWise
        </Link>

        {showNav && (
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="cursor-pointer rounded-md px-3 py-1.5 text-sm text-pw-text-secondary transition-colors hover:bg-pw-bg-subtle hover:text-pw-text"
            >
              Log in
            </Link>
            <Link
              href="/"
              className="hidden cursor-pointer rounded-md px-3 py-1.5 text-sm text-pw-text-secondary transition-colors hover:bg-pw-bg-subtle hover:text-pw-text sm:inline"
            >
              Home
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
