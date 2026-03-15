import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createGameState, makeMove, type GameState, type Player } from "@/lib/gameLogic";

// Generate a unique player ID per browser session
function getPlayerId(): string {
  let id = sessionStorage.getItem("caro_player_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("caro_player_id", id);
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

      // Fetch room
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

        // Determine my role
        if (roomData.player_x_id === playerId) {
          setMyPlayer("X");
        } else if (roomData.player_o_id === playerId) {
          setMyPlayer("O");
        } else {
          setMyPlayer(null); // spectator or needs to join
        }

        // Fetch existing moves
        const { data: moves } = await supabase
          .from("game_moves")
          .select("*")
          .eq("room_id", roomId)
          .order("move_number", { ascending: true });

        // Reconstruct game state
        let state = createGameState(roomData.board_size);
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

  // Subscribe to room changes
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
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_moves", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const move = payload.new as { row_idx: number; col_idx: number; player: string; move_number: number };
          setGameState((prev) => {
            if (!prev) return prev;
            // Don't re-apply if we already have this move
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

      // Persist to DB
      const { error } = await supabase.from("game_moves").insert({
        room_id: roomId,
        row_idx: row,
        col_idx: col,
        player: myPlayer,
        move_number: moveNumber,
      });

      if (error) {
        console.error("Failed to save move:", error);
        // Rollback - reload state
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

      // Check if game over after this move
      const newState = makeMove(state, row, col);
      if (newState.isGameOver) {
        await supabase
          .from("game_rooms")
          .update({ status: "finished" })
          .eq("id", roomId);
      }
    },
    [roomId, myPlayer]
  );

  // Rematch: clear moves, reset room status
  const handleRematch = useCallback(async () => {
    if (!room) return;

    // Delete all moves
    await supabase.from("game_moves").delete().eq("room_id", roomId);

    // Reset room status
    await supabase
      .from("game_rooms")
      .update({ status: "playing" })
      .eq("id", roomId);

    setGameState(createGameState(room.board_size));
  }, [roomId, room]);

  return {
    room,
    gameState,
    myPlayer,
    loading,
    error,
    handleCellClick,
    handleRematch,
  };
}
