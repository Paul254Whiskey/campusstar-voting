// Contestant profile management edge function
// Actions:
//   - "login": verify contestant_id + password, return contestant data
//   - "set-password": create/update password for a contestant (first-time setup)
//   - "update-profile": update editable fields, log changes to profile_edit_logs
//   - "get-account": check if account has a password set

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Simple hash for demo (not crypto-secure — upgrade to bcrypt in production)
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return "h" + Math.abs(h).toString(36) + s.length.toString(36);
}

const EDITABLE_FIELDS = [
  "bio", "hobbies", "fun_facts", "place_of_study",
  "social_handles", "profile_image_url", "contact_number",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const action = body.action;

    if (action === "get-account") {
      const { data } = await supabase
        .from("contestant_accounts")
        .select("contestant_id, password_hash")
        .eq("contestant_id", body.contestantId)
        .maybeSingle();
      return new Response(
        JSON.stringify({ ok: true, hasPassword: !!(data && data.password_hash) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "set-password") {
      if (!body.contestantId || !body.password || body.password.length < 4) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 4 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const hash = simpleHash(body.password);
      const { data: existing } = await supabase
        .from("contestant_accounts")
        .select("id")
        .eq("contestant_id", body.contestantId)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("contestant_accounts")
          .update({ password_hash: hash })
          .eq("id", existing.id);
      } else {
        await supabase.from("contestant_accounts").insert({
          contestant_id: body.contestantId,
          password_hash: hash,
        });
      }
      return new Response(
        JSON.stringify({ ok: true, message: "Password set" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "login") {
      const { data: account } = await supabase
        .from("contestant_accounts")
        .select("contestant_id, password_hash")
        .eq("contestant_id", body.contestantId)
        .maybeSingle();
      if (!account || !account.password_hash) {
        return new Response(
          JSON.stringify({ error: "No account found. Please set a password first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (account.password_hash !== simpleHash(body.password)) {
        return new Response(
          JSON.stringify({ error: "Incorrect password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data: contestant } = await supabase
        .from("contestants")
        .select("*")
        .eq("id", body.contestantId)
        .maybeSingle();
      return new Response(
        JSON.stringify({ ok: true, contestant }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update-profile") {
      const { contestantId, password, updates } = body;
      if (!contestantId || !password || !updates) {
        return new Response(
          JSON.stringify({ error: "Missing fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Verify password
      const { data: account } = await supabase
        .from("contestant_accounts")
        .select("password_hash")
        .eq("contestant_id", contestantId)
        .maybeSingle();
      if (!account || account.password_hash !== simpleHash(password)) {
        return new Response(
          JSON.stringify({ error: "Authentication failed" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter to only editable fields
      const cleanUpdates: Record<string, any> = {};
      const changedFields: string[] = [];
      for (const key of EDITABLE_FIELDS) {
        if (key in updates) {
          cleanUpdates[key] = updates[key];
          changedFields.push(key);
        }
      }
      if (changedFields.length === 0) {
        return new Response(
          JSON.stringify({ ok: true, message: "No changes" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch old values for audit
      const { data: oldRow } = await supabase
        .from("contestants")
        .select(changedFields.join(","))
        .eq("id", contestantId)
        .maybeSingle();

      // Apply update
      const { error: updateErr } = await supabase
        .from("contestants")
        .update(cleanUpdates)
        .eq("id", contestantId);
      if (updateErr) {
        return new Response(
          JSON.stringify({ error: "Failed to update profile" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the edit
      await supabase.from("profile_edit_logs").insert({
        contestant_id: contestantId,
        changed_fields: changedFields.join(", "),
        old_values: oldRow || {},
        new_values: cleanUpdates,
      });

      const { data: updated } = await supabase
        .from("contestants")
        .select("*")
        .eq("id", contestantId)
        .maybeSingle();

      return new Response(
        JSON.stringify({ ok: true, contestant: updated, message: "Profile updated" }),
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
