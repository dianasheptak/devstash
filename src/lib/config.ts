import "server-only";

const TRUTHY = new Set(["true", "1", "yes"]);
const FALSY = new Set(["false", "0", "no"]);

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) return fallback;
  const v = raw.trim().toLowerCase();
  if (TRUTHY.has(v)) return true;
  if (FALSY.has(v)) return false;
  return fallback;
}

export function isEmailVerificationEnabled(): boolean {
  return parseBool(process.env.EMAIL_VERIFICATION_ENABLED, true);
}
