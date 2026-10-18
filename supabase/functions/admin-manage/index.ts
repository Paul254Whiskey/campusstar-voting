// Admin management edge function
// Handles: approve registration, reject registration, remove contestant,
// full season reset (delete all contestants, votes, comments, registrations).
// Protected by a hardcoded admin password check.
// JWT verification is disabled — access is controlled by the password gate.

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_PASSWORD = "Campus.Admin.254#";

interface AdminRequest {
  action: "approve" | "reject" | "remove" | "reset" | "stats" | "set-deadline" | "add-time";
  password: string;
  registrationId?: string;
  contestantId?: string;
  deadline?: string;
  addHours?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AdminRequest;

    // Password gate
    if (body.password !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "Invalid admin password" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- APPROVE: copy registration into contestants as approved ---
    if (body.action === "approve" && body.registrationId) {
      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", body.registrationId)
        .maybeSingle();

      if (regErr || !reg) {
        return new Response(
          JSON.stringify({ error: "Registration not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert into contestants as approved
      const { error: insertErr } = await supabase
        .from("contestants")
        .insert({
          full_name: reg.full_name,
          first_name: reg.first_name,
          last_name: reg.last_name,
          contact_number: reg.contact_number,
          category: reg.category,
          gender: reg.gender,
          county: reg.county,
          university: reg.university,
          profile_image_url: reg.profile_image_url,
          social_handles: reg.social_handles || {},
          bio: reg.bio || "",
          hobbies: reg.hobbies || "",
          fun_facts: reg.fun_facts || "",
          place_of_study: reg.place_of_study || "",
          votes_count: 0,
          is_verified: false,
          is_trending: false,
          level: "campus",
          status: "approved",
        });

      if (insertErr) {
        return new Response(
          JSON.stringify({ error: "Failed to approve contestant: " + insertErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark registration as approved
      await supabase
        .from("registrations")
        .update({ status: "approved" })
        .eq("id", body.registrationId);

      return new Response(
        JSON.stringify({ ok: true, message: "Contestant approved and added to leaderboard" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- REJECT: mark registration as rejected ---
    if (body.action === "reject" && body.registrationId) {
      await supabase
        .from("registrations")
        .update({ status: "rejected" })
        .eq("id", body.registrationId);

      return new Response(
        JSON.stringify({ ok: true, message: "Registration rejected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- REMOVE: delete a contestant from the competition ---
    if (body.action === "remove" && body.contestantId) {
      // Delete contestant (votes cascade-delete via FK)
      const { error: delErr } = await supabase
        .from("contestants")
        .delete()
        .eq("id", body.contestantId);

      if (delErr) {
        return new Response(
          JSON.stringify({ error: "Failed to remove contestant" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Contestant removed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- RESET: wipe all data for a new season ---
    if (body.action === "reset") {
      await supabase.from("mpesa_payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("top_supporters").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("profile_edit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("contestant_accounts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("votes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("pinned_contestants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("contestants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("registrations").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      return new Response(
        JSON.stringify({ ok: true, message: "Season reset complete — all data cleared" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- SET-DEADLINE: reset countdown to a new deadline ---
    if (body.action === "set-deadline") {
      const deadline = body.deadline || new Date(Date.now() + 30 * 86400000).toISOString();
      await supabase.from("app_settings").upsert({
        id: 1,
        voting_deadline: deadline,
        updated_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ ok: true, message: "Countdown reset", votingDeadline: deadline }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- ADD-TIME: extend the countdown by N hours ---
    if (body.action === "add-time") {
      const hours = body.addHours || 24;
      const { data: settings } = await supabase
        .from("app_settings")
        .select("voting_deadline")
        .eq("id", 1)
        .maybeSingle();
      const current = settings?.voting_deadline
        ? new Date(settings.voting_deadline)
        : new Date();
      const newDeadline = new Date(current.getTime() + hours * 3600000);
      await supabase.from("app_settings").upsert({
        id: 1,
        voting_deadline: newDeadline.toISOString(),
        updated_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ ok: true, message: `Added ${hours}h to countdown`, votingDeadline: newDeadline.toISOString() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- STATS: return admin dashboard summary ---
    if (body.action === "stats") {
      const { data: contestants } = await supabase
        .from("contestants")
        .select("*")
        .order("votes_count", { ascending: false });

      const { data: pending } = await supabase
        .from("registrations")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const { data: votes } = await supabase
        .from("votes")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: payments } = await supabase
        .from("mpesa_payments")
        .select("id, contestant_id, phone, amount_kes, vote_count, status, mpesa_code, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      const { data: editLogs } = await supabase
        .from("profile_edit_logs")
        .select("id, contestant_id, changed_fields, old_values, new_values, edited_at")
        .order("edited_at", { ascending: false })
        .limit(100);

      const { data: settings } = await supabase
        .from("app_settings")
        .select("voting_deadline")
        .eq("id", 1)
        .maybeSingle();

      // Build contestant name lookup
      const nameMap: Record<string, string> = {};
      (contestants || []).forEach((c: any) => { nameMap[c.id] = c.full_name; });

      const paymentsWithNames = (payments || []).map((p: any) => ({
        ...p,
        contestant_name: nameMap[p.contestant_id] || "Unknown",
      }));

      const logsWithNames = (editLogs || []).map((l: any) => ({
        ...l,
        contestant_name: nameMap[l.contestant_id] || "Unknown",
      }));

      return new Response(
        JSON.stringify({
          ok: true,
          contestants: contestants || [],
          pendingRegistrations: pending || [],
          payments: paymentsWithNames,
          editLogs: logsWithNames,
          votingDeadline: settings?.voting_deadline || null,
          totalVotes: (votes || []).filter((v: any) => v.status === "completed").reduce((s: number, v: any) => s + v.vote_count, 0),
          totalRevenue: (votes || []).filter((v: any) => v.status === "completed").reduce((s: number, v: any) => s + v.amount_kes, 0),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
