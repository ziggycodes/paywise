import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { cn } from "@/lib/utils";

type AppPageProps = {
  children: ReactNode;
  className?: string;
  centered?: boolean;
  showHeader?: boolean;
  narrow?: boolean;
};

export function AppPage({
  children,
  className,
  centered = false,
  showHeader = true,
  narrow = false,
}: AppPageProps) {
  return (
    <div className="min-h-screen bg-pw-bg text-pw-text">
      {showHeader && <AppHeader />}
      <main
        className={cn(
          "mx-auto px-4 py-8 sm:px-6 sm:py-10",
          narrow ? "max-w-2xl" : "max-w-6xl",
          centered && "flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center py-12",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
