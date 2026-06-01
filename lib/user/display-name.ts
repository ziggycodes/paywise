export function getFirstName(fullName: string | null | undefined): string | null {
  if (!fullName?.trim()) return null;
  const first = fullName.trim().split(/\s+/)[0];
  return first || null;
}

export function dashboardGreeting(firstName: string | null): string {
  return firstName ? `Hello, ${firstName}` : "Hello";
}
