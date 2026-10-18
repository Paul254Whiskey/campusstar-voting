import { Sparkles, Shield } from "lucide-react";
import { Page } from "./BottomNav";
import { classNames } from "@/lib/utils";

interface HeaderProps {
  page: Page;
  onNavigate: (p: Page) => void;
}

const navItems: { id: Page; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "rankings", label: "Competitors" },
  { id: "versus", label: "1v1 Battles" },
  { id: "join", label: "Enter" },
  { id: "vote", label: "Vote" },
  { id: "dashboard", label: "Dashboard" },
  { id: "admin", label: "Admin" },
];

export function Header({ page, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-ink-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-ink-900" fill="currentColor" />
          </div>
          <div className="leading-none">
            <div className="font-display font-extrabold text-white text-lg">CampusStar</div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">Kenya</div>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={classNames(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                page === item.id
                  ? "text-brand-400 bg-brand-500/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => onNavigate("admin")}
          className="hidden lg:inline-flex px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm font-semibold transition-all active:scale-95 items-center gap-1.5"
        >
          <Shield className="h-4 w-4" /> Admin
        </button>
      </div>
    </header>
  );
}
