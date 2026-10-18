import { useMemo, useState } from "react";
import { Contestant, CATEGORIES, UNIVERSITIES } from "@/lib/types";
import { useContestants, usePinned } from "@/lib/hooks";
import { VoteModal, ContestantDetailModal } from "@/components/Modals";
import { Avatar } from "@/components/Avatar";
import { Swords, ChevronRight, Crown, Zap, Trophy } from "lucide-react";
import { classNames, formatVotes } from "@/lib/utils";

interface VersusPageProps {}

interface Battle {
  university: string;
  category: string;
  contestants: Contestant[];
}

export function VersusPage({}: VersusPageProps) {
  const { contestants, loading } = useContestants();
  const { pinnedIds, togglePin } = usePinned();
  const [voteTarget, setVoteTarget] = useState<Contestant | null>(null);
  const [detailTarget, setDetailTarget] = useState<Contestant | null>(null);
  const [filterUniversity, setFilterUniversity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Group contestants by university + category, find groups with 2+ contestants
  const battles = useMemo(() => {
    const groups: Record<string, Battle> = {};
    for (const c of contestants) {
      const key = `${c.university}__${c.category}`;
      if (!groups[key]) {
        groups[key] = { university: c.university, category: c.category, contestants: [] };
      }
      groups[key].contestants.push(c);
    }
    let list = Object.values(groups).filter((g) => g.contestants.length >= 2);
    // Sort each group by votes
    list.forEach((g) => g.contestants.sort((a, b) => b.votes_count - a.votes_count));
    if (filterUniversity !== "all") list = list.filter((g) => g.university === filterUniversity);
    if (filterCategory !== "all") list = list.filter((g) => g.category === filterCategory);
    // Sort battles by total votes desc
    list.sort((a, b) => {
      const aTotal = a.contestants.reduce((s, c) => s + c.votes_count, 0);
      const bTotal = b.contestants.reduce((s, c) => s + c.votes_count, 0);
      return bTotal - aTotal;
    });
    return list;
  }, [contestants, filterUniversity, filterCategory]);

  const availableUniversities = useMemo(() => {
    const set = new Set(contestants.map((c) => c.university).filter(Boolean));
    return Array.from(set).sort();
  }, [contestants]);

  return (
    <div className="bg-vibe min-h-screen pb-24 lg:pb-12 bg-grid relative">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10 relative">
        <div className="flex items-center gap-2">
          <Swords className="h-7 w-7 text-flame-400 animate-wiggle" />
          <h1 className="font-display font-extrabold text-3xl text-white">Campus 1v1 Battles</h1>
        </div>
        <p className="text-white/50 text-sm mt-1">
          Same campus, same category — only one winner advances to inter-campus.
          See who's leading the head-to-head.
        </p>

        {/* Filters */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterUniversity("all")}
              className={classNames(
                "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                filterUniversity === "all"
                  ? "bg-brand-500 text-ink-900 border-brand-500"
                  : "bg-ink-700 text-white/60 border-white/10"
              )}
            >
              All campuses
            </button>
            {availableUniversities.map((u) => (
              <button
                key={u}
                onClick={() => setFilterUniversity(u)}
                className={classNames(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                  filterUniversity === u
                    ? "bg-brand-500 text-ink-900 border-brand-500"
                    : "bg-ink-700 text-white/60 border-white/10"
                )}
              >
                {u}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterCategory("all")}
              className={classNames(
                "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                filterCategory === "all"
                  ? "bg-accent-400/20 text-accent-400 border-accent-400/40"
                  : "bg-ink-700 text-white/50 border-white/10"
              )}
            >
              All categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={classNames(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                  filterCategory === cat
                    ? "bg-accent-400/20 text-accent-400 border-accent-400/40"
                    : "bg-ink-700 text-white/50 border-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 text-xs text-white/40">
          {battles.length} battle{battles.length !== 1 ? "s" : ""}
        </div>

        {/* Battle cards */}
        {loading ? (
          <div className="space-y-3 mt-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-2xl shimmer-bg" />)}
          </div>
        ) : battles.length === 0 ? (
          <div className="mt-10 text-center text-white/40">
            <Swords className="h-10 w-10 mx-auto mb-2 text-white/20" />
            <p>No campus category battles yet. More contestants need to register!</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {battles.map((battle, i) => {
              const leader = battle.contestants[0];
              const challenger = battle.contestants[1];
              const total = leader.votes_count + challenger.votes_count;
              const leaderPct = total > 0 ? (leader.votes_count / total) * 100 : 50;
              const gap = leader.votes_count - challenger.votes_count;
              const isDead = gap <= 5;

              return (
                <div
                  key={`${battle.university}-${battle.category}-${i}`}
                  className="rounded-2xl bg-ink-700/50 border border-white/5 p-4 neon-glow animate-slide-up"
                >
                  {/* Battle header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                        {battle.university}
                      </div>
                      <div className="font-display font-bold text-white text-base">{battle.category}</div>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-flame-500/10 border border-flame-400/20 text-flame-400 text-[10px] font-bold uppercase tracking-wider">
                      <Swords className="h-3 w-3" /> 1v1 · Winner advances
                    </div>
                  </div>

                  {/* VS layout */}
                  <div className="flex items-stretch gap-3">
                    {/* Leader */}
                    <BattleSide
                      contestant={leader}
                      isLeader
                      pct={leaderPct}
                      onVote={setVoteTarget}
                      onClick={setDetailTarget}
                      onPin={togglePin}
                      pinned={pinnedIds.has(leader.id)}
                    />

                    {/* VS divider */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className="h-full w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
                      <div className="my-2 px-2 py-1 rounded-lg bg-ink-800 border border-white/10">
                        <span className="font-display font-extrabold text-flame-400 text-sm">VS</span>
                      </div>
                      <div className="h-full w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
                    </div>

                    {/* Challenger */}
                    <BattleSide
                      contestant={challenger}
                      isLeader={false}
                      pct={100 - leaderPct}
                      onVote={setVoteTarget}
                      onClick={setDetailTarget}
                      onPin={togglePin}
                      pinned={pinnedIds.has(challenger.id)}
                    />
                  </div>

                  {/* Status bar */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className={classNames(
                      "text-xs font-semibold",
                      isDead ? "text-flame-400" : "text-white/40"
                    )}>
                      {isDead ? "🔥 Dead heat — every vote matters!" : `${formatVotes(gap)} votes ahead`}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {battle.contestants.length > 2 && `+${battle.contestants.length - 2} more in this category`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <VoteModal contestant={voteTarget} onClose={() => setVoteTarget(null)} onVoted={() => {}} />
      <ContestantDetailModal
        contestant={detailTarget}
        onClose={() => setDetailTarget(null)}
        onVote={(c) => { setDetailTarget(null); setVoteTarget(c); }}
        onPin={togglePin}
        pinned={detailTarget ? pinnedIds.has(detailTarget.id) : false}
      />
    </div>
  );
}

function BattleSide({
  contestant: c, isLeader, pct, onVote, onClick, onPin, pinned,
}: {
  contestant: Contestant;
  isLeader: boolean;
  pct: number;
  onVote: (c: Contestant) => void;
  onClick: (c: Contestant) => void;
  onPin: (c: Contestant) => void;
  pinned: boolean;
}) {
  return (
    <div className={classNames(
      "flex-1 rounded-xl p-3 border transition-all",
      isLeader ? "bg-brand-500/8 border-brand-400/30" : "bg-ink-800/50 border-white/5"
    )}>
      <div className="flex flex-col items-center text-center" onClick={() => onClick(c)} role="button">
        <div className="relative">
          <Avatar id={c.id} firstName={c.first_name} lastName={c.last_name} imageUrl={c.profile_image_url} size="md" ring={isLeader} className="cursor-pointer" />
          {isLeader && (
            <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-accent-400 flex items-center justify-center shadow-lg">
              <Crown className="h-3.5 w-3.5 text-ink-900" fill="currentColor" />
            </div>
          )}
        </div>
        <div className="mt-2 font-semibold text-white text-sm truncate w-full">{c.full_name}</div>
        <div className="text-[10px] text-white/40">{c.gender}</div>
        <div className="mt-1.5 font-display font-extrabold text-brand-400 text-xl tabular-nums">{formatVotes(c.votes_count)}</div>
        <div className="text-[9px] uppercase tracking-wider text-white/30">votes</div>
      </div>

      {/* Progress bar */}
      <div className="mt-2.5 h-1.5 rounded-full bg-ink-600 overflow-hidden">
        <div
          className={classNames(
            "h-full rounded-full transition-all duration-500",
            isLeader ? "bg-gradient-to-r from-brand-500 to-brand-400" : "bg-gradient-to-r from-accent-500/50 to-vibe-pink/40"
          )}
          style={{ width: `${Math.max(pct, 5)}%` }}
        />
      </div>

      {/* Actions */}
      <div className="mt-2.5 flex gap-1.5">
        <button
          onClick={() => onPin(c)}
          className={classNames(
            "flex-1 h-8 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1",
            pinned ? "bg-accent-400/20 text-accent-400" : "bg-white/5 text-white/40 hover:bg-white/10"
          )}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
          </svg>
          {pinned ? "Pinned" : "Pin"}
        </button>
        <button
          onClick={() => onVote(c)}
          className="flex-[1.5] h-8 rounded-lg bg-brand-500 hover:bg-brand-400 text-ink-900 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
        >
          <Zap className="h-3 w-3" fill="currentColor" /> Vote
        </button>
      </div>
    </div>
  );
}
