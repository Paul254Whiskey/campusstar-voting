import { useCallback, useEffect, useState } from "react";
import { supabase, EDGE_FUNCTION_BASE } from "@/lib/supabase";
import { Contestant, ADMIN_PASSWORD, CATEGORIES } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { classNames, formatVotes } from "@/lib/utils";
import {
  Shield, Lock, CheckCircle2, XCircle, Trash2, BarChart3, Users,
  Loader2, AlertCircle, RotateCcw, Crown, Phone, TrendingUp, DollarSign,
  Settings, Key, Save, Receipt, AlertTriangle, Clock, Plus, History, Edit3,
} from "lucide-react";

interface Registration {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  category: string;
  gender: string;
  county: string;
  university: string;
  profile_image_url: string | null;
  bio: string;
  hobbies: string;
  fun_facts: string;
  place_of_study: string;
  social_handles: any;
  status: string;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  contestant_id: string;
  contestant_name: string;
  phone: string;
  amount_kes: number;
  vote_count: number;
  status: string;
  mpesa_code: string;
  created_at: string;
}

interface EditLogRecord {
  id: string;
  contestant_id: string;
  contestant_name: string;
  changed_fields: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  edited_at: string;
}

type AdminTab = "pending" | "contestants" | "stats" | "payments" | "audit" | "settings";

export function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [pwError, setPwError] = useState(false);

  function tryAuth() {
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setPwError(true);
    }
  }

  if (!authed) {
    return (
      <div className="bg-vibe min-h-screen pb-24 lg:pb-12 bg-grid relative flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl bg-brand-500/15 border border-brand-400/30 flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-brand-400" />
            </div>
            <h1 className="mt-5 font-display font-extrabold text-2xl text-white">Admin Access</h1>
            <p className="text-white/50 text-sm mt-1">Enter the admin password to manage the competition.</p>
          </div>
          <div className="mt-6 rounded-2xl bg-ink-700/60 border border-white/10 p-5">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPwError(false); }}
                onKeyDown={(e) => e.key === "Enter" && tryAuth()}
                placeholder="Admin password"
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors"
                autoFocus
              />
            </div>
            {pwError && (
              <div className="mt-3 flex items-center gap-2 text-flame-400 text-sm">
                <AlertCircle className="h-4 w-4" /> Incorrect password. Try again.
              </div>
            )}
            <button
              onClick={tryAuth}
              className="w-full mt-4 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-900 font-bold transition-all active:scale-95"
            >
              Enter admin panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>("pending");
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [pending, setPending] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Contestant | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [editLogs, setEditLogs] = useState<EditLogRecord[]>([]);
  const [votingDeadline, setVotingDeadline] = useState<string | null>(null);
  const [addHours, setAddHours] = useState(24);
  const [customDeadline, setCustomDeadline] = useState("");
  const [mpesaConsumerKey, setMpesaConsumerKey] = useState("");
  const [mpesaConsumerSecret, setMpesaConsumerSecret] = useState("");
  const [mpesaPasskey, setMpesaPasskey] = useState("");
  const [credsSaved, setCredsSaved] = useState(false);

  // Load Daraja credentials from localStorage on mount
  useEffect(() => {
    try {
      setMpesaConsumerKey(localStorage.getItem("mpesa_consumer_key") || "");
      setMpesaConsumerSecret(localStorage.getItem("mpesa_consumer_secret") || "");
      setMpesaPasskey(localStorage.getItem("mpesa_passkey") || "");
    } catch { /* ignore */ }
  }, []);

  function saveDarajaCreds() {
    try {
      localStorage.setItem("mpesa_consumer_key", mpesaConsumerKey);
      localStorage.setItem("mpesa_consumer_secret", mpesaConsumerSecret);
      localStorage.setItem("mpesa_passkey", mpesaPasskey);
      setCredsSaved(true);
      setMessage("Daraja credentials saved");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Failed to save credentials");
    }
  }

  const darajaConfigured = !!(mpesaConsumerKey && mpesaConsumerSecret && mpesaPasskey);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EDGE_FUNCTION_BASE}/admin-manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: "stats", password: ADMIN_PASSWORD }),
      });
      const data = await res.json();
      if (data.ok) {
        setContestants(data.contestants || []);
        setPending(data.pendingRegistrations || []);
        setPayments(data.payments || []);
        setEditLogs(data.editLogs || []);
        setVotingDeadline(data.votingDeadline || null);
        if (data.votingDeadline) {
          // Format for datetime-local input: YYYY-MM-DDTHH:MM
          const d = new Date(data.votingDeadline);
          const pad = (n: number) => String(n).padStart(2, "0");
          setCustomDeadline(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
          );
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Realtime: listen for contestant updates
  useEffect(() => {
    const channel = supabase
      .channel("admin-contestants")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contestants" },
        () => loadStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations" },
        () => loadStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mpesa_payments" },
        () => loadStats()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadStats]);

  async function adminAction(action: string, extra: Record<string, any> = {}) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`${EDGE_FUNCTION_BASE}/admin-manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action, password: ADMIN_PASSWORD, ...extra }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(data.message || "Done");
        await loadStats();
      } else {
        setMessage(data.error || "Failed");
      }
    } catch (e: any) {
      setMessage(e.message || "Error");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  const totalVotes = contestants.reduce((s, c) => s + c.votes_count, 0);
  const completedPayments = payments.filter((p) => p.status === "completed");
  const totalRevenue = completedPayments.reduce((s, p) => s + p.amount_kes, 0);

  // Category breakdown for bar chart
  const categoryStats = CATEGORIES.map((cat) => {
    const list = contestants.filter((c) => c.category === cat);
    const votes = list.reduce((s, c) => s + c.votes_count, 0);
    const leader = list.sort((a, b) => b.votes_count - a.votes_count)[0];
    return { category: cat, count: list.length, votes, leader };
  }).filter((c) => c.count > 0).sort((a, b) => b.votes - a.votes);

  const maxCategoryVotes = Math.max(...categoryStats.map((c) => c.votes), 1);

  return (
    <div className="bg-vibe min-h-screen pb-24 lg:pb-12 bg-grid relative">
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-brand-400" />
            <div>
              <h1 className="font-display font-extrabold text-2xl text-white">Admin Panel</h1>
              <p className="text-white/40 text-xs">Manage contestants, approvals & season reset</p>
            </div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-lg bg-flame-500/15 hover:bg-flame-500/25 text-flame-400 text-sm font-bold border border-flame-400/30 transition-all active:scale-95 flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Reset Season
          </button>
        </div>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Contestants", value: contestants.length, icon: Users, color: "text-brand-400" },
            { label: "Pending approvals", value: pending.length, icon: AlertCircle, color: "text-accent-400" },
            { label: "Total votes", value: totalVotes.toLocaleString(), icon: TrendingUp, color: "text-vibe-cyan" },
            { label: "Revenue (KES)", value: totalRevenue.toLocaleString(), icon: DollarSign, color: "text-vibe-pink" },
          ].map((s) => {
            const I = s.icon;
            return (
              <div key={s.label} className="rounded-xl bg-ink-700/50 border border-white/5 p-3 text-center">
                <I className={`h-4 w-4 ${s.color} mx-auto mb-1`} />
                <div className="font-display font-extrabold text-2xl text-white">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Message toast */}
        {message && (
          <div className="mt-4 rounded-xl bg-brand-500/10 border border-brand-400/30 p-3 text-sm text-brand-400 font-semibold animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-white/5">
          {([
            { id: "pending" as AdminTab, label: `Pending (${pending.length})`, icon: AlertCircle },
            { id: "contestants" as AdminTab, label: `Contestants (${contestants.length})`, icon: Users },
            { id: "stats" as AdminTab, label: "Analytics", icon: BarChart3 },
            { id: "payments" as AdminTab, label: `Payments (${completedPayments.length})`, icon: Receipt },
            { id: "audit" as AdminTab, label: `Audit (${editLogs.length})`, icon: History },
            { id: "settings" as AdminTab, label: "Settings", icon: Settings },
          ]).map((t) => {
            const I = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={classNames(
                  "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
                  tab === t.id ? "border-brand-400 text-brand-400" : "border-transparent text-white/40 hover:text-white/70"
                )}
              >
                <I className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 flex items-center justify-center text-white/40">
            <Loader2 className="h-6 w-6 animate-spin" /> <span className="ml-2 text-sm">Loading…</span>
          </div>
        )}

        {/* PENDING TAB */}
        {!loading && tab === "pending" && (
          <div className="mt-5 space-y-3">
            {pending.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-white/20" />
                <p>No pending registrations. Everyone has been reviewed.</p>
              </div>
            ) : (
              pending.map((reg) => (
                <div key={reg.id} className="rounded-2xl bg-ink-700/50 border border-white/5 p-4 animate-slide-up">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Avatar id={reg.id} firstName={reg.first_name} lastName={reg.last_name} imageUrl={reg.profile_image_url} size="md" className="mx-auto sm:mx-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-white text-base">{reg.full_name}</div>
                      <div className="text-white/50 text-sm">{reg.category} · {reg.gender}</div>
                      <div className="text-white/40 text-xs mt-0.5">{reg.university} · {reg.county} County</div>
                      {reg.contact_number && (
                        <div className="text-white/40 text-xs mt-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {reg.contact_number}
                        </div>
                      )}
                      {reg.bio && <p className="text-white/60 text-sm mt-2 line-clamp-2">{reg.bio}</p>}
                      {(reg.hobbies || reg.fun_facts || reg.place_of_study) && (
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                          {reg.hobbies && <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/50">Hobbies: {reg.hobbies}</span>}
                          {reg.fun_facts && <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/50">Fun facts: {reg.fun_facts}</span>}
                          {reg.place_of_study && <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/50">Study: {reg.place_of_study}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => adminAction("approve", { registrationId: reg.id })}
                        disabled={busy}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-ink-900 text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => adminAction("reject", { registrationId: reg.id })}
                        disabled={busy}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/60 text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CONTESTANTS TAB */}
        {!loading && tab === "contestants" && (
          <div className="mt-5 space-y-2.5">
            {contestants.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <Users className="h-10 w-10 mx-auto mb-2 text-white/20" />
                <p>No approved contestants yet.</p>
              </div>
            ) : (
              contestants.map((c, i) => (
                <div key={c.id} className="rounded-2xl bg-ink-700/50 border border-white/5 p-3 flex items-center gap-3 animate-slide-up">
                  <div className="font-display font-extrabold text-white/30 text-lg w-6 text-center tabular-nums">{i + 1}</div>
                  <Avatar id={c.id} firstName={c.first_name} lastName={c.last_name} imageUrl={c.profile_image_url} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{c.full_name}</div>
                    <div className="text-white/40 text-xs">{c.category} · {c.university}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-extrabold text-brand-400 text-lg tabular-nums">{formatVotes(c.votes_count)}</div>
                    <div className="text-[9px] uppercase tracking-wider text-white/30">votes</div>
                  </div>
                  <button
                    onClick={() => setRemoveTarget(c)}
                    disabled={busy}
                    className="h-9 w-9 rounded-lg bg-flame-500/10 hover:bg-flame-500/20 text-flame-400 transition-all active:scale-95 flex items-center justify-center shrink-0"
                    title="Remove contestant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* STATS TAB */}
        {!loading && tab === "stats" && (
          <div className="mt-5 space-y-5">
            {categoryStats.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 text-white/20" />
                <p>No voting data yet.</p>
              </div>
            ) : (
              <>
                {/* Category bar charts */}
                <div className="rounded-2xl bg-ink-700/50 border border-white/5 p-5">
                  <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-brand-400" /> Votes by category
                  </h3>
                  <div className="space-y-4">
                    {categoryStats.map((cat) => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-white">{cat.category}</span>
                          <span className="text-xs text-white/40">{cat.count} contestants · {formatVotes(cat.votes)} votes</span>
                        </div>
                        <div className="h-6 rounded-lg bg-ink-600 overflow-hidden">
                          <div
                            className="h-full rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.max((cat.votes / maxCategoryVotes) * 100, 3)}%` }}
                          >
                            {cat.votes > 0 && (
                              <span className="text-[10px] font-bold text-ink-900">{formatVotes(cat.votes)}</span>
                            )}
                          </div>
                        </div>
                        {cat.leader && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/50">
                            <Crown className="h-3 w-3 text-accent-400" />
                            Most likely to win: <span className="text-white font-semibold">{cat.leader.full_name}</span>
                            <span className="text-brand-400">({formatVotes(cat.leader.votes_count)} votes)</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 10 progress */}
                <div className="rounded-2xl bg-ink-700/50 border border-white/5 p-5">
                  <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand-400" /> Top 10 — vote progress
                  </h3>
                  <div className="space-y-2.5">
                    {contestants.slice(0, 10).map((c, i) => {
                      const maxVotes = contestants[0]?.votes_count || 1;
                      const pct = (c.votes_count / maxVotes) * 100;
                      return (
                        <div key={c.id} className="flex items-center gap-3">
                          <span className="font-display font-bold text-white/30 text-sm w-5 text-center tabular-nums">{i + 1}</span>
                          <Avatar id={c.id} firstName={c.first_name} lastName={c.last_name} imageUrl={c.profile_image_url} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{c.full_name}</div>
                            <div className="h-2 rounded-full bg-ink-600 overflow-hidden mt-1">
                              <div
                                className={classNames(
                                  "h-full rounded-full transition-all duration-500",
                                  i === 0 ? "bg-gradient-to-r from-accent-500 to-accent-400" : "bg-gradient-to-r from-brand-500 to-brand-400"
                                )}
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-brand-400 tabular-nums w-12 text-right">{formatVotes(c.votes_count)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* PAYMENTS TAB — M-Pesa payment evidence for transparency */}
        {!loading && tab === "payments" && (
          <div className="mt-5 space-y-3">
            {/* Summary */}
            <div className="rounded-2xl bg-ink-700/50 border border-white/5 p-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-display font-extrabold text-brand-400 text-xl">{completedPayments.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">Completed payments</div>
              </div>
              <div>
                <div className="font-display font-extrabold text-accent-400 text-xl">KES {totalRevenue.toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">Total revenue</div>
              </div>
              <div>
                <div className="font-display font-extrabold text-white text-xl">{payments.filter((p) => p.status === "pending").length}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">Pending</div>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <Receipt className="h-10 w-10 mx-auto mb-2 text-white/20" />
                <p>No payment records yet. They'll appear here as voters pay.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {payments.map((p) => (
                  <div key={p.id} className="rounded-xl bg-ink-700/50 border border-white/5 p-3.5 animate-slide-up">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={classNames(
                          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                          p.status === "completed" ? "bg-brand-500/15" : p.status === "pending" ? "bg-accent-500/15" : "bg-flame-500/15"
                        )}>
                          {p.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-brand-400" />
                          ) : p.status === "pending" ? (
                            <Loader2 className="h-5 w-5 text-accent-400 animate-spin" />
                          ) : (
                            <XCircle className="h-5 w-5 text-flame-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white text-sm truncate">{p.contestant_name}</div>
                          <div className="text-white/40 text-xs flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {p.phone}
                            <span className="text-white/20">·</span>
                            <span className="font-mono">{p.mpesa_code || "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-extrabold text-white text-sm">{p.vote_count} votes</div>
                        <div className="text-accent-400 text-xs font-bold">KES {p.amount_kes.toLocaleString()}</div>
                        <div className={classNames(
                          "text-[9px] uppercase tracking-wider font-semibold mt-0.5",
                          p.status === "completed" ? "text-brand-400" : p.status === "pending" ? "text-accent-400" : "text-flame-400"
                        )}>{p.status}</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-white/30">
                      {new Date(p.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIT TAB — Profile edit logs */}
        {!loading && tab === "audit" && (
          <div className="mt-5 space-y-3">
            {/* Countdown control */}
            <div className="rounded-2xl bg-ink-700/50 border border-white/5 p-5">
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-400" /> Countdown timer control
              </h3>
              <div className="rounded-xl bg-ink-800/60 border border-white/5 p-4 mb-4">
                <div className="text-xs text-white/40 mb-1">Current voting deadline</div>
                {votingDeadline ? (
                  <div className="font-display font-bold text-white text-lg">
                    {new Date(votingDeadline).toLocaleString("en-KE", { dateStyle: "full", timeStyle: "short" })}
                  </div>
                ) : (
                  <div className="text-white/40 text-sm">No deadline set</div>
                )}
                {votingDeadline && (
                  <div className="mt-2 text-xs">
                    {new Date(votingDeadline).getTime() > Date.now() ? (
                      <span className="text-brand-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Voting is open
                      </span>
                    ) : (
                      <span className="text-flame-400 font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Voting has closed
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => adminAction("set-deadline", { deadline: new Date(Date.now() + 30 * 86400000).toISOString() })}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 text-sm font-bold border border-brand-400/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" /> Reset to 30 days
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={addHours}
                    onChange={(e) => setAddHours(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-20 px-3 py-2.5 rounded-xl bg-ink-800 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-400 text-center"
                  />
                  <span className="text-white/40 text-xs">hours</span>
                  <button
                    onClick={() => adminAction("add-time", { addHours })}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-xl bg-accent-500/15 hover:bg-accent-500/25 text-accent-400 text-sm font-bold border border-accent-400/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" /> Add time
                  </button>
                </div>
              </div>

              {/* Custom date/time picker */}
              <div className="mt-3 pt-3 border-t border-white/5">
                <label className="text-xs uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1.5 mb-2">
                  <Clock className="h-3.5 w-3.5" /> Set exact deadline
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="datetime-local"
                    value={customDeadline}
                    onChange={(e) => setCustomDeadline(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-ink-800 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-400 transition-colors [color-scheme:dark]"
                  />
                  <button
                    onClick={() => {
                      if (!customDeadline) return;
                      const d = new Date(customDeadline);
                      if (isNaN(d.getTime())) return;
                      adminAction("set-deadline", { deadline: d.toISOString() });
                    }}
                    disabled={busy || !customDeadline}
                    className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-ink-900 text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" /> Apply deadline
                  </button>
                </div>
                <p className="text-[11px] text-white/30 mt-2">Pick any date and time — the countdown on the homepage will update to match.</p>
              </div>
            </div>

            {/* Profile edit logs */}
            <div>
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-brand-400" /> Profile edit history
              </h3>
              {editLogs.length === 0 ? (
                <div className="text-center py-12 text-white/40 rounded-2xl bg-ink-700/30 border border-white/5">
                  <History className="h-8 w-8 mx-auto mb-2 text-white/20" />
                  <p className="text-sm">No profile edits logged yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {editLogs.map((log) => (
                    <div key={log.id} className="rounded-xl bg-ink-700/50 border border-white/5 p-3.5 animate-slide-up">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                            <Edit3 className="h-4 w-4 text-brand-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-sm truncate">{log.contestant_name}</div>
                            <div className="text-white/40 text-xs mt-0.5">
                              Changed: <span className="text-brand-400 font-semibold">{log.changed_fields}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 text-[10px] text-white/30">
                          {new Date(log.edited_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-white/30 uppercase tracking-wider text-[9px] font-semibold mb-1">Before</div>
                          <pre className="text-white/50 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(log.old_values, null, 0)}</pre>
                        </div>
                        <div>
                          <div className="text-white/30 uppercase tracking-wider text-[9px] font-semibold mb-1">After</div>
                          <pre className="text-brand-400/70 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(log.new_values, null, 0)}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB — Daraja credentials */}
        {!loading && tab === "settings" && (
          <div className="mt-5 max-w-xl">
            <div className="rounded-2xl bg-ink-700/50 border border-white/5 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Key className="h-5 w-5 text-brand-400" />
                <h3 className="font-display font-bold text-white text-base">M-Pesa Daraja Credentials</h3>
              </div>
              <p className="text-white/50 text-sm mb-4">
                Paste your Safaricom Daraja sandbox credentials here. They are stored in your browser and used to send real STK push requests. Shortcode is fixed at <span className="text-brand-400 font-mono">116016474</span>.
              </p>

              <div className={classNames(
                "mb-4 px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-2",
                darajaConfigured
                  ? "bg-brand-500/10 border-brand-400/30 text-brand-400"
                  : "bg-flame-500/10 border-flame-400/30 text-flame-400"
              )}>
                <span className={classNames("h-2 w-2 rounded-full", darajaConfigured ? "bg-brand-400" : "bg-flame-400")} />
                {darajaConfigured ? "Credentials configured — voting is live" : "Not configured — voting will not work until these are filled"}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Consumer Key</label>
                  <input
                    type="text"
                    value={mpesaConsumerKey}
                    onChange={(e) => { setMpesaConsumerKey(e.target.value); setCredsSaved(false); }}
                    placeholder="Your Daraja app consumer key"
                    className="mt-1.5 w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Consumer Secret</label>
                  <input
                    type="password"
                    value={mpesaConsumerSecret}
                    onChange={(e) => { setMpesaConsumerSecret(e.target.value); setCredsSaved(false); }}
                    placeholder="Your Daraja app consumer secret"
                    className="mt-1.5 w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Passkey</label>
                  <input
                    type="password"
                    value={mpesaPasskey}
                    onChange={(e) => { setMpesaPasskey(e.target.value); setCredsSaved(false); }}
                    placeholder="Your Daraja STK push passkey"
                    className="mt-1.5 w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors text-sm font-mono"
                  />
                </div>
              </div>

              <button
                onClick={saveDarajaCreds}
                className="w-full mt-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-900 font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" /> Save credentials
              </button>
              {credsSaved && (
                <p className="mt-2 text-center text-xs text-brand-400 font-semibold animate-fade-in">Saved successfully</p>
              )}

              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="text-xs text-white/40 space-y-1">
                  <p className="font-semibold text-white/60">Sandbox endpoints (already configured):</p>
                  <p className="font-mono text-white/30">https://sandbox.safaricom.co.ke/oauth/v1/generate</p>
                  <p className="font-mono text-white/30">https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest</p>
                  <p className="text-white/40 mt-2">Get your credentials from the Daraja developer portal. Swap to live endpoints when ready for production.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowResetConfirm(false)} />
          <div className="relative w-full max-w-sm bg-ink-800 rounded-2xl border border-white/10 shadow-2xl animate-pop-in p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-flame-500/15 flex items-center justify-center mx-auto">
              <RotateCcw className="h-8 w-8 text-flame-400" />
            </div>
            <h2 className="mt-4 font-display font-extrabold text-xl text-white">Reset entire season?</h2>
            <p className="text-white/50 text-sm mt-2">
              This will permanently delete all contestants, votes, comments, and registrations. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { adminAction("reset"); setShowResetConfirm(false); }}
                disabled={busy}
                className="flex-1 py-3 rounded-xl bg-flame-500 hover:bg-flame-400 text-white font-bold text-sm transition-all active:scale-95"
              >
                Yes, reset everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove contestant confirmation modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setRemoveTarget(null)} />
          <div className="relative w-full max-w-sm bg-ink-800 rounded-2xl border border-white/10 shadow-2xl animate-pop-in p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-flame-500/15 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-flame-400" />
            </div>
            <h2 className="mt-4 font-display font-extrabold text-xl text-white">Remove this contestant?</h2>
            <p className="text-white/50 text-sm mt-2">
              Are you sure you want to remove <span className="text-white font-bold">{removeTarget.full_name}</span> from the competition? This will also delete all their votes and comments. This action cannot be undone.
            </p>
            <div className="mt-4 rounded-lg bg-ink-700/60 border border-white/5 p-3 flex items-center gap-3">
              <Avatar id={removeTarget.id} firstName={removeTarget.first_name} lastName={removeTarget.last_name} imageUrl={removeTarget.profile_image_url} size="sm" />
              <div className="text-left min-w-0">
                <div className="text-white text-sm font-semibold truncate">{removeTarget.full_name}</div>
                <div className="text-white/40 text-xs">{removeTarget.category} · {removeTarget.university}</div>
                <div className="text-brand-400 text-xs font-bold">{formatVotes(removeTarget.votes_count)} votes</div>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setRemoveTarget(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { adminAction("remove", { contestantId: removeTarget.id }); setRemoveTarget(null); }}
                disabled={busy}
                className="flex-1 py-3 rounded-xl bg-flame-500 hover:bg-flame-400 text-white font-bold text-sm transition-all active:scale-95"
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
