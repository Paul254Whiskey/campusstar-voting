import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownProps {
  target: string;
  className?: string;
}

function diffParts(target: number) {
  const now = Date.now();
  let remaining = Math.max(0, target - now);
  const days = Math.floor(remaining / 86_400_000);
  remaining -= days * 86_400_000;
  const hours = Math.floor(remaining / 3_600_000);
  remaining -= hours * 3_600_000;
  const minutes = Math.floor(remaining / 60_000);
  remaining -= minutes * 60_000;
  const seconds = Math.floor(remaining / 1000);
  return { days, hours, minutes, seconds, done: target - now <= 0 };
}

export function Countdown({ target, className }: CountdownProps) {
  const targetMs = new Date(target).getTime();
  const [parts, setParts] = useState(() => diffParts(targetMs));

  useEffect(() => {
    const id = setInterval(() => setParts(diffParts(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (parts.done) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-flame-400 font-bold">
          <Clock className="h-4 w-4" /> Voting has closed
        </div>
      </div>
    );
  }

  const units = [
    { label: "Days", value: parts.days },
    { label: "Hours", value: parts.hours },
    { label: "Min", value: parts.minutes },
    { label: "Sec", value: parts.seconds },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div
            key={u.label}
            className="rounded-xl bg-ink-800/80 border border-white/10 py-2.5 px-1 text-center"
          >
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-white tabular-nums leading-none">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-white/40 mt-1">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
