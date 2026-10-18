import { Home, Trophy, UserPlus } from "lucide-react";
import { classNames } from "@/lib/utils";

export type Page = "home" | "rankings" | "join" | "vote" | "dashboard" | "versus" | "admin" | "profile";

interface BottomNavProps {
  page: Page;
  onNavigate: (p: Page) => void;
}

const items: { id: Page; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Compete", icon: Home },
  { id: "rankings", label: "Rankings", icon: Trophy },
  { id: "join", label: "Join", icon: UserPlus },
];

export function BottomNav({ page, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
      <div className="mx-auto max-w-md px-3 pb-3 pt-2">
        <div className="flex items-center justify-around rounded-2xl bg-white/95 backdrop-blur-xl border border-emerald-100 shadow-2xl px-2 py-2">
          {items.map((item) => {
            const active = page === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={classNames(
                  "flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-all",
                  active ? "text-emerald-700" : "text-gray-400 hover:text-emerald-600"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className={classNames("text-[10px] font-semibold", active && "font-bold")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
