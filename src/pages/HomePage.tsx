import { useMemo, useState } from "react";
import { Contestant } from "@/lib/types";
import { LEVELS, SUPPORT_PHONE } from "@/lib/types";
import { useContestants, usePinned } from "@/lib/hooks";
import { ContestantCard } from "@/components/ContestantCard";
import { VoteModal, ContestantDetailModal } from "@/components/Modals";
import { CultureMarquee, EqualizerBars, FloatingVibes } from "@/components/Vibes";
import { Trophy, Zap, ArrowRight, Phone, Flame, Crown, Sparkles, Headphones, Car, PartyPopper, Star, Shield } from "lucide-react";
import { Page } from "@/components/BottomNav";

interface HomePageProps {
  onNavigate: (p: Page) => void;
  onOpenProfile?: (contestantId: string) => void;
}

export function HomePage({ onNavigate, onOpenProfile }: HomePageProps) {
  const { contestants, loading } = useContestants();
  const { pinnedIds, togglePin } = usePinned();
  const [voteTarget, setVoteTarget] = useState<Contestant | null>(null);
  const [detailTarget, setDetailTarget] = useState<Contestant | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const topContestants = useMemo(() => contestants.slice(0, 10), [contestants]);

  const closestRaces = useMemo(() => {
    const byCategory: Record<string, Contestant[]> = {};
    for (const c of contestants) {
      (byCategory[c.category] = byCategory[c.category] || []).push(c);
    }
    const races: { a: Contestant; b: Contestant; gap: number; total: number; label: string }[] = [];
    for (const [cat, list] of Object.entries(byCategory)) {
      list.sort((a, b) => b.votes_count - a.votes_count);
      for (let i = 0; i < list.length - 1; i++) {
        const a = list[i], b = list[i + 1];
        const gap = a.votes_count - b.votes_count;
        if (gap > 0 && gap <= 30) {
          races.push({ a, b, gap, total: a.votes_count + b.votes_count, label: cat });
        }
      }
    }
    races.sort((x, y) => x.gap - y.gap);
    return races.slice(0, 4);
  }, [contestants]);

  const overallLeader = contestants[0];

  return (
    <div className="bg-vibe min-h-screen pb-24 lg:pb-12 relative">
      {/* HERO */}
      <section className="relative overflow-hidden bg-grid">
        <FloatingVibes />
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-8 lg:pt-20 lg:pb-16 relative">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-400/30 text-brand-400 text-xs font-bold uppercase tracking-wider animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" /> Season 2026 · Now LIVE
              <EqualizerBars className="ml-1 h-4" />
            </div>

            <h1 className="mt-5 font-display font-extrabold text-4xl sm:text-5xl lg:text-7xl leading-[1.05] tracking-tight">
              <span className="text-white">Kenya's biggest</span>{" "}
              <span className="text-gradient-vibe">campus creator</span>{" "}
              <span className="text-white">competition</span>
            </h1>

            <p className="mt-4 text-white/60 text-base sm:text-lg max-w-xl">
              Vote for your favourite campus influencers, dancers, comedians and stars.
              Free to enter · Open to every campus · 1 vote = KES 10.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => onNavigate("join")}
                className="px-7 py-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-900 font-display font-extrabold text-base transition-all active:scale-95 animate-pulse-glow shadow-xl shadow-brand-500/20 inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" fill="currentColor" /> Enter free now · Free to enter · Open to every campus
              </button>
              <button
                onClick={() => onNavigate("rankings")}
                className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all active:scale-95"
              >
                See leaderboard
              </button>
            </div>

            {/* Stats strip */}
            <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-lg">
              {[
                { label: "Contestants", value: `${contestants.length}+`, icon: Star },
                { label: "Votes cast", value: `${(contestants.reduce((s, c) => s + c.votes_count, 0)).toLocaleString()}`, icon: Zap },
                { label: "Campuses", value: "40+", icon: Headphones },
              ].map((s) => {
                const I = s.icon;
                return (
                  <div key={s.label} className="rounded-xl bg-white/5 border border-white/5 p-3 neon-glow text-center">
                    <I className="h-4 w-4 text-brand-400 mx-auto mb-1" />
                    <div className="font-display font-extrabold text-2xl text-white">{s.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Decorative floating gradient orbs */}
        <div className="pointer-events-none absolute top-20 -left-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl animate-float" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-vibe-pink/10 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </section>

      {/* CULTURE MARQUEE */}
      <CultureMarquee />

      {/* LEVELS */}
      <section className="max-w-6xl mx-auto px-4 py-6 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {LEVELS.map((lvl, i) => (
            <div
              key={lvl.id}
              className="relative rounded-2xl bg-ink-700/40 border border-white/5 p-4 overflow-hidden group hover:border-brand-400/30 transition-all neon-glow"
            >
              <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-brand-500/5 blur-2xl group-hover:bg-brand-500/15 transition-all" />
              <div className="font-display font-extrabold text-3xl text-white/15">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-1 font-display font-bold text-white text-sm">{lvl.label}</div>
              <div className="text-[11px] text-white/40 mt-0.5">{lvl.sub}</div>
              {i === 0 && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" /> Live
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* LEADING THE RACE */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white flex items-center gap-2">
              <Crown className="h-6 w-6 text-accent-400 animate-wiggle" /> Leading the race
            </h2>
            <p className="text-white/40 text-sm mt-1">Top creators right now across all categories</p>
          </div>
          <button onClick={() => onNavigate("rankings")} className="text-brand-400 hover:text-brand-300 text-sm font-semibold inline-flex items-center gap-1 shrink-0">
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer-bg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {topContestants.map((c, i) => (
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
      </section>

      {/* CLOSEST RACES */}
      {closestRaces.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-1">
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white flex items-center gap-2">
                <Flame className="h-6 w-6 text-flame-400 animate-wiggle" /> Closest races right now
              </h2>
              <p className="text-white/40 text-sm mt-1">Head-to-head battles where every vote counts</p>
            </div>
            <button onClick={() => onNavigate("versus")} className="text-flame-400 hover:text-flame-300 text-sm font-semibold inline-flex items-center gap-1 shrink-0">
              All 1v1 battles <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            {closestRaces.map((race, i) => {
              const total = race.a.votes_count + race.b.votes_count;
              const aPct = total > 0 ? (race.a.votes_count / total) * 100 : 50;
              const statusText = race.gap <= 2 ? "Dead heat — one vote decides it" : `Only ${race.gap} votes apart`;
              return (
                <div key={i} className="rounded-2xl bg-ink-700/50 border border-white/5 p-4 hover:border-flame-400/30 transition-all neon-glow">
                  <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">
                    {race.label} · {race.a.gender} · {race.a.university}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="font-display font-extrabold text-white text-lg tabular-nums w-5 text-center">{1}</div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{race.a.full_name}</div>
                        <div className="text-brand-400 text-xs font-bold">{race.a.votes_count.toLocaleString()}</div>
                      </div>
                    </div>
                    <span className="text-white/30 text-xs font-bold">vs</span>
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{race.b.full_name}</div>
                        <div className="text-brand-400 text-xs font-bold">{race.b.votes_count.toLocaleString()}</div>
                      </div>
                      <div className="font-display font-extrabold text-white/40 text-lg tabular-nums w-5 text-center">{2}</div>
                    </div>
                  </div>

                  <div className="mt-3 h-2.5 rounded-full bg-ink-600 overflow-hidden flex">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500" style={{ width: `${aPct}%` }} />
                    <div className="h-full bg-gradient-to-l from-accent-500/60 to-vibe-pink/40 transition-all duration-500 flex-1" />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-flame-400 font-semibold">{statusText}</span>
                    <button
                      onClick={() => setVoteTarget(race.b)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-400/15 hover:bg-accent-400/25 text-accent-400 text-xs font-bold transition-all active:scale-95"
                    >
                      <Zap className="h-3.5 w-3.5" fill="currentColor" /> Push into 1st
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* GRAND PRIZE BANNER */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-ink-700 via-ink-700 to-ink-600 border border-accent-400/20 p-6 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-transparent to-vibe-pink/10" />
          <div className="absolute inset-0 spotlight opacity-30" />
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-accent-500/20 blur-3xl animate-float-slow" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-vibe-pink/15 blur-3xl animate-float" />

          <div className="relative flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-400/15 border border-accent-400/30 text-accent-400 text-xs font-bold uppercase tracking-wider">
                <Trophy className="h-3.5 w-3.5" /> Grand Prize
              </div>
              <h2 className="mt-4 font-display font-extrabold text-3xl sm:text-4xl text-white leading-tight">
                Win an <span className="text-gradient-sunset">iPhone 18 Pro</span> + KES 500,000 cash
              </h2>
              <p className="mt-3 text-white/60 text-sm max-w-md">
                The national champion takes home the ultimate grand prize plus bragging rights as Kenya's #1 campus creator.
              </p>
              <button
                onClick={() => onNavigate("join")}
                className="mt-5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-400 hover:to-accent-500 text-ink-900 font-display font-extrabold transition-all active:scale-95 shadow-lg shadow-accent-500/20 inline-flex items-center gap-2"
              >
                <Trophy className="h-5 w-5" /> Enter to win
              </button>
            </div>

            {/* Prize visualization */}
            <div className="relative h-48 w-48 sm:h-56 sm:w-56 shrink-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="h-32 w-32 text-accent-400 animate-float drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]" />
              </div>
              <div className="absolute top-2 left-4 h-16 w-16 rounded-xl bg-ink-800 border-2 border-white/10 flex items-center justify-center rotate-[-12deg] shadow-xl animate-float" style={{ animationDelay: "0.5s" }}>
                <span className="text-[8px] font-bold text-white/60 text-center leading-tight">iPhone<br/>18 Pro</span>
              </div>
              <div className="absolute bottom-4 right-2 h-14 w-20 rounded-lg bg-gradient-to-br from-brand-500/30 to-brand-600/40 border border-brand-400/30 flex items-center justify-center rotate-[10deg] shadow-xl animate-float" style={{ animationDelay: "1s" }}>
                <span className="text-[9px] font-display font-extrabold text-brand-300">KES<br/>500K</span>
              </div>
              {/* Floating vibe icons around prize */}
              <Headphones className="absolute top-0 right-0 h-6 w-6 text-vibe-cyan/40 animate-float-slow" />
              <Car className="absolute bottom-0 left-0 h-7 w-7 text-vibe-pink/30 animate-float" style={{ animationDelay: "2s" }} />
              <PartyPopper className="absolute top-1/2 -left-2 h-5 w-5 text-vibe-lime/40 animate-float-slow" style={{ animationDelay: "1.5s" }} />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-4 py-10 border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="font-display font-extrabold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" /> CampusStar
            </div>
            <div className="text-xs text-white/40">Creator voting & fan analytics · © 2026 Campus Star Award</div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`tel:${SUPPORT_PHONE}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-semibold transition-colors">
              <Phone className="h-4 w-4 text-brand-400" /> Call {SUPPORT_PHONE}
            </a>
            <button
              onClick={() => onNavigate("admin")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 text-xs font-semibold transition-colors"
              title="Admin access"
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <VoteModal contestant={voteTarget} onClose={() => setVoteTarget(null)} onVoted={() => setRefreshKey((k) => k + 1)} />
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
