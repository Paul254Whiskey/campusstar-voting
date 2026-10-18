// Register contestant edge function
// Inserts a new registration row (pending admin approval). The frontend could
// insert directly, but routing through here lets us validate and later notify
// the admin. Public (no auth). Accepts bio/hobbies/fun_facts/place_of_study.

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RegistrationBody {
  fullName: string;
  firstName?: string;
  lastName?: string;
  contactNumber: string;
  category: string;
  gender: string;
  county: string;
  university: string;
  profileImageUrl?: string | null;
  bio?: string;
  hobbies?: string;
  funFacts?: string;
  placeOfStudy?: string;
  socialHandles?: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    x?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RegistrationBody;
    const {
      fullName, firstName, lastName, contactNumber,
      category, gender, county, university,
      profileImageUrl, bio, hobbies, funFacts, placeOfStudy, socialHandles,
    } = body;

    if (!fullName || !contactNumber || !category || !university) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Derive first/last from full name if not provided
    const parts = fullName.trim().split(/\s+/);
    const fn = firstName || parts[0] || "";
    const ln = lastName || parts.slice(1).join(" ") || "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("registrations")
      .insert({
        full_name: fullName,
        first_name: fn,
        last_name: ln,
        contact_number: contactNumber,
        category,
        gender: gender || "Male",
        county: county || "Nairobi",
        university,
        profile_image_url: profileImageUrl || null,
        bio: bio || "",
        hobbies: hobbies || "",
        fun_facts: funFacts || "",
        place_of_study: placeOfStudy || "",
        social_handles: socialHandles || {},
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to save registration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, registrationId: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
