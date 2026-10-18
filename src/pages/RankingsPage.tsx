import { useMemo, useState } from "react";
import { Contestant, CATEGORIES } from "@/lib/types";
import { useContestants, usePinned } from "@/lib/hooks";
import { ContestantCard } from "@/components/ContestantCard";
import { VoteModal, ContestantDetailModal } from "@/components/Modals";
import { Search, SlidersHorizontal } from "lucide-react";
import { classNames } from "@/lib/utils";

interface RankingsPageProps {
  onOpenProfile?: (contestantId: string) => void;
}

type FilterPill = { id: string; label: string };

const GENDER_FILTERS: FilterPill[] = [
  { id: "all", label: "All" },
  { id: "Male", label: "Male" },
  { id: "Female", label: "Female" },
];

const CATEGORY_FILTERS: FilterPill[] = [
  { id: "all", label: "All categories" },
  ...CATEGORIES.map((c) => ({ id: c, label: c })),
];

export function RankingsPage({ onOpenProfile }: RankingsPageProps) {
  const { contestants, loading } = useContestants();
  const { pinnedIds, togglePin } = usePinned();
  const [voteTarget, setVoteTarget] = useState<Contestant | null>(null);
  const [detailTarget, setDetailTarget] = useState<Contestant | null>(null);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("all");
  const [category, setCategory] = useState("all");
  const [university, setUniversity] = useState("all");

  const universities = useMemo(() => {
    const set = new Set(contestants.map((c) => c.university).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [contestants]);

  const filtered = useMemo(() => {
    return contestants.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.full_name.toLowerCase().includes(q) && !c.university.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q)) return false;
      }
      if (gender !== "all" && c.gender !== gender) return false;
      if (category !== "all" && c.category !== category) return false;
      if (university !== "all" && c.university !== university) return false;
      return true;
    });
  }, [contestants, search, gender, category, university]);

  return (
    <div className="bg-vibe min-h-screen pb-24 lg:pb-12 bg-grid relative">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative">
        <h1 className="font-display font-extrabold text-3xl text-white">Competitors</h1>
        <p className="text-white/50 text-sm mt-1">Search and filter every approved contestant</p>

        {/* Search */}
        <div className="relative mt-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a contestant..."
            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-ink-700 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors"
          />
        </div>

        {/* Filter pills */}
        <div className="mt-4 space-y-2.5">
          {/* Category row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <SlidersHorizontal className="h-4 w-4 text-white/40 shrink-0" />
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setCategory(f.id)}
                className={classNames(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                  category === f.id
                    ? "bg-brand-500 text-ink-900 border-brand-500"
                    : "bg-ink-700 text-white/60 border-white/10 hover:border-white/20"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Gender row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {GENDER_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setGender(f.id)}
                className={classNames(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                  gender === f.id
                    ? "bg-brand-500/20 text-brand-400 border-brand-400/40"
                    : "bg-ink-700 text-white/60 border-white/10 hover:border-white/20"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* University row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {universities.map((u) => (
              <button
                key={u}
                onClick={() => setUniversity(u)}
                className={classNames(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                  university === u
                    ? "bg-accent-400/20 text-accent-400 border-accent-400/40"
                    : "bg-ink-700 text-white/50 border-white/10 hover:border-white/20"
                )}
              >
                {u === "all" ? "All campuses" : u}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 text-xs text-white/40">
          {filtered.length} contestant{filtered.length !== 1 ? "s" : ""}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2.5 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer-bg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 text-center text-white/40">
            <p>No contestants match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2.5 mt-4">
            {filtered.map((c, i) => (
              <ContestantCard
                key={c.id}
                contestant={c}
                rank={i + 1}
                onVote={setVoteTarget}
                onPin={togglePin}
                pinned={pinnedIds.has(c.id)}
                onClick={(contestant) => onOpenProfile ? onOpenProfile(contestant.id) : setDetailTarget(contestant)}
              />
            ))}
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
