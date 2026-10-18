import { useState } from "react";
import { EDGE_FUNCTION_BASE } from "@/lib/supabase";
import { CATEGORIES, COUNTIES, UNIVERSITIES, SUPPORT_PHONE, Gender } from "@/lib/types";
import { Phone, CheckCircle2, Loader2, AlertCircle, User, Instagram, Music2, Facebook, Upload, Heart, Lightbulb, GraduationCap } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { classNames } from "@/lib/utils";

interface JoinPageProps {}

export function JoinPage({}: JoinPageProps) {
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [gender, setGender] = useState<Gender>("Male");
  const [county, setCounty] = useState(COUNTIES[0]);
  const [university, setUniversity] = useState(UNIVERSITIES[0]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [bio, setBio] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [funFacts, setFunFacts] = useState("");
  const [placeOfStudy, setPlaceOfStudy] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!fullName || !contact || !university) {
      setError("Fill in your full name, contact number, and university");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch(`${EDGE_FUNCTION_BASE}/register-contestant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          fullName,
          firstName,
          lastName,
          contactNumber: contact,
          category,
          gender,
          county,
          university,
          profileImageUrl: profileImage,
          bio,
          hobbies,
          funFacts,
          placeOfStudy,
          socialHandles: {
            instagram: instagram || undefined,
            tiktok: tiktok || undefined,
            facebook: facebook || undefined,
            x: xHandle || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Submission failed");
      setStatus("success");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-vibe min-h-screen pb-24 lg:pb-12 flex items-center justify-center px-4 bg-grid relative">
        <div className="max-w-md w-full text-center py-12">
          <div className="h-20 w-20 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-brand-400" />
          </div>
          <h1 className="mt-5 font-display font-extrabold text-2xl text-white">Application received!</h1>
          <p className="mt-2 text-white/60 text-sm">
            Thanks {firstName}. Our admin team is reviewing your entry. Once approved, you'll appear on the leaderboard in your category.
          </p>
          <p className="mt-4 text-xs text-white/40">
            Expect a confirmation within 24–48 hours. For urgent queries call{" "}
            <a href={`tel:${SUPPORT_PHONE}`} className="text-brand-400 font-semibold">{SUPPORT_PHONE}</a>.
          </p>
          <button
            onClick={() => { setStatus("idle"); setFullName(""); setContact(""); setProfileImage(null); setInstagram(""); setTiktok(""); setFacebook(""); setXHandle(""); setBio(""); setHobbies(""); setFunFacts(""); setPlaceOfStudy(""); }}
            className="mt-6 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-900 font-bold transition-all active:scale-95"
          >
            Submit another entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-vibe min-h-screen pb-24 lg:pb-12 bg-grid relative">
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-10">
        <h1 className="font-display font-extrabold text-3xl text-white">Enter the competition</h1>
        <p className="text-white/50 text-sm mt-1">Free to enter · Open to every campus in Kenya</p>

        <div className="mt-6 space-y-5">
          {/* Profile picture */}
          <div className="rounded-2xl bg-ink-700/60 border border-white/5 p-5">
            <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Profile picture</label>
            <div className="mt-3 flex items-center gap-4">
              <Avatar id={fullName || "preview"} firstName={firstName} lastName={lastName} imageUrl={profileImage} size="lg" />
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" /> Upload photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <p className="text-xs text-white/40 mt-2">Optional — we'll show your initials if you skip.</p>
              </div>
            </div>
          </div>

          {/* Personal details */}
          <div className="rounded-2xl bg-ink-700/60 border border-white/5 p-5 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Full names *</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Reece Brian"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Contact number *</label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="0712 345 678"
                  type="tel"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Gender</label>
                <div className="mt-1.5 flex gap-2">
                  {(["Male", "Female"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={classNames(
                        "flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all",
                        gender === g ? "bg-brand-500/15 text-brand-400 border-brand-400/40" : "bg-ink-800 text-white/50 border-white/10"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 w-full px-3 py-3 rounded-xl bg-ink-800 border border-white/10 text-white focus:outline-none focus:border-brand-400 transition-colors"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">County</label>
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="mt-1.5 w-full px-3 py-3 rounded-xl bg-ink-800 border border-white/10 text-white focus:outline-none focus:border-brand-400 transition-colors"
                >
                  {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">University *</label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="mt-1.5 w-full px-3 py-3 rounded-xl bg-ink-800 border border-white/10 text-white focus:outline-none focus:border-brand-400 transition-colors"
                >
                  {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* About me / bio */}
          <div className="rounded-2xl bg-ink-700/60 border border-white/5 p-5 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Tell voters about yourself</label>
              <p className="text-xs text-white/30 mt-1">These details appear on your public profile when voters tap your name.</p>
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Short bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. I'm a third-year student passionate about creating viral TikTok content..."
                rows={2}
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> Hobbies & interests</label>
              <input
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="e.g. Dancing, content creation, photography"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Fun facts / funfairs</label>
              <input
                value={funFacts}
                onChange={(e) => setFunFacts(e.target.value)}
                placeholder="e.g. I once performed at a campus event with 500+ attendees"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Place of study</label>
              <input
                value={placeOfStudy}
                onChange={(e) => setPlaceOfStudy(e.target.value)}
                placeholder="e.g. Main Campus, Thika Road, Nairobi"
                className="mt-1.5 w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Social handles */}
          <div className="rounded-2xl bg-ink-700/60 border border-white/5 p-5 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">Social media handles</label>
              <p className="text-xs text-white/30 mt-1">Voters can click these to visit your profiles.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SocialInput icon={Instagram} placeholder="instagram handle" value={instagram} onChange={setInstagram} />
              <SocialInput icon={Music2} placeholder="tiktok handle" value={tiktok} onChange={setTiktok} />
              <SocialInput icon={Facebook} placeholder="facebook handle" value={facebook} onChange={setFacebook} />
              <SocialInput icon={User} placeholder="x (twitter) handle" value={xHandle} onChange={setXHandle} />
            </div>
          </div>

          {status === "error" && (
            <div className="rounded-xl bg-flame-500/10 border border-flame-400/30 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-flame-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-flame-400 font-semibold text-sm">Couldn't submit</div>
                <div className="text-white/60 text-xs mt-0.5">{error}</div>
              </div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={status === "submitting"}
            className="w-full py-4 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-ink-900 font-display font-extrabold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {status === "submitting" ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
            ) : (
              "Submit my entry"
            )}
          </button>

          {/* Support */}
          <div className="text-center text-sm text-white/50">
            Having trouble registering? Call{" "}
            <a href={`tel:${SUPPORT_PHONE}`} className="text-brand-400 font-bold inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> {SUPPORT_PHONE}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialInput({ icon: Icon, placeholder, value, onChange }: { icon: typeof User; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition-colors text-sm"
      />
    </div>
  );
}
