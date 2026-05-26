"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-pw-border bg-pw-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold text-pw-text"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pw-text text-xs font-bold text-white">
            P
          </span>
          PayWise
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-pw-text-secondary transition-colors hover:bg-pw-bg-subtle hover:text-pw-text"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-pw-text-secondary transition-colors hover:bg-pw-bg-subtle hover:text-pw-text"
          >
            Log in
          </Link>
          <Button asChild size="sm" className="ml-2 rounded-md">
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button asChild size="sm" className="rounded-md">
            <Link href="/signup">Start</Link>
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-md p-2 text-pw-text hover:bg-pw-bg-subtle"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-pw-border bg-pw-surface md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-0.5 p-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2.5 text-sm text-pw-text-secondary hover:bg-pw-bg-subtle hover:text-pw-text"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="rounded-md px-3 py-2.5 text-sm text-pw-text-secondary hover:bg-pw-bg-subtle hover:text-pw-text"
            onClick={() => setOpen(false)}
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
