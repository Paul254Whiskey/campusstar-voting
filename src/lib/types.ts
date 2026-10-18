export type Level = "campus" | "inter-campus" | "county" | "national";

export type Gender = "Male" | "Female";

export interface SocialHandles {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  x?: string;
}

export interface Contestant {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  category: string;
  gender: Gender;
  county: string;
  university: string;
  profile_image_url: string | null;
  bio: string;
  hobbies: string;
  fun_facts: string;
  place_of_study: string;
  social_handles: SocialHandles;
  votes_count: number;
  is_verified: boolean;
  is_trending: boolean;
  level: Level;
  status: string;
  created_at: string;
}

export interface Vote {
  id: string;
  contestant_id: string;
  voter_phone: string;
  supporter_name: string | null;
  mpesa_code: string;
  amount_kes: number;
  vote_count: number;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export interface TopSupporter {
  id: string;
  contestant_id: string;
  supporter_name: string;
  voter_phone: string;
  total_votes: number;
  is_anonymous: boolean;
  last_voted_at: string;
  created_at: string;
}

export interface ProfileEditLog {
  id: string;
  contestant_id: string;
  contestant_name?: string;
  changed_fields: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  edited_at: string;
}

export interface PinnedContestant {
  id: string;
  contestant_id: string;
  voter_phone: string;
  created_at: string;
}

export interface Comment {
  id: string;
  contestant_id: string;
  voter_name: string;
  voter_phone: string;
  body: string;
  created_at: string;
}

export interface VotePackage {
  id: string;
  votes: number;
  priceKes: number;
  bonus: number;
  label?: string;
  highlighted?: boolean;
}

export const VOTE_PACKAGES: VotePackage[] = [
  { id: "p1", votes: 1, priceKes: 20, bonus: 0 },
  { id: "p5", votes: 5, priceKes: 100, bonus: 0 },
  { id: "p10", votes: 10, priceKes: 200, bonus: 0, label: "Most popular", highlighted: true },
  { id: "p25", votes: 25, priceKes: 500, bonus: 0 },
  { id: "p50", votes: 50, priceKes: 1000, bonus: 0 },
];

export const COUNTIES = [
  "Nairobi", "Kisumu", "Mombasa", "Nakuru", "Eldoret",
  "Nyeri", "Machakos", "Homabay", "Kakamega", "Meru",
];

export const UNIVERSITIES = [
  "Multimedia University", "Kenyatta University", "University of Nairobi",
  "Technical University of Mombasa", "Strathmore University", "Maseno University",
  "Egerton University", "University of Eldoret", "Jaramogi Oginga Odinga University",
  "Dedan Kimathi University", "Moi University", "Kabarak University",
];

export const CATEGORIES = [
  "TikTok", "Singing", "Comedy", "Dance", "Couple", "Campus Celebrity",
];

export const SUPPORT_PHONE = "0116562662";

export const ADMIN_PASSWORD = "Campus.Admin.254#";

export const LEVELS: { id: Level; label: string; sub: string }[] = [
  { id: "campus", label: "01 Campus", sub: "Your university · LIVE" },
  { id: "inter-campus", label: "02 Inter-campus", sub: "Best across universities" },
  { id: "county", label: "03 County", sub: "Nairobi, Kisumu, Mombasa" },
  { id: "national", label: "04 National", sub: "Kenya's top stars" },
];
