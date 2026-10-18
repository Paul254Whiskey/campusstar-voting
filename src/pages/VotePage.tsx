import { useMemo, useState } from "react";
import { Contestant, VOTE_PACKAGES, VotePackage, SUPPORT_PHONE } from "@/lib/types";
import { useContestants } from "@/lib/hooks";
import { Avatar } from "@/components/Avatar";
import { VoteModal } from "@/components/Modals";
import { Search, Zap, Heart, Phone, Check, Music2, Sparkles } from "lucide-react";
import { classNames, formatVotes } from "@/lib/utils";
import { EqualizerBars } from "@/components/Vibes";

interface VotePageProps {}

export function VotePage({}: VotePageProps) {
  const { contestants, loading } = useContestants();
  const [search, setSearch] = useState("");
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<VotePackage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return contestants;
    const q = search.toLowerCase();
    return contestants.filter((c) => c.full_name.toLowerCase().includes(q) || c.university.toLowerCase().includes(q));
  }, [contestants, search]);

  const totalVotes = selectedPkg ? selectedPkg.votes + selectedPkg.bonus : 0;

  function openModal() {
    if (selectedContestant && selectedPkg) setModalOpen(true);
  }

  return (
    <div className="bg-vibe min-h-screen pb-32 lg:pb-32 bg-grid relative">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative">
        <div className="flex items-center gap-2 mb-1">
          <Music2 className="h-5 w-5 text-vibe-pink" />
          <EqualizerBars className="h-5" />
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">A little love goes a long way</h1>
        <p className="text-white/50 text-sm mt-2 flex items-center gap-1.5">
          <Heart className="h-4 w-4 text-flame-400" fill="currentColor" /> 1 vote = KES 10
        </p>

        {/* Pricing grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VOTE_PACKAGES.map((p) => {
            const total = p.votes + p.bonus;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPkg(p)}
                className={classNames(
                  "relative rounded-2xl p-4 text-left border-2 transition-all active:scale-95",
                  selectedPkg?.id === p.id
                    ? "border-brand-400 bg-brand-500/10"
                    : p.highlighted
                      ? "border-brand-400/50 bg-brand-500/5 hover:border-brand-400"
                      : "border-white/10 bg-ink-700/60 hover:border-white/20"
                )}
              >
                {p.label && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-brand-500 text-ink-900 text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                    {p.label}
                  </span>
                )}
                {selectedPkg?.id === p.id && (
                  <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-ink-900" strokeWidth={3} />
                  </span>
                )}
                <div className="font-display font-extrabold text-white text-2xl leading-none">{p.votes}</div>
                <div className="text-white/40 text-xs mt-0.5">vote{p.votes !== 1 ? "s" : ""}</div>
                {p.bonus > 0 && (
                  <div className="mt-2 inline-block px-2 py-0.5 rounded-md bg-brand-500/15 text-brand-400 text-[10px] font-bold">
                    +{p.bonus} bonus
                  </div>
                )}
                <div className="mt-3 font-bold text-accent-400 text-lg">KES {p.priceKes.toLocaleString()}</div>
                {p.bonus > 0 && <div className="text-[10px] text-white/30 mt-0.5">= {total} total votes</div>}
              </button>
            );
          })}
        </div>

        {selectedPkg && (
          <div className="mt-5 rounded-2xl bg-ink-700/60 border border-brand-400/30 p-4 flex items-center justify-between animate-slide-up">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 font-semibold">Selected package</div>
              <div className="font-display font-bold text-white text-lg">
                {selectedPkg.votes} votes{selectedPkg.bonus > 0 ? ` + ${selectedPkg.bonus} bonus` : ""} = {totalVotes} total
              </div>
            </div>
            <div className="font-display font-extrabold text-accent-400 text-2xl">KES {selectedPkg.priceKes.toLocaleString()}</div>
          </div>
        )}

        {/* Contestant picker */}
        <div className="mt-8">
          <h2 className="font-display font-bold text-xl text-white">
            {selectedPkg ? "Who are you voting for?" : "Pick a package above, then choose a contestant"}
          </h2>

          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search a contestant..."
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-ink-700 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors"
            />
          </div>

          {loading ? (
            <div className="space-y-2 mt-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl shimmer-bg" />)}
            </div>
          ) : (
            <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContestant(c)}
                  className={classNames(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.99]",
                    selectedContestant?.id === c.id
                      ? "border-brand-400 bg-brand-500/10"
                      : "border-white/5 bg-ink-700/50 hover:border-white/15"
                  )}
                >
                  <Avatar id={c.id} firstName={c.first_name} lastName={c.last_name} imageUrl={c.profile_image_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{c.full_name}</div>
                    <div className="text-xs text-white/40 truncate">{c.category} · {c.university}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-brand-400 text-sm font-bold tabular-nums">{formatVotes(c.votes_count)}</div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider">votes</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-white/30">
          Paid via M-Pesa STK push · Votes add to leaderboard instantly · Trouble? Call{" "}
          <a href={`tel:${SUPPORT_PHONE}`} className="text-brand-400 font-semibold">{SUPPORT_PHONE}</a>
        </div>
      </div>

      {/* Sticky CTA */}
      {selectedContestant && selectedPkg && (
        <div className="fixed bottom-20 lg:bottom-6 inset-x-0 z-30 px-4 animate-slide-up">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={openModal}
              className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-ink-900 font-display font-extrabold text-base transition-all active:scale-[0.98] shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-2"
            >
              <Zap className="h-5 w-5" fill="currentColor" />
              Pay KES {selectedPkg.priceKes.toLocaleString()} for {totalVotes} votes via M-Pesa
            </button>
          </div>
        </div>
      )}

      {modalOpen && selectedContestant && (
        <VoteModal
          contestant={selectedContestant}
          initialPkg={selectedPkg}
          onClose={() => setModalOpen(false)}
          onVoted={() => { setModalOpen(false); setSelectedContestant(null); setSelectedPkg(null); }}
        />
      )}
    </div>
  );
}
