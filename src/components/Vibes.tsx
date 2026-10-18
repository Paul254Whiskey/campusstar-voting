import { Music, Car, PartyPopper, Flame, Headphones, Radio, Disc3, Sparkles, Zap, Star } from "lucide-react";

const VIBES = [
  "Gengetone", "Afrobeats", "Odi Dance", "Matatu Culture", "Sheng", "Genje",
  "Genge", "Otonglo", "Denge", "Nyash", "Sapreme", "Kameme",
];

const VIBE_ICONS = [Music, Car, PartyPopper, Flame, Headphones, Radio, Disc3, Sparkles, Zap, Star];

export function CultureMarquee() {
  const items = [...VIBES, ...VIBES];
  return (
    <div className="relative py-3 border-y border-white/5 bg-ink-800/50 marquee-mask overflow-hidden">
      <div className="flex gap-8 whitespace-nowrap animate-marquee">
        {items.map((v, i) => {
          const Icon = VIBE_ICONS[i % VIBE_ICONS.length];
          return (
            <span key={i} className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
              <Icon className="h-3.5 w-3.5 text-brand-400" />
              <span className={i % 3 === 0 ? "text-gradient" : i % 3 === 1 ? "text-gradient-flame" : "text-white/70"}>
                {v}
              </span>
              <span className="text-white/20 ml-2">●</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function EqualizerBars({ className = "" }: { className?: string }) {
  const bars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return (
    <div className={`flex items-end gap-0.5 h-8 ${className}`}>
      {bars.map((b) => (
        <div
          key={b}
          className="eq-bar animate-eq"
          style={{
            height: "100%",
            animationDelay: `${b * 0.08}s`,
            animationDuration: `${0.7 + (b % 4) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

export function FloatingVibes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-[8%] left-[5%] animate-float-slow opacity-20">
        <Headphones className="h-12 w-12 text-vibe-cyan" />
      </div>
      <div className="absolute top-[15%] right-[8%] animate-float opacity-20" style={{ animationDelay: "1.5s" }}>
        <Disc3 className="h-14 w-14 text-vibe-pink" />
      </div>
      <div className="absolute top-[55%] left-[3%] animate-float-slow opacity-15" style={{ animationDelay: "2s" }}>
        <Car className="h-12 w-12 text-brand-400" />
      </div>
      <div className="absolute bottom-[15%] right-[5%] animate-float opacity-20" style={{ animationDelay: "0.5s" }}>
        <PartyPopper className="h-12 w-12 text-accent-400" />
      </div>
      <div className="absolute top-[40%] right-[12%] animate-float-slow opacity-15" style={{ animationDelay: "3s" }}>
        <Radio className="h-10 w-10 text-vibe-lime" />
      </div>
    </div>
  );
}
