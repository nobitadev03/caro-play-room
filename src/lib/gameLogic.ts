export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type Board = CellValue[][];

export interface Move {
  row: number;
  col: number;
  player: Player;
  moveNumber: number;
}

export interface Room {
  id: string;
  name: string;
  hasPassword: boolean;
  players: number;
  boardSize: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  moves: Move[];
  winner: Player | null;
  winningCells: [number, number][];
  boardSize: number;
  isGameOver: boolean;
}

export function createBoard(size: number): Board {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function createGameState(boardSize: number = 15): GameState {
  return {
    board: createBoard(boardSize),
    currentPlayer: 'X',
    moves: [],
    winner: null,
    winningCells: [],
    boardSize,
    isGameOver: false,
  };
}

const DIRECTIONS = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal
  [1, -1],  // anti-diagonal
];

export function checkWin(board: Board, row: number, col: number, player: Player): [number, number][] | null {
  const size = board.length;

  for (const [dr, dc] of DIRECTIONS) {
    const cells: [number, number][] = [[row, col]];

    // Forward
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
        cells.push([r, c]);
      } else break;
    }

    // Backward
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
        cells.push([r, c]);
      } else break;
    }

    if (cells.length >= 5) {
      // Sort cells by row then col so we can easily draw a line from first to last
      cells.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
      return cells;
    }
  }

  return null;
}

export function makeMove(state: GameState, row: number, col: number): GameState {
  if (state.board[row][col] !== null || state.isGameOver) return state;

  const newBoard = state.board.map(r => [...r]);
  newBoard[row][col] = state.currentPlayer;

  const newMove: Move = {
    row,
    col,
    player: state.currentPlayer,
    moveNumber: state.moves.length + 1,
  };

  const winCells = checkWin(newBoard, row, col, state.currentPlayer);

  return {
    ...state,
    board: newBoard,
    moves: [...state.moves, newMove],
    currentPlayer: winCells ? state.currentPlayer : (state.currentPlayer === 'X' ? 'O' : 'X'),
    winner: winCells ? state.currentPlayer : null,
    winningCells: winCells || [],
    isGameOver: !!winCells,
  };
}

export function getColLabel(col: number): string {
  return String.fromCharCode(65 + col);
}

export function getRowLabel(row: number): string {
  return String(row + 1);
}
