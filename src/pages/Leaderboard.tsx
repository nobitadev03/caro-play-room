import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfileButton } from "@/components/ui/auth";

interface ProfileRow {
  id: string;
  display_name: string;
  elo_rating: number;
  wins: number;
  losses: number;
  draws: number;
  win_streak: number;
}

const Leaderboard = () => {
  const [players, setPlayers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      // Cast supabase to any to bypass strict generated types that don't have 'profiles' yet
      const { data } = await (supabase as any)
        .from("profiles")
        .select("*")
        .order("elo_rating", { ascending: false })
        .limit(100);

      if (data) setPlayers(data);
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> Bảng xếp hạng
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserProfileButton />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-5 h-5" /> Đang tải dữ liệu...
            </div>
          </div>
        ) : (
          <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
            <div className="grid grid-cols-[3rem_1fr_4rem_4rem_4rem] sm:grid-cols-[4rem_1fr_6rem_5rem_5rem] gap-2 p-4 border-b bg-muted/30 text-xs sm:text-sm font-semibold text-muted-foreground">
              <div className="text-center">#</div>
              <div>Tuyển thủ</div>
              <div className="text-right">ELO</div>
              <div className="text-right hidden sm:block">Thắng</div>
              <div className="text-right">Chuỗi</div>
            </div>
            
            <div className="divide-y">
              {players.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Chưa có dữ liệu người chơi.</div>
              ) : (
                players.map((player, index) => (
                  <div key={player.id} className="grid grid-cols-[3rem_1fr_4rem_4rem_4rem] sm:grid-cols-[4rem_1fr_6rem_5rem_5rem] gap-2 p-4 items-center hover:bg-muted/10 transition-colors">
                    <div className="text-center font-mono">
                      {index === 0 ? <Medal className="w-5 h-5 mx-auto text-yellow-500" /> : 
                       index === 1 ? <Medal className="w-5 h-5 mx-auto text-gray-400" /> : 
                       index === 2 ? <Medal className="w-5 h-5 mx-auto text-amber-700" /> : 
                       <span className="text-muted-foreground">{index + 1}</span>}
                    </div>
                    <div className="font-medium truncate" title={player.display_name}>
                      {player.display_name}
                    </div>
                    <div className="text-right font-bold text-primary">
                      {player.elo_rating}
                    </div>
                    <div className="text-right text-muted-foreground hidden sm:block">
                      {player.wins}
                    </div>
                    <div className="text-right flex items-center justify-end gap-1">
                      {player.win_streak > 2 && <span className="text-orange-500 text-xs">🔥</span>}
                      <span className={player.win_streak > 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>
                        {player.win_streak}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
