import { useMemo, useState } from "react";
import { Contestant } from "@/lib/types";
import { useContestants, usePinned } from "@/lib/hooks";
import { ContestantCard } from "@/components/ContestantCard";
import { VoteModal, ContestantDetailModal } from "@/components/Modals";
import { Avatar } from "@/components/Avatar";
import { Crown, Pin, TrendingUp, Phone, BadgeCheck, Flame, Star, AlarmClock } from "lucide-react";
import { formatVotes, getVoterPhone, setVoterPhone } from "@/lib/utils";
import { SUPPORT_PHONE } from "@/lib/types";
import { Countdown } from "@/components/Countdown";
import { Page } from "@/components/BottomNav";

const VOTING_CLOSE_DATE = "2026-12-31T23:59:59+03:00";

interface DashboardPageProps {
  onNavigate: (p: Page) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { contestants, loading } = useContestants();
  const { pinnedIds, togglePin } = usePinned();
  const [voteTarget, setVoteTarget] = useState<Contestant | null>(null);
  const [detailTarget, setDetailTarget] = useState<Contestant | null>(null);
  const [phoneInput, setPhoneInput] = useState(getVoterPhone());
  const [phoneSaved, setPhoneSaved] = useState(!!getVoterPhone());

  const voterPhone = getVoterPhone();

  const pinned = useMemo(
    () => contestants.filter((c) => pinnedIds.has(c.id)),
    [contestants, pinnedIds]
  );

  const overallLeader = contestants[0];

  // Trending: sorted by votes in descending, pick top 5 with trending flag or top movers
  const trending = useMemo(
    () => contestants.filter((c) => c.is_trending).slice(0, 5),
    [contestants]
  );

  function savePhone() {
    if (phoneInput.length < 10) return;
    setVoterPhone(phoneInput);
    setPhoneSaved(true);
    // Reload to refresh pinned state
    setTimeout(() => window.location.reload(), 300);
  }

  return (
    <div className="bg-vibe min-h-screen pb-24 lg:pb-12 bg-grid relative">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10 relative">
        <h1 className="font-display font-extrabold text-3xl text-white">Dashboard</h1>
        <p className="text-white/50 text-sm mt-1">Track your favourites and the overall race</p>

        {/* Voter identity */}
        {!phoneSaved && (
          <div className="mt-5 rounded-2xl bg-accent-400/10 border border-accent-400/30 p-4">
            <div className="flex items-start gap-3">
              <Pin className="h-5 w-5 text-accent-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">Set your phone to pin favourites</div>
                <p className="text-xs text-white/50 mt-1">We use your M-Pesa number to remember your pinned creators across visits. No account needed.</p>
                <div className="mt-3 flex gap-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0712 345 678"
                    className="flex-1 px-3 py-2.5 rounded-lg bg-ink-800 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-accent-400"
                  />
                  <button
                    onClick={savePhone}
                    className="px-4 py-2.5 rounded-lg bg-accent-500 hover:bg-accent-400 text-ink-900 font-bold text-sm transition-all active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {phoneSaved && (
          <div className="mt-5 flex items-center gap-2 text-xs text-white/40">
            <span className="h-2 w-2 rounded-full bg-brand-400" />
            Tracking as <span className="text-brand-400 font-semibold">{voterPhone}</span>
            <button onClick={() => { setVoterPhone(""); setPhoneInput(""); setPhoneSaved(false); }} className="ml-2 text-white/30 hover:text-white/60 underline">
              change
            </button>
          </div>
        )}

        {/* Voting closes countdown */}
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-flame-500/10 via-ink-700/60 to-accent-500/10 border border-flame-400/20 p-4 overflow-hidden relative">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-flame-500/10 blur-3xl" />
          <div className="relative flex items-center gap-2 mb-3">
            <AlarmClock className="h-5 w-5 text-flame-400" />
            <div>
              <h2 className="font-display font-bold text-white text-sm">Voting closes soon</h2>
              <p className="text-[11px] text-white/40">Last day to push your favourites to the top</p>
            </div>
          </div>
          <Countdown target={VOTING_CLOSE_DATE} />
        </div>

        {/* Overall leader spotlight */}
        {overallLeader && (
          <div className="mt-5 rounded-3xl bg-gradient-to-br from-brand-500/15 via-ink-700/60 to-accent-500/10 border border-brand-400/20 p-5 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-500/15 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <div className="flex flex-col items-center">
                <Crown className="h-6 w-6 text-accent-400 mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-accent-400 font-bold">#1</span>
              </div>
              <Avatar id={overallLeader.id} firstName={overallLeader.first_name} lastName={overallLeader.last_name} imageUrl={overallLeader.profile_image_url} size="lg" ring />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display font-extrabold text-xl text-white truncate">{overallLeader.full_name}</h2>
                  {overallLeader.is_verified && <BadgeCheck className="h-4 w-4 text-brand-400" fill="currentColor" />}
                </div>
                <p className="text-xs text-white/50">{overallLeader.category} · {overallLeader.university}</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-2xl text-brand-400">{formatVotes(overallLeader.votes_count)}</span>
                  <span className="text-xs text-white/40 uppercase tracking-wider">votes — overall leader</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pinned favourites */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <Pin className="h-5 w-5 text-accent-400" fill="currentColor" /> Your pinned favourites
            </h2>
            <span className="text-xs text-white/40">{pinned.length} pinned</span>
          </div>

          {!phoneSaved ? (
            <div className="rounded-2xl bg-ink-700/40 border border-white/5 border-dashed p-8 text-center">
              <Pin className="h-8 w-8 text-white/20 mx-auto" />
              <p className="text-white/40 text-sm mt-2">Set your phone number above to start pinning creators.</p>
            </div>
          ) : pinned.length === 0 ? (
            <div className="rounded-2xl bg-ink-700/40 border border-white/5 border-dashed p-8 text-center">
              <Star className="h-8 w-8 text-white/20 mx-auto" />
              <p className="text-white/40 text-sm mt-2">You haven't pinned anyone yet.</p>
              <button onClick={() => onNavigate("rankings")} className="mt-3 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-ink-900 text-sm font-bold transition-all active:scale-95">
                Browse contestants
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pinned.map((c) => {
                const rank = contestants.findIndex((x) => x.id === c.id) + 1;
                return (
                  <ContestantCard
                    key={c.id}
                    contestant={c}
                    rank={rank}
                    onVote={setVoteTarget}
                    onPin={togglePin}
                    pinned
                    onClick={setDetailTarget}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Trending now */}
        {trending.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display font-bold text-xl text-white flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-flame-400" fill="currentColor" /> Trending right now
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {trending.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setDetailTarget(c)}
                  className="rounded-2xl bg-ink-700/50 border border-white/5 p-3 text-center hover:border-flame-400/30 transition-all active:scale-95"
                >
                  <Avatar id={c.id} firstName={c.first_name} lastName={c.last_name} imageUrl={c.profile_image_url} size="md" className="mx-auto" />
                  <div className="mt-2 font-semibold text-white text-sm truncate">{c.full_name}</div>
                  <div className="text-xs text-white/40 truncate">{c.category}</div>
                  <div className="mt-1.5 text-brand-400 text-sm font-bold tabular-nums">{formatVotes(c.votes_count)} votes</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Support */}
        <div className="mt-10 rounded-2xl bg-ink-700/40 border border-white/5 p-4 text-center">
          <p className="text-sm text-white/50">Need help with voting or tracking?</p>
          <a href={`tel:${SUPPORT_PHONE}`} className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors">
            <Phone className="h-4 w-4 text-brand-400" /> Call {SUPPORT_PHONE}
          </a>
        </div>
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
