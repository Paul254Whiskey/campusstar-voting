// M-Pesa callback edge function — receives the real Safaricom STK callback
// URL params: ?voteId=<uuid> — passed in the CallBackURL by mpesa-stk.
// On success: marks vote completed, increments contestant votes_count,
//             updates mpesa_payment to completed.
// On failure: marks vote failed, updates mpesa_payment to failed.

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract voteId from query params (set in the CallBackURL by mpesa-stk)
    const url = new URL(req.url);
    const voteId = url.searchParams.get("voteId");

    if (!voteId) {
      return new Response(
        JSON.stringify({ error: "voteId query param required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the vote row
    const { data: vote, error: fetchErr } = await supabase
      .from("votes")
      .select("id, contestant_id, vote_count, status, voter_phone, amount_kes, supporter_name")
      .eq("id", voteId)
      .maybeSingle();

    if (fetchErr || !vote) {
      return new Response(
        JSON.stringify({ error: "Vote not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (vote.status === "completed") {
      return new Response(
        JSON.stringify({ ok: true, alreadyCompleted: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the Safaricom callback body
    const body = await req.json();
    const cb = body?.Body?.stkCallback;

    let success = false;
    let mpesaCode = "";

    if (cb) {
      success = cb.ResultCode === 0;
      const result = cb.CallbackMetadata?.Item || [];
      const mpesaItem = result.find((i: any) => i.Name === "MpesaReceiptNumber");
      mpesaCode = mpesaItem?.Value || "";
    }

    const newStatus = success ? "completed" : "failed";

    if (success) {
      // Increment contestant's votes_count
      const { data: contestant } = await supabase
        .from("contestants")
        .select("votes_count")
        .eq("id", vote.contestant_id)
        .maybeSingle();

      if (contestant) {
        await supabase
          .from("contestants")
          .update({ votes_count: contestant.votes_count + vote.vote_count })
          .eq("id", vote.contestant_id);
      }

      // Update the matching mpesa_payment row to completed
      await supabase
        .from("mpesa_payments")
        .update({ status: "completed", mpesa_code: mpesaCode })
        .eq("contestant_id", vote.contestant_id)
        .eq("phone", vote.voter_phone)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      // Upsert top_supporters for this contestant
      const supporterName = vote.supporter_name || "Anonymous";
      const isAnonymous = !vote.supporter_name;
      const phoneKey = vote.voter_phone || "unknown";
      const { data: existing } = await supabase
        .from("top_supporters")
        .select("id, total_votes")
        .eq("contestant_id", vote.contestant_id)
        .eq("voter_phone", phoneKey)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("top_supporters")
          .update({
            total_votes: existing.total_votes + vote.vote_count,
            supporter_name: supporterName,
            is_anonymous: isAnonymous,
            last_voted_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("top_supporters").insert({
          contestant_id: vote.contestant_id,
          supporter_name: supporterName,
          voter_phone: phoneKey,
          total_votes: vote.vote_count,
          is_anonymous: isAnonymous,
          last_voted_at: new Date().toISOString(),
        });
      }
    } else {
      // Update the matching mpesa_payment row to failed
      await supabase
        .from("mpesa_payments")
        .update({ status: "failed" })
        .eq("contestant_id", vote.contestant_id)
        .eq("phone", vote.voter_phone)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);
    }

    // Update the vote row
    await supabase
      .from("votes")
      .update({ status: newStatus, mpesa_code: mpesaCode })
      .eq("id", voteId);

    return new Response(
      JSON.stringify({ ok: true, status: newStatus, voteCount: vote.vote_count }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
