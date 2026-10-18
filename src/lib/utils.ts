export function initials(first: string, last: string): string {
  const f = (first || "").trim().charAt(0).toUpperCase();
  const l = (last || "").trim().charAt(0).toUpperCase();
  return (f + l) || "?";
}

const AVATAR_COLORS = [
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-500",
  "from-violet-500 to-fuchsia-500",
  "from-lime-500 to-green-500",
];

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatVotes(n: number): string {
  return n.toLocaleString("en-US");
}

export function socialUrl(platform: keyof Record<string, string>, handle: string): string {
  const h = handle.replace(/^@/, "").trim();
  if (!h) return "#";
  switch (platform) {
    case "instagram": return `https://instagram.com/${h}`;
    case "tiktok": return `https://tiktok.com/@${h}`;
    case "facebook": return `https://facebook.com/${h}`;
    case "x": return `https://x.com/${h}`;
    default: return "#";
  }
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Voter identity — we use a phone-number keyed local id so pinning persists
// across sessions on the same device without requiring an account.
const VOTER_PHONE_KEY = "campusstar_voter_phone";

export function getVoterPhone(): string {
  return localStorage.getItem(VOTER_PHONE_KEY) || "";
}

export function setVoterPhone(phone: string): void {
  localStorage.setItem(VOTER_PHONE_KEY, phone);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
