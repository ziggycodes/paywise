import { AuthForm } from "@/components/auth/auth-form";
import { AppPage } from "@/components/layout/app-page";

export default function SignupPage() {
  return (
    <AppPage centered showHeader>
      <AuthForm mode="signup" />
    </AppPage>
  );
}
