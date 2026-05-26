import { AppPage } from "@/components/layout/app-page";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppPage centered showHeader>
      {children}
    </AppPage>
  );
}
