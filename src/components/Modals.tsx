import { useState } from "react";
import { supabase, EDGE_FUNCTION_BASE } from "@/lib/supabase";
import { Contestant, VOTE_PACKAGES, VotePackage, SUPPORT_PHONE } from "@/lib/types";
import { getVoterPhone, setVoterPhone, formatVotes, classNames, socialUrl } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { CommentSection } from "./CommentSection";
import { X, Phone, CheckCircle2, Loader2, AlertCircle, BadgeCheck, Flame, Instagram, Music2, Facebook, Heart, Lightbulb, GraduationCap, User } from "lucide-react";

interface VoteModalProps {
  contestant: Contestant | null;
  onClose: () => void;
  onVoted: () => void;
  initialPkg?: VotePackage | null;
}

type Step = "select" | "phone" | "pushing" | "success" | "error";

function getDarajaCreds(): { consumerKey: string; consumerSecret: string; passkey: string } {
  try {
    return {
      consumerKey: localStorage.getItem("mpesa_consumer_key") || "",
      consumerSecret: localStorage.getItem("mpesa_consumer_secret") || "",
      passkey: localStorage.getItem("mpesa_passkey") || "",
    };
  } catch {
    return { consumerKey: "", consumerSecret: "", passkey: "" };
  }
}

export function VoteModal({ contestant, onClose, onVoted, initialPkg }: VoteModalProps) {
  const [step, setStep] = useState<Step>(initialPkg ? "phone" : "select");
  const [pkg, setPkg] = useState<VotePackage | null>(initialPkg ?? null);
  const [phone, setPhone] = useState(getVoterPhone());
  const [supporterName, setSupporterName] = useState("");
  const [voteId, setVoteId] = useState<string | null>(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [error, setError] = useState("");

  if (!contestant) return null;

  const totalVotes = pkg ? pkg.votes + pkg.bonus : 0;

  async function startPush() {
    if (!pkg || !contestant) return;
    if (!phone || phone.length < 10) {
      setError("Enter a valid Safaricom number (e.g. 0712345678)");
      setStep("error");
      return;
    }
    const creds = getDarajaCreds();
    if (!creds.consumerKey || !creds.consumerSecret || !creds.passkey) {
      setError("M-Pesa Daraja credentials are not configured. The admin must add them in the Admin panel before voting can work.");
      setStep("error");
      return;
    }
    setVoterPhone(phone);
    setStep("pushing");
    setError("");
    try {
      const res = await fetch(`${EDGE_FUNCTION_BASE}/mpesa-stk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          contestantId: contestant.id,
          contestantName: contestant.full_name,
          voterPhone: phone,
          amountKes: pkg.priceKes,
          voteCount: totalVotes,
          packageId: pkg.id,
          supporterName: supporterName.trim() || undefined,
          consumerKey: creds.consumerKey,
          consumerSecret: creds.consumerSecret,
          passkey: creds.passkey,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to send STK push");
      setVoteId(data.voteId);
      // Real mode: poll vote status every 3 seconds until callback completes
      pollStatus(data.voteId);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setStep("error");
    }
  }

  async function pollStatus(id: string) {
    let tries = 0;
    const interval = setInterval(async () => {
      tries++;
      try {
        const { data, error } = await supabase
          .from("votes")
          .select("status, mpesa_code")
          .eq("id", id)
          .maybeSingle();
        if (error || !data) { clearInterval(interval); return; }
        if (data.status === "completed") {
          clearInterval(interval);
          setMpesaCode(data.mpesa_code || "");
          setStep("success");
          onVoted();
        } else if (data.status === "failed") {
          clearInterval(interval);
          setError("Payment failed — try again");
          setStep("error");
        }
      } catch { /* keep polling */ }
      if (tries > 100) {
        clearInterval(interval);
        setError("Payment timed out — check your M-Pesa and try again");
        setStep("error");
      }
    }, 3000);
  }

  function reset() {
    setStep("select");
    setPkg(null);
    setVoteId(null);
    setMpesaCode("");
    setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-ink-800 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-ink-800/95 backdrop-blur px-5 py-4 border-b border-white/5 flex items-center gap-3 z-10">
          <Avatar id={contestant.id} firstName={contestant.first_name} lastName={contestant.last_name} imageUrl={contestant.profile_image_url} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="font-display font-bold text-white truncate">{contestant.full_name}</h3>
              {contestant.is_verified && <BadgeCheck className="h-4 w-4 text-brand-400" fill="currentColor" />}
            </div>
            <p className="text-xs text-white/50">{formatVotes(contestant.votes_count)} votes now</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {step === "select" && (
            <div className="animate-fade-in">
              <h2 className="font-display font-extrabold text-2xl text-white">A little love goes a long way</h2>
              <p className="text-white/50 text-sm mt-1">1 vote = KES 20 · Pick a package to push {contestant.first_name} up the ranks</p>

              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {VOTE_PACKAGES.map((p) => {
                  const total = p.votes + p.bonus;
                  const selected = pkg?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPkg(p)}
                      className={classNames(
                        "relative rounded-xl p-3 text-left border-2 transition-all",
                        selected
                          ? "border-brand-400 bg-brand-500/10"
                          : p.highlighted
                            ? "border-brand-400/50 bg-brand-500/5 hover:border-brand-400"
                            : "border-white/10 bg-ink-700 hover:border-white/20"
                      )}
                    >
                      {p.label && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-brand-500 text-ink-900 text-[9px] font-bold uppercase tracking-wider">
                          {p.label}
                        </span>
                      )}
                      <div className="font-display font-extrabold text-white text-lg leading-none">{p.votes} votes</div>
                      {p.bonus > 0 && (
                        <div className="text-brand-400 text-xs font-bold mt-1">+{p.bonus} bonus</div>
                      )}
                      <div className="text-white/40 text-xs mt-1.5">= {total} total</div>
                      <div className="mt-2 font-bold text-accent-400 text-base">KES {p.priceKes.toLocaleString()}</div>
                    </button>
                  );
                })}
              </div>

              {pkg && (
                <button
                  onClick={() => setStep("phone")}
                  className="w-full mt-4 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-900 font-bold transition-all active:scale-[0.98] animate-slide-up"
                >
                  Continue · KES {pkg.priceKes.toLocaleString()} for {totalVotes} votes
                </button>
              )}
              <p className="text-center text-[11px] text-white/30 mt-3">
                Paid via M-Pesa STK push · Votes add to leaderboard instantly
              </p>
            </div>
          )}

          {step === "phone" && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-white">Your M-Pesa number</h2>
              <p className="text-white/50 text-sm mt-1">We'll send an STK push to this Safaricom line.</p>
              <div className="mt-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-ink-700 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    placeholder="Your name (to appear on leaderboard)"
                    className="w-full px-4 py-3 rounded-xl bg-ink-700 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors text-sm"
                  />
                  <p className="text-[11px] text-white/30 mt-1.5">Optional — leave blank to stay anonymous. Top supporters appear on the contestant's profile.</p>
                </div>
                {pkg && (
                  <div className="mt-3 rounded-xl bg-ink-700 border border-white/5 p-3 flex items-center justify-between">
                    <div className="text-sm text-white/60">
                      {pkg.votes} votes{pkg.bonus > 0 ? ` + ${pkg.bonus} bonus` : ""}
                    </div>
                    <div className="font-bold text-accent-400">KES {pkg.priceKes.toLocaleString()}</div>
                  </div>
                )}
              </div>
              <button
                onClick={startPush}
                className="w-full mt-4 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-900 font-bold transition-all active:scale-[0.98]"
              >
                Pay KES {pkg?.priceKes.toLocaleString()} via M-Pesa
              </button>
              <button onClick={() => setStep("select")} className="w-full mt-2 py-2.5 text-white/40 hover:text-white text-sm font-semibold">
                Back
              </button>
            </div>
          )}

          {step === "pushing" && (
            <div className="py-10 flex flex-col items-center text-center animate-fade-in">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-brand-500/20 flex items-center justify-center animate-pulse-glow">
                  <Phone className="h-8 w-8 text-brand-400" />
                </div>
              </div>
              <h2 className="font-display font-bold text-xl text-white mt-5">Check your phone</h2>
              <p className="text-white/50 text-sm mt-2 max-w-xs">
                STK push sent to <span className="text-brand-400 font-semibold">{phone.startsWith("254") ? phone : "254" + phone.replace(/^0/, "")}</span> — enter your M-Pesa PIN
              </p>
              <div className="flex items-center gap-2 mt-5 text-brand-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Waiting for confirmation…</span>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-10 flex flex-col items-center text-center animate-fade-in">
              <div className="h-20 w-20 rounded-full bg-brand-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-brand-400" />
              </div>
              <h2 className="font-display font-extrabold text-2xl text-white mt-5">Success!</h2>
              <p className="text-white/60 text-sm mt-2 max-w-xs">
                Paid — {totalVotes} votes added to {contestant.first_name}. They've jumped up the leaderboard.
              </p>
              <div className="mt-4 px-4 py-2 rounded-lg bg-ink-700 border border-white/5 text-xs text-white/50">
                M-Pesa code: <span className="text-brand-400 font-mono font-bold">{mpesaCode || (voteId ? "SIM" + voteId.slice(0, 6).toUpperCase() : "—")}</span>
              </div>
              <button onClick={onClose} className="w-full mt-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-900 font-bold transition-all active:scale-[0.98]">
                Done
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="py-8 flex flex-col items-center text-center animate-fade-in">
              <div className="h-16 w-16 rounded-full bg-flame-500/15 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-flame-400" />
              </div>
              <h2 className="font-display font-bold text-xl text-white mt-4">Couldn't complete</h2>
              <p className="text-white/50 text-sm mt-2 max-w-xs">{error}</p>
              <button onClick={reset} className="w-full mt-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold">
                Try again
              </button>
              <p className="text-xs text-white/30 mt-3">
                Trouble? Call <a href={`tel:${SUPPORT_PHONE}`} className="text-brand-400 font-semibold">{SUPPORT_PHONE}</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Also export a smaller contestant detail modal
interface DetailModalProps {
  contestant: Contestant | null;
  onClose: () => void;
  onVote: (c: Contestant) => void;
  onPin: (c: Contestant) => void;
  pinned: boolean;
}

export function ContestantDetailModal({ contestant, onClose, onVote, onPin, pinned }: DetailModalProps) {
  if (!contestant) return null;
  const c = contestant;
  const handles = c.social_handles || {};
  const socials: { key: keyof typeof handles; label: string; icon: typeof Instagram }[] = [
    { key: "instagram", label: "Instagram", icon: Instagram },
    { key: "tiktok", label: "TikTok", icon: Music2 },
    { key: "facebook", label: "Facebook", icon: Facebook },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-ink-800 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto">
        <div className="relative h-32 bg-gradient-to-br from-brand-500/30 via-accent-500/20 to-flame-500/20">
          <button onClick={onClose} className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-black/30 backdrop-blur hover:bg-black/50 flex items-center justify-center text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 pb-5 -mt-14">
          <Avatar id={c.id} firstName={c.first_name} lastName={c.last_name} imageUrl={c.profile_image_url} size="xl" ring className="border-4 border-ink-800" />
          <div className="mt-3 flex items-center gap-1.5">
            <h2 className="font-display font-extrabold text-2xl text-white">{c.full_name}</h2>
            {c.is_verified && <BadgeCheck className="h-5 w-5 text-brand-400" fill="currentColor" />}
            {c.is_trending && (
              <span className="inline-flex items-center gap-0.5 text-flame-400 text-xs font-bold bg-flame-500/15 px-2 py-0.5 rounded-full">
                <Flame className="h-3 w-3" fill="currentColor" /> Trending
              </span>
            )}
          </div>
          <p className="text-white/50 text-sm mt-1">{c.category} · {c.gender}</p>
          <p className="text-white/40 text-sm">{c.university} · {c.county} County</p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-ink-700 border border-white/5 p-3">
              <div className="font-display font-extrabold text-brand-400 text-2xl">{formatVotes(c.votes_count)}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Total votes</div>
            </div>
            <div className="rounded-xl bg-ink-700 border border-white/5 p-3">
              <div className="font-display font-extrabold text-accent-400 text-lg capitalize">{c.level}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Level</div>
            </div>
          </div>

          {/* Bio / About section */}
          {(c.bio || c.hobbies || c.fun_facts || c.place_of_study) && (
            <div className="mt-4 rounded-xl bg-ink-700/60 border border-white/5 p-4 space-y-3">
              <div className="text-xs uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> About {c.first_name}
              </div>
              {c.bio && (
                <p className="text-white/70 text-sm leading-relaxed">{c.bio}</p>
              )}
              <div className="space-y-2">
                {c.hobbies && (
                  <div className="flex items-start gap-2">
                    <Heart className="h-3.5 w-3.5 text-flame-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-white/40">Hobbies</span>
                      <p className="text-white/70 text-sm">{c.hobbies}</p>
                    </div>
                  </div>
                )}
                {c.fun_facts && (
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-accent-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-white/40">Fun facts</span>
                      <p className="text-white/70 text-sm">{c.fun_facts}</p>
                    </div>
                  </div>
                )}
                {c.place_of_study && (
                  <div className="flex items-start gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-white/40">Place of study</span>
                      <p className="text-white/70 text-sm">{c.place_of_study}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {handles && (handles.instagram || handles.tiktok || handles.facebook) && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2 font-semibold">Socials</div>
              <div className="flex flex-wrap gap-2">
                {socials.map(({ key, label, icon: Icon }) => {
                  const h = handles[key];
                  if (!h) return null;
                  const I = Icon;
                  return (
                    <a
                      key={key}
                      href={socialUrl(key as string, h)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 border border-white/5 text-sm text-white/80 transition-colors"
                    >
                      <I className="h-4 w-4 text-brand-400" />
                      <span className="font-semibold">@{h.replace(/^@/, "")}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => onPin(c)}
              className={classNames(
                "flex-1 py-3 rounded-xl font-bold transition-all active:scale-95",
                pinned ? "bg-accent-400/20 text-accent-400 border border-accent-400/40" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
              )}
            >
              {pinned ? "Pinned" : "Pin to track"}
            </button>
            <button
              onClick={() => onVote(c)}
              className="flex-[1.5] py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-900 font-bold transition-all active:scale-95"
            >
              Vote for {c.first_name}
            </button>
          </div>

          {/* Fan comments */}
          <CommentSection contestantId={c.id} contestantFirstName={c.first_name} contestantLastName={c.last_name} />
        </div>
      </div>
    </div>
  );
}
