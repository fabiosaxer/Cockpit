/** Nur diese E-Mail-Adresse(n) duerfen ins Cockpit. Kommagetrennt in ALLOWED_EMAIL. */
export function isAllowedEmail(email: string | null | undefined): boolean {
  const allowed = (process.env.ALLOWED_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return !!email && allowed.includes(email.toLowerCase());
}
