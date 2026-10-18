import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav, Page } from "@/components/BottomNav";
import { HomePage } from "@/pages/HomePage";
import { RankingsPage } from "@/pages/RankingsPage";
import { JoinPage } from "@/pages/JoinPage";
import { VotePage } from "@/pages/VotePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { VersusPage } from "@/pages/VersusPage";
import { AdminPage } from "@/pages/AdminPage";
import { ContestantProfilePage } from "@/pages/ContestantProfilePage";

function App() {
  const [page, setPage] = useState<Page>("home");
  const [profileContestantId, setProfileContestantId] = useState<string | null>(null);

  function navigate(p: Page) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }

  function openProfile(contestantId: string) {
    setProfileContestantId(contestantId);
    navigate("profile");
  }

  return (
    <div className="min-h-screen bg-ink-900">
      <Header page={page} onNavigate={navigate} />
      <main>
        {page === "home" && <HomePage onNavigate={navigate} onOpenProfile={openProfile} />}
        {page === "rankings" && <RankingsPage onOpenProfile={openProfile} />}
        {page === "join" && <JoinPage />}
        {page === "vote" && <VotePage />}
        {page === "dashboard" && <DashboardPage onNavigate={navigate} />}
        {page === "versus" && <VersusPage />}
        {page === "admin" && <AdminPage />}
        {page === "profile" && profileContestantId && (
          <ContestantProfilePage contestantId={profileContestantId} onBack={() => navigate("rankings")} />
        )}
      </main>
      <BottomNav page={page} onNavigate={navigate} />
    </div>
  );
}

export default App;
