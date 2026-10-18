// M-Pesa STK Push edge function — REAL Daraja API (sandbox)
// Gets an OAuth token from Safaricom Daraja, sends a real STK push to the
// voter's phone. Credentials (consumerKey, consumerSecret, passkey) are passed
// in the request body from the frontend admin settings panel.
// Sandbox URL: sandbox.safaricom.co.ke

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DARAJA_BASE = "https://sandbox.safaricom.co.ke";
const SHORTCODE = "116016474";
const PARTY_B = "116016474";

interface STKRequest {
  contestantId: string;
  contestantName: string;
  voterPhone: string;
  amountKes: number;
  voteCount: number;
  packageId: string;
  supporterName?: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as STKRequest;
    const {
      contestantId, contestantName, voterPhone, amountKes, voteCount,
      supporterName, consumerKey, consumerSecret, passkey,
    } = body;

    if (!contestantId || !voterPhone || !amountKes || !voteCount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!consumerKey || !consumerSecret || !passkey) {
      return new Response(
        JSON.stringify({ error: "Daraja credentials not configured. Add them in Admin settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone to 254XXXXXXXXX
    let phone = voterPhone.replace(/\s+/g, "");
    if (phone.startsWith("0")) phone = "254" + phone.slice(1);
    if (phone.startsWith("+254")) phone = phone.slice(1);
    if (!phone.startsWith("254")) phone = "254" + phone.replace(/^0+/, "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Create a pending vote row
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .insert({
        contestant_id: contestantId,
        voter_phone: voterPhone,
        amount_kes: amountKes,
        vote_count: voteCount,
        status: "pending",
        mpesa_code: "",
        supporter_name: supporterName || null,
      })
      .select()
      .single();

    if (voteError) {
      return new Response(
        JSON.stringify({ error: "Failed to create vote record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get Daraja OAuth access token
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(
      `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text();
      // Mark vote as failed
      await supabase.from("votes").update({ status: "failed" }).eq("id", vote.id);
      return new Response(
        JSON.stringify({ error: "Failed to get Daraja access token", details: tokenErr }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    if (!accessToken) {
      await supabase.from("votes").update({ status: "failed" }).eq("id", vote.id);
      return new Response(
        JSON.stringify({ error: "Daraja returned no access token", details: tokenJson }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Build STK push request
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, "")
      .slice(0, 14);
    const password = btoa(`${SHORTCODE}${passkey}${timestamp}`);

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback?voteId=${vote.id}`;

    // 4. Send STK push
    const stkRes = await fetch(
      `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amountKes,
          PartyA: phone,
          PartyB: PARTY_B,
          PhoneNumber: phone,
          CallBackURL: callbackUrl,
          AccountReference: "CampusStar",
          TransactionDesc: "Vote",
        }),
      }
    );

    const stkJson = await stkRes.json();

    // Daraja returns a ResponseCode; 0 = success. If not 0, the STK didn't send.
    if (stkJson.ResponseCode !== "0") {
      await supabase.from("votes").update({ status: "failed" }).eq("id", vote.id);
      return new Response(
        JSON.stringify({
          error: "STK push failed to send",
          details: stkJson.ResponseDescription || stkJson.errorMessage || "Unknown Daraja error",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Store the CheckoutRequestID on the vote row for callback matching
    const checkoutRequestId = stkJson.CheckoutRequestID || "";
    await supabase
      .from("votes")
      .update({ checkout_request_id: checkoutRequestId })
      .eq("id", vote.id);

    // 6. Create a pending mpesa_payment row
    await supabase.from("mpesa_payments").insert({
      contestant_id: contestantId,
      phone: phone,
      amount_kes: amountKes,
      vote_count: voteCount,
      status: "pending",
      mpesa_code: "",
    });

    return new Response(
      JSON.stringify({
        ok: true,
        voteId: vote.id,
        checkoutRequestId,
        phone: phone,
        customerMessage: "Enter your M-Pesa PIN on your phone to complete the payment.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
