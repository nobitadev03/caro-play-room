import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createGameState, makeMove, type GameState, type Player } from "@/lib/gameLogic";

const TURN_SECONDS = 30;

// Generate a unique player ID per browser (persists across tabs)
function getPlayerId(): string {
  let id = localStorage.getItem("caro_player_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("caro_player_id", id);
  }
  return id;
}

export const playerId = getPlayerId();

interface RoomData {
  id: string;
  name: string;
  board_size: number;
  status: string;
  player_x_name: string;
  player_x_id: string;
  player_o_name: string | null;
  player_o_id: string | null;
  turn_deadline: string | null;
  rematch_x_ready: boolean;
  rematch_o_ready: boolean;
  last_starter: string;
}

export function useMultiplayerGame(roomId: string) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gameStateRef = useRef<GameState | null>(null);

  // Keep ref in sync
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Load room and existing moves
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: roomData, error: roomErr } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomErr || !roomData) {
        if (!cancelled) {
          setError("Phòng không tồn tại");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setRoom(roomData);

        if (roomData.player_x_id === playerId) {
          setMyPlayer("X");
        } else if (roomData.player_o_id === playerId) {
          setMyPlayer("O");
        } else {
          setMyPlayer(null);
        }

        const { data: moves } = await supabase
          .from("game_moves")
          .select("*")
          .eq("room_id", roomId)
          .order("move_number", { ascending: true });

        let state = createGameState(roomData.board_size, (roomData.last_starter as Player) || 'X');
        if (moves) {
          for (const m of moves) {
            state = makeMove(state, m.row_idx, m.col_idx);
          }
        }
        setGameState(state);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [roomId]);

  // Subscribe to room + move changes
  useEffect(() => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as RoomData;
          setRoom(updated);
          if (updated.player_x_id === playerId) setMyPlayer("X");
          else if (updated.player_o_id === playerId) setMyPlayer("O");

          // Dual-rematch reset logic
          if (updated.status === "finished" && updated.rematch_x_ready && updated.rematch_o_ready) {
            // Only player X executes the DB reset to prevent race conditions
            if (playerId === updated.player_x_id) {
              const nextStarter = updated.last_starter === 'X' ? 'O' : 'X';
              const deadlineTime = new Date(Date.now() + TURN_SECONDS * 1000).toISOString();
              
              const resetRoom = async () => {
                await supabase.from("game_moves").delete().eq("room_id", roomId);
                
                await supabase.from("game_rooms").update({
                  status: "playing",
                  turn_deadline: deadlineTime,
                  rematch_x_ready: false,
                  rematch_o_ready: false,
                  last_starter: nextStarter
                }).eq("id", roomId);
              };
              resetRoom();
            }
          }

          // Bug 2 fix: rematch — reset game state when room restarts
          if (updated.status === "playing" && gameStateRef.current?.isGameOver) {
            setGameState(createGameState(updated.board_size, (updated.last_starter as Player) || 'X'));
          }

          // Handle timeout or game over from other player's perspective
          if (updated.status === "finished" && gameStateRef.current && !gameStateRef.current.isGameOver) {
            // Note: If it's finished but we don't know why, it's likely a timeout or resignation
            // Since `handleTimeout` sets the loser as `currentPlayer`, the winner is the OPPOSITE of the current player.
            const currentPlayer = gameStateRef.current.currentPlayer;
            const winner: Player = currentPlayer === "X" ? "O" : "X";
            
            setGameState((prev) => {
              if (!prev) return prev;
              // Only apply if it wasn't already game over from a normal move
              if (prev.isGameOver) return prev;
              return { ...prev, isGameOver: true, winner };
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_moves", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const move = payload.new as { row_idx: number; col_idx: number; player: string; move_number: number };
          setGameState((prev) => {
            if (!prev) return prev;
            if (prev.moves.length >= move.move_number) return prev;
            return makeMove(prev, move.row_idx, move.col_idx);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Make a move
  const handleCellClick = useCallback(
    async (row: number, col: number) => {
      const state = gameStateRef.current;
      if (!state || state.isGameOver) return;
      if (!myPlayer) return;
      if (state.currentPlayer !== myPlayer) return;
      if (state.board[row][col] !== null) return;

      const moveNumber = state.moves.length + 1;

      // Optimistic update
      setGameState((prev) => prev ? makeMove(prev, row, col) : prev);

      // Persist move + update deadline for next player
      const deadlineTime = new Date(Date.now() + TURN_SECONDS * 1000).toISOString();

      const { error: moveError } = await supabase.from("game_moves").insert({
        room_id: roomId,
        row_idx: row,
        col_idx: col,
        player: myPlayer,
        move_number: moveNumber,
      });

      if (moveError) {
        console.error("Failed to save move:", moveError);
        // Rollback
        const { data: moves } = await supabase
          .from("game_moves")
          .select("*")
          .eq("room_id", roomId)
          .order("move_number", { ascending: true });

        let s = createGameState(state.boardSize);
        if (moves) {
          for (const m of moves) {
            s = makeMove(s, m.row_idx, m.col_idx);
          }
        }
        setGameState(s);
        return;
      }

      // Check game over
      const newState = makeMove(state, row, col);
      if (newState.isGameOver) {
        await supabase
          .from("game_rooms")
          .update({ status: "finished", turn_deadline: null })
          .eq("id", roomId);
      } else {
        // Update deadline for next player's turn
        await supabase
          .from("game_rooms")
          .update({ turn_deadline: deadlineTime })
          .eq("id", roomId);
      }
    },
    [roomId, myPlayer]
  );

  // Handle timeout: current player loses
  const handleTimeout = useCallback(async () => {
    const state = gameStateRef.current;
    if (!state || state.isGameOver) return;
    if (!myPlayer) return;
    if (state.currentPlayer !== myPlayer) return;

    // Mark game as finished — opponent wins (loser is current player)
    const winner: Player = myPlayer === "X" ? "O" : "X";
    // We fake a "game over" locally
    setGameState((prev) => {
      if (!prev) return prev;
      return { ...prev, isGameOver: true, winner };
    });

    await supabase
      .from("game_rooms")
      .update({ status: "finished", turn_deadline: null })
      .eq("id", roomId);
  }, [roomId, myPlayer]);

  // Bug 1 fix: join room from game page (shared link flow)
  const handleJoin = useCallback(
    async (playerName: string): Promise<boolean> => {
      const { error } = await supabase
        .from("game_rooms")
        .update({
          player_o_name: playerName,
          player_o_id: playerId,
          status: "playing",
          turn_deadline: new Date(Date.now() + TURN_SECONDS * 1000).toISOString(),
        })
        .eq("id", roomId)
        .eq("status", "waiting");

      if (error) {
        console.error("Failed to join room:", error);
        return false;
      }

      setMyPlayer("O");
      return true;
    },
    [roomId]
  );

  // Rematch: set ready state
  const handleRematch = useCallback(async () => {
    if (!room || !myPlayer) return;

    if (myPlayer === 'X') {
      await supabase.from("game_rooms").update({ rematch_x_ready: true }).eq("id", roomId);
    } else {
      await supabase.from("game_rooms").update({ rematch_o_ready: true }).eq("id", roomId);
    }
  }, [roomId, room, myPlayer]);

  return {
    room,
    gameState,
    myPlayer,
    loading,
    error,
    handleCellClick,
    handleRematch,
    handleJoin,
    handleTimeout,
  };
}
