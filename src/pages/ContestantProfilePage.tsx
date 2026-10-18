import { useCallback, useEffect, useState } from "react";
import { supabase, EDGE_FUNCTION_BASE } from "@/lib/supabase";
import { Contestant, TopSupporter, SocialHandles, CATEGORIES, COUNTIES, UNIVERSITIES } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { VoteModal } from "@/components/Modals";
import { CommentSection } from "@/components/CommentSection";
import { usePinned } from "@/lib/hooks";
import { classNames, formatVotes, socialUrl } from "@/lib/utils";
import {
  ArrowLeft, Flame, Trophy, Heart, UserPlus, Share2, Crown,
  Medal, Lock, Edit3, Save, X, Phone, Instagram, Music2, Facebook,
  GraduationCap, MapPin, CheckCircle2, Loader2, AlertCircle,
} from "lucide-react";

interface ContestantProfilePageProps {
  contestantId: string;
  onBack: () => void;
}

export function ContestantProfilePage({ contestantId, onBack }: ContestantProfilePageProps) {
  const [contestant, setContestant] = useState<Contestant | null>(null);
  const [allContestants, setAllContestants] = useState<Contestant[]>([]);
  const [supporters, setSupporters] = useState<TopSupporter[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voteTarget, setVoteTarget] = useState<Contestant | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const { pinnedIds, togglePin } = usePinned();

  const loadProfile = useCallback(async () => {
    try {
      const { data: c, error: cErr } = await supabase
        .from("contestants")
        .select("*")
        .eq("id", contestantId)
        .maybeSingle();
      if (cErr) throw cErr;
      setContestant(c as Contestant);

      const { data: all } = await supabase
        .from("contestants")
        .select("*")
        .eq("status", "approved")
        .order("votes_count", { ascending: false });
      setAllContestants((all || []) as Contestant[]);

      const { data: sups } = await supabase
        .from("top_supporters")
        .select("*")
        .eq("contestant_id", contestantId)
        .order("total_votes", { ascending: false })
        .limit(5);
      setSupporters((sups || []) as TopSupporter[]);

      const { count } = await supabase
        .from("pinned_contestants")
        .select("*", { count: "exact", head: true })
        .eq("contestant_id", contestantId);
      setFollowersCount(count || 0);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [contestantId]);

  useEffect(() => {
    loadProfile();

    const channel = supabase
      .channel(`profile-${contestantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contestants", filter: `id=eq.${contestantId}` },
        () => loadProfile()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "top_supporters", filter: `contestant_id=eq.${contestantId}` },
        () => loadProfile()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pinned_contestants", filter: `contestant_id=eq.${contestantId}` },
        () => loadProfile()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadProfile, contestantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!contestant) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <AlertCircle className="h-10 w-10 text-gray-400" />
        <p className="text-gray-500">Contestant not found.</p>
        <button onClick={onBack} className="text-emerald-600 font-semibold text-sm">Go back</button>
      </div>
    );
  }

  // Calculate rank
  const sortedByVotes = [...allContestants].sort((a, b) => b.votes_count - a.votes_count);
  const rank = sortedByVotes.findIndex((c) => c.id === contestantId) + 1;
  const leader = sortedByVotes[0];
  const votesToFirst = leader ? leader.votes_count - contestant.votes_count : 0;

  const isPinned = pinnedIds.has(contestantId);

  function shareWhatsApp() {
    const url = `${window.location.origin}/?profile=${contestantId}`;
    const text = `Support ${contestant!.full_name} on CampusStar! Vote now — ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const handles = contestant.social_handles || {};

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-12">
      {/* Back bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={() => setShowLogin(true)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-emerald-600 text-xs font-semibold"
          >
            <Lock className="h-3.5 w-3.5" /> Contestant login
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar
              id={contestant.id}
              firstName={contestant.first_name}
              lastName={contestant.last_name}
              imageUrl={contestant.profile_image_url}
              size="xl"
              ring
              className="ring-4 ring-emerald-100"
            />
            {rank === 1 && (
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                <Crown className="h-4 w-4 text-white" fill="currentColor" />
              </div>
            )}
          </div>
          <h1 className="mt-4 font-display font-extrabold text-2xl text-gray-900">{contestant.full_name}</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
            <span>{contestant.category}</span>
            <span className="text-gray-300">·</span>
            <span>{contestant.gender}</span>
          </p>
          <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1.5">
            <GraduationCap className="h-3 w-3" /> {contestant.university}
            <span className="text-gray-300">·</span>
            <MapPin className="h-3 w-3" /> {contestant.county} County
          </p>
        </div>

        {/* 3 stats row */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-center">
            <Flame className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <div className="font-display font-extrabold text-2xl text-emerald-600 tabular-nums">{formatVotes(contestant.votes_count)}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">Fan votes</div>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-center">
            <UserPlus className="h-5 w-5 text-gray-700 mx-auto mb-1" />
            <div className="font-display font-extrabold text-2xl text-gray-900 tabular-nums">{followersCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">Followers</div>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-center">
            <Trophy className="h-5 w-5 text-gray-700 mx-auto mb-1" />
            <div className="font-display font-extrabold text-2xl text-gray-900 tabular-nums">#{rank || "—"}</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">Overall ranking</div>
          </div>
        </div>

        {/* Rank banner */}
        {rank > 0 && (
          <div className="mt-4 rounded-2xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-center">
            {rank === 1 ? (
              <p className="text-sm font-bold text-yellow-800">
                <Crown className="h-4 w-4 inline mr-1" /> #1 on CampusStar — fans, keep the crown!
              </p>
            ) : votesToFirst > 0 ? (
              <p className="text-sm font-bold text-yellow-800">
                <Flame className="h-4 w-4 inline mr-1" /> #{rank} — {formatVotes(votesToFirst)} votes to #1!
              </p>
            ) : (
              <p className="text-sm font-bold text-yellow-800">
                <Flame className="h-4 w-4 inline mr-1" /> #{rank} on CampusStar — keep pushing!
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setVoteTarget(contestant)}
            className="flex-[2] py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Heart className="h-5 w-5" fill="currentColor" /> Vote now
          </button>
          <button
            onClick={() => togglePin(contestant)}
            className={classNames(
              "flex-1 py-3.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 border-2",
              isPinned
                ? "bg-emerald-50 text-emerald-600 border-emerald-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"
            )}
          >
            <UserPlus className="h-5 w-5" /> {isPinned ? "Following" : "Follow"}
          </button>
          <button
            onClick={shareWhatsApp}
            className="w-12 h-12 shrink-0 rounded-xl bg-white border-2 border-gray-200 hover:border-emerald-400 text-gray-600 hover:text-emerald-600 transition-all active:scale-95 flex items-center justify-center"
            aria-label="Share on WhatsApp"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2.5">From KES 20 · Quick & secure</p>

        {/* About section */}
        {(contestant.bio || contestant.hobbies || contestant.fun_facts || contestant.place_of_study) && (
          <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-100 p-5">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">About {contestant.first_name}</h3>
            {contestant.bio && <p className="text-gray-700 text-sm leading-relaxed">{contestant.bio}</p>}
            <div className="mt-3 space-y-2">
              {contestant.hobbies && (
                <div className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Hobbies</span>
                    <p className="text-gray-700 text-sm">{contestant.hobbies}</p>
                  </div>
                </div>
              )}
              {contestant.fun_facts && (
                <div className="flex items-start gap-2">
                  <Flame className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Fun facts</span>
                    <p className="text-gray-700 text-sm">{contestant.fun_facts}</p>
                  </div>
                </div>
              )}
              {contestant.place_of_study && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Place of study</span>
                    <p className="text-gray-700 text-sm">{contestant.place_of_study}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Socials */}
        {handles && (handles.instagram || handles.tiktok || handles.facebook) && (
          <div className="mt-4">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Socials</h3>
            <div className="flex flex-wrap gap-2">
              {([["instagram", Instagram], ["tiktok", Music2], ["facebook", Facebook]] as const).map(([key, Icon]) => {
                const h = handles[key as keyof SocialHandles];
                if (!h) return null;
                return (
                  <a
                    key={key}
                    href={socialUrl(key as string, h)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold">@{h.replace(/^@/, "")}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Top supporters */}
        <div className="mt-6">
          <h3 className="font-display font-extrabold text-lg text-gray-900 mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-600" /> Top supporters
          </h3>
          {supporters.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 text-center">
              <p className="text-gray-400 text-sm">No supporters yet. Be the first to vote and claim the MVP spot!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {supporters.map((s, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <div
                    key={s.id}
                    className={classNames(
                      "flex items-center gap-3 rounded-full border px-4 py-2.5 transition-all",
                      i === 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg shrink-0">{medal || <span className="text-gray-400 font-bold text-sm w-5 text-center">#{i + 1}</span>}</span>
                      <span className="font-semibold text-gray-800 text-sm truncate">
                        {s.is_anonymous ? "Anonymous" : s.supporter_name}
                      </span>
                      {i === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 text-[9px] font-bold uppercase tracking-wider shrink-0">
                          MVP
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-600 font-bold text-sm tabular-nums shrink-0">{formatVotes(s.total_votes)} votes</span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-center text-xs text-gray-400 mt-3">Add your name when voting to claim the MVP spot.</p>
        </div>

        {/* Comments */}
        <div className="mt-6">
          <CommentSection contestantId={contestant.id} contestantFirstName={contestant.first_name} contestantLastName={contestant.last_name} />
        </div>
      </div>

      {/* Vote modal */}
      <VoteModal contestant={voteTarget} onClose={() => setVoteTarget(null)} onVoted={() => loadProfile()} />

      {/* Contestant login modal */}
      {showLogin && (
        <ContestantLoginModal
          contestant={contestant}
          onClose={() => setShowLogin(false)}
          onUpdated={() => { loadProfile(); setShowLogin(false); }}
        />
      )}
    </div>
  );
}

// --- Contestant login + edit modal ---
interface LoginModalProps {
  contestant: Contestant;
  onClose: () => void;
  onUpdated: () => void;
}

function ContestantLoginModal({ contestant, onClose, onUpdated }: LoginModalProps) {
  const [mode, setMode] = useState<"check" | "setPassword" | "login" | "edit">("check");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Editable fields
  const [bio, setBio] = useState(contestant.bio || "");
  const [hobbies, setHobbies] = useState(contestant.hobbies || "");
  const [funFacts, setFunFacts] = useState(contestant.fun_facts || "");
  const [placeOfStudy, setPlaceOfStudy] = useState(contestant.place_of_study || "");
  const [contactNumber, setContactNumber] = useState(contestant.contact_number || "");
  const [instagram, setInstagram] = useState(contestant.social_handles?.instagram || "");
  const [tiktok, setTiktok] = useState(contestant.social_handles?.tiktok || "");
  const [facebook, setFacebook] = useState(contestant.social_handles?.facebook || "");

  useEffect(() => {
    // Check if account has a password
    (async () => {
      try {
        const res = await fetch(`${EDGE_FUNCTION_BASE}/contestant-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ action: "get-account", contestantId: contestant.id }),
        });
        const data = await res.json();
        if (data.ok) {
          setMode(data.hasPassword ? "login" : "setPassword");
        }
      } catch {
        setMode("setPassword");
      }
    })();
  }, [contestant.id]);

  async function submitSetPassword() {
    if (newPassword.length < 4) { setError("Password must be at least 4 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`${EDGE_FUNCTION_BASE}/contestant-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: "set-password", contestantId: contestant.id, password: newPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        setMode("edit");
      } else {
        setError(data.error || "Failed to set password");
      }
    } catch (e: any) {
      setError(e.message || "Error");
    } finally { setBusy(false); }
  }

  async function submitLogin() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`${EDGE_FUNCTION_BASE}/contestant-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: "login", contestantId: contestant.id, password }),
      });
      const data = await res.json();
      if (data.ok) {
        setMode("edit");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (e: any) {
      setError(e.message || "Error");
    } finally { setBusy(false); }
  }

  async function submitUpdate() {
    const updates: Record<string, any> = {};
    if (bio !== (contestant.bio || "")) updates.bio = bio;
    if (hobbies !== (contestant.hobbies || "")) updates.hobbies = hobbies;
    if (funFacts !== (contestant.fun_facts || "")) updates.fun_facts = funFacts;
    if (placeOfStudy !== (contestant.place_of_study || "")) updates.place_of_study = placeOfStudy;
    if (contactNumber !== (contestant.contact_number || "")) updates.contact_number = contactNumber;
    const sh = { instagram: instagram || undefined, tiktok: tiktok || undefined, facebook: facebook || undefined };
    if (JSON.stringify(sh) !== JSON.stringify(contestant.social_handles || {})) updates.social_handles = sh;

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setBusy(true); setError("");
    try {
      const res = await fetch(`${EDGE_FUNCTION_BASE}/contestant-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: "update-profile", contestantId: contestant.id, password, updates }),
      });
      const data = await res.json();
      if (data.ok) {
        onUpdated();
      } else {
        setError(data.error || "Update failed");
      }
    } catch (e: any) {
      setError(e.message || "Error");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Lock className="h-5 w-5 text-emerald-600" />
            <h3 className="font-display font-bold text-gray-900">
              {mode === "edit" ? "Edit your profile" : mode === "setPassword" ? "Set a password" : "Contestant login"}
            </h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {mode === "check" && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          )}

          {mode === "setPassword" && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-sm text-gray-500">Set a password to protect your profile. Only you will be able to edit it.</p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 4 chars)"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={submitSetPassword}
                disabled={busy}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {busy ? "Saving..." : "Set password & continue"}
              </button>
            </div>
          )}

          {mode === "login" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <Avatar id={contestant.id} firstName={contestant.first_name} lastName={contestant.last_name} imageUrl={contestant.profile_image_url} size="sm" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{contestant.full_name}</div>
                  <div className="text-gray-400 text-xs">{contestant.category}</div>
                </div>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm"
                autoFocus
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={submitLogin}
                disabled={busy}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                {busy ? "Logging in..." : "Log in to edit"}
              </button>
            </div>
          )}

          {mode === "edit" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4" /> Logged in — changes are logged for security.
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Hobbies</label>
                <input value={hobbies} onChange={(e) => setHobbies(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Fun facts</label>
                <input value={funFacts} onChange={(e) => setFunFacts(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Place of study</label>
                <input value={placeOfStudy} onChange={(e) => setPlaceOfStudy(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Contact number</label>
                <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-500 text-sm" />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Social handles</label>
                <div className="mt-1.5 space-y-2">
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram handle" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-500 text-sm" />
                  <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok handle" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-500 text-sm" />
                  <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook handle" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-emerald-500 text-sm" />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                onClick={submitUpdate}
                disabled={busy}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {busy ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
