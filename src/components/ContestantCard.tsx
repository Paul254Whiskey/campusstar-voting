import { BadgeCheck, Flame } from "lucide-react";
import { Avatar } from "./Avatar";
import { Contestant } from "@/lib/types";
import { classNames, formatVotes, socialUrl } from "@/lib/utils";
import { Instagram, Music2 } from "lucide-react";

interface ContestantCardProps {
  contestant: Contestant;
  rank?: number;
  onVote?: (c: Contestant) => void;
  onPin?: (c: Contestant) => void;
  pinned?: boolean;
  onClick?: (c: Contestant) => void;
  variant?: "leaderboard" | "compact";
}

export function ContestantCard({
  contestant, rank, onVote, onPin, pinned, onClick, variant = "leaderboard",
}: ContestantCardProps) {
  const c = contestant;
  return (
    <div
      className={classNames(
        "group relative rounded-2xl bg-ink-700/60 border border-white/5 p-4 transition-all duration-300 neon-glow",
        "hover:border-brand-400/40 hover:bg-ink-600/60 cursor-pointer animate-slide-up",
        variant === "leaderboard" && "flex items-center gap-4"
      )}
      onClick={() => onClick?.(c)}
    >
      {rank !== undefined && (
        <div className="flex flex-col items-center justify-center w-10 shrink-0">
          <span
            className={classNames(
              "font-display font-extrabold text-2xl tabular-nums",
              rank <= 3 ? "text-gradient" : "text-white/40"
            )}
          >
            {String(rank).padStart(2, "0")}
          </span>
          {rank === 1 && <span className="text-xs text-accent-400 font-semibold">LEAD</span>}
        </div>
      )}

      <Avatar
        id={c.id}
        firstName={c.first_name}
        lastName={c.last_name}
        imageUrl={c.profile_image_url}
        size="md"
        ring={rank === 1}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-display font-bold text-white truncate text-base">{c.full_name}</h3>
          {c.is_verified && <BadgeCheck className="h-4 w-4 text-brand-400 shrink-0" fill="currentColor" />}
          {c.is_trending && (
            <span className="inline-flex items-center gap-0.5 text-flame-400 text-xs font-semibold shrink-0">
              <Flame className="h-3.5 w-3.5" fill="currentColor" />
            </span>
          )}
        </div>
        <p className="text-xs text-white/50 mt-0.5 truncate">
          {c.category} · {c.gender} · {c.university}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {(c.social_handles?.instagram || c.social_handles?.tiktok) && (
            <div className="flex items-center gap-1.5">
              {c.social_handles.instagram && (
                <a
                  href={socialUrl("instagram", c.social_handles.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-white/40 hover:text-brand-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-3.5 w-3.5" />
                </a>
              )}
              {c.social_handles.tiktok && (
                <a
                  href={socialUrl("tiktok", c.social_handles.tiktok)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-white/40 hover:text-brand-400 transition-colors"
                  aria-label="TikTok"
                >
                  <Music2 className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="text-right">
          <div className="font-display font-extrabold text-brand-400 text-xl tabular-nums leading-none">
            {formatVotes(c.votes_count)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">votes</div>
        </div>
        <div className="flex items-center gap-1.5">
          {onPin && (
            <button
              onClick={(e) => { e.stopPropagation(); onPin(c); }}
              className={classNames(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                pinned
                  ? "bg-accent-400/20 text-accent-400"
                  : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
              )}
              aria-label={pinned ? "Unpin" : "Pin to dashboard"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
              </svg>
            </button>
          )}
          {onVote && (
            <button
              onClick={(e) => { e.stopPropagation(); onVote(c); }}
              className="px-3 h-8 rounded-lg bg-brand-500 hover:bg-brand-400 text-ink-900 text-xs font-bold transition-all active:scale-95"
            >
              Vote
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
