import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Contestant, PinnedContestant, Comment } from "@/lib/types";
import { getVoterPhone } from "@/lib/utils";

export function useContestants() {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("contestants")
        .select("*")
        .eq("status", "approved")
        .order("votes_count", { ascending: false });
      if (error) throw error;
      setContestants((data || []) as Contestant[]);
    } catch (e: any) {
      setError(e.message || "Failed to load contestants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Subscribe to vote changes for real-time updates
    const channel = supabase
      .channel("contestants-votes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contestants" },
        (payload) => {
          setContestants((prev) => {
            const updated = payload.new as Contestant;
            const next = prev.map((c) => (c.id === updated.id ? updated : c));
            next.sort((a, b) => b.votes_count - a.votes_count);
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contestants" },
        (payload) => {
          const added = payload.new as Contestant;
          setContestants((prev) => {
            if (prev.some((c) => c.id === added.id)) return prev;
            const next = [...prev, added];
            next.sort((a, b) => b.votes_count - a.votes_count);
            return next;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { contestants, loading, error, refresh };
}

export function usePinned() {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const voterPhone = getVoterPhone();

  const refresh = useCallback(async () => {
    if (!voterPhone) { setPinnedIds(new Set()); return; }
    try {
      const { data } = await supabase
        .from("pinned_contestants")
        .select("contestant_id")
        .eq("voter_phone", voterPhone);
      setPinnedIds(new Set((data || []).map((p) => (p as PinnedContestant).contestant_id)));
    } catch { /* ignore */ }
  }, [voterPhone]);

  useEffect(() => { refresh(); }, [refresh]);

  const togglePin = useCallback(async (contestant: Contestant) => {
    const contestantId = contestant.id;
    if (!voterPhone) return;
    const isPinned = pinnedIds.has(contestantId);
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (isPinned) next.delete(contestantId);
      else next.add(contestantId);
      return next;
    });
    try {
      if (isPinned) {
        await supabase.from("pinned_contestants").delete().eq("contestant_id", contestantId).eq("voter_phone", voterPhone);
      } else {
        await supabase.from("pinned_contestants").insert({ contestant_id: contestantId, voter_phone: voterPhone });
      }
    } catch { refresh(); }
  }, [pinnedIds, voterPhone, refresh]);

  return { pinnedIds, togglePin, refresh };
}

export function useComments(contestantId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!contestantId) { setComments([]); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("contestant_id", contestantId)
        .order("created_at", { ascending: false });
      setComments((data || []) as Comment[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [contestantId]);

  useEffect(() => {
    refresh();
    if (!contestantId) return;
    const channel = supabase
      .channel(`comments-${contestantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          const added = payload.new as Comment;
          setComments((prev) => (prev.some((c) => c.id === added.id) ? prev : [added, ...prev]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh, contestantId]);

  const addComment = useCallback(async (name: string, body: string) => {
    if (!contestantId || !body.trim()) return;
    const phone = getVoterPhone();
    const { data, error } = await supabase
      .from("comments")
      .insert({
        contestant_id: contestantId,
        voter_name: name.trim() || "Anonymous",
        voter_phone: phone,
        body: body.trim(),
      })
      .select()
      .single();
    if (!error && data) {
      setComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [data as Comment, ...prev]));
    }
  }, [contestantId]);

  return { comments, loading, addComment, refresh };
}
