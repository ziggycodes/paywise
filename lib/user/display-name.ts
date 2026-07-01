export type NameFields = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
};

export function splitFullName(fullName: string): {
  first_name: string;
  last_name: string | null;
} {
  const trimmed = fullName.trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) {
    return { first_name: trimmed, last_name: null };
  }
  return {
    first_name: trimmed.slice(0, spaceIdx),
    last_name: trimmed.slice(spaceIdx + 1).trim() || null,
  };
}

export function getFirstName(fullName: string | null | undefined): string | null {
  if (!fullName?.trim()) return null;
  const first = fullName.trim().split(/\s+/)[0];
  return first || null;
}

export function resolveFirstName(fields: NameFields): string | null {
  if (fields.first_name?.trim()) return fields.first_name.trim();
  return getFirstName(fields.full_name);
}

export function resolveFullName(fields: NameFields): string {
  if (fields.full_name?.trim()) return fields.full_name.trim();
  const first = fields.first_name?.trim() ?? "";
  const last = fields.last_name?.trim() ?? "";
  return `${first} ${last}`.trim();
}

export function dashboardGreeting(firstName: string | null): string {
  return firstName ? `Hello, ${firstName}` : "Hello";
}
