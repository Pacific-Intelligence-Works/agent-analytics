/** Personal email domains — block signups from consumer email providers */
const PERSONAL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.net",
  "fastmail.com",
  "tutanota.com",
  "tuta.com",
  "hey.com",
  "inbox.com",
  "mail.ru",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "rediffmail.com",
  "web.de",
  "t-online.de",
  "libero.it",
  "virgilio.it",
  "laposte.net",
  "orange.fr",
  "wanadoo.fr",
  "comcast.net",
  "verizon.net",
  "att.net",
  "sbcglobal.net",
  "cox.net",
  "charter.net",
  "earthlink.net",
  "optonline.net",
  "frontier.com",
  "rocketmail.com",
  "ymail.com",
];

/** Additional blocked domains loaded from BLOCKED_DOMAINS env var (comma-separated) */
const ADDITIONAL_DOMAINS: string[] = (
  process.env.BLOCKED_DOMAINS || ""
)
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const PERSONAL_SET = new Set(PERSONAL_DOMAINS);
const ADDITIONAL_SET = new Set(ADDITIONAL_DOMAINS);

/** Returns true if the email domain is blocked */
export function isBlockedDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  return PERSONAL_SET.has(domain) || ADDITIONAL_SET.has(domain);
}

/** Returns the reason for blocking, or null if allowed */
export function getBlockReason(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return "Invalid email address";

  if (PERSONAL_SET.has(domain)) {
    return "Please use your work email address";
  }

  if (ADDITIONAL_SET.has(domain)) {
    return "Systems are temporarily down. We will notify you when normal operation resumes.";
  }

  return null;
}

/** Returns true if the email is from an additionally blocked domain */
export function isAdditionalBlockedDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return ADDITIONAL_SET.has(domain);
}
