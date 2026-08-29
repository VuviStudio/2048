export const SIZE = 4;

export type Dir = "up" | "down" | "left" | "right";

export type Piece = {
  id: number;
  value: number;
};

export type Grid = (Piece | null)[][];

export function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array<Piece | null>(SIZE).fill(null));
}

function copyGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function maxId(grid: Grid) {
  let max = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell && cell.id > max) max = cell.id;
    }
  }
  return max;
}

export function addRandom(grid: Grid) {
  const open: { row: number; col: number }[] = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!grid[row][col]) open.push({ row, col });
    }
  }

  if (open.length === 0) return { grid, newId: null as number | null };

  const spot = open[Math.floor(Math.random() * open.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newId = maxId(grid) + 1;
  const next = copyGrid(grid);
  next[spot.row][spot.col] = { id: newId, value };
  return { grid: next, newId };
}

export function newGame(): Grid {
  let grid = emptyGrid();
  grid = addRandom(grid).grid;
  grid = addRandom(grid).grid;
  return grid;
}

function sameCell(a: Piece | null, b: Piece | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.value === b.value;
}

function slideLeft(line: (Piece | null)[]) {
  const packed = line.filter((cell): cell is Piece => cell !== null);
  const next: (Piece | null)[] = [];
  const mergedIds: number[] = [];
  let score = 0;

  for (let i = 0; i < packed.length; i++) {
    const current = packed[i];
    const following = packed[i + 1];
    if (following && current.value === following.value) {
      const value = current.value * 2;
      next.push({ id: current.id, value });
      mergedIds.push(current.id);
      score += value;
      i += 1;
    } else {
      next.push(current);
    }
  }

  while (next.length < SIZE) next.push(null);

  const changed = next.some((cell, i) => !sameCell(cell, line[i]));
  return { line: next, score, mergedIds, changed };
}

function rotateCW(grid: Grid): Grid {
  const next = emptyGrid();
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      next[col][SIZE - 1 - row] = grid[row][col];
    }
  }
  return next;
}

function rotate(grid: Grid, times: number) {
  let next = grid;
  for (let i = 0; i < times; i++) next = rotateCW(next);
  return next;
}

function reverseRows(grid: Grid): Grid {
  return grid.map((row) => row.slice().reverse());
}

export function move(grid: Grid, dir: Dir) {
  let work = copyGrid(grid);

  if (dir === "up") work = rotate(work, 3);
  if (dir === "down") work = rotate(work, 1);
  if (dir === "right") work = reverseRows(work);

  let score = 0;
  const mergedIds: number[] = [];
  let moved = false;

  work = work.map((row) => {
    const result = slideLeft(row);
    score += result.score;
    mergedIds.push(...result.mergedIds);
    if (result.changed) moved = true;
    return result.line;
  });

  if (dir === "right") work = reverseRows(work);
  if (dir === "up") work = rotate(work, 1);
  if (dir === "down") work = rotate(work, 3);

  return { grid: work, score, moved, mergedIds };
}

export function hasValue(grid: Grid, value: number) {
  return grid.some((row) => row.some((cell) => cell?.value === value));
}

export function canMove(grid: Grid) {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const cell = grid[row][col];
      if (!cell) return true;
      if (col + 1 < SIZE && grid[row][col + 1]?.value === cell.value) return true;
      if (row + 1 < SIZE && grid[row + 1][col]?.value === cell.value) return true;
    }
  }
  return false;
}

export function listPieces(grid: Grid) {
  const pieces: { id: number; value: number; row: number; col: number }[] = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const cell = grid[row][col];
      if (cell) pieces.push({ id: cell.id, value: cell.value, row, col });
    }
  }
  return pieces;
}

export function isGrid(value: unknown): value is Grid {
  if (!Array.isArray(value) || value.length !== SIZE) return false;

  for (const row of value) {
    if (!Array.isArray(row) || row.length !== SIZE) return false;
    for (const cell of row) {
      if (cell === null) continue;
      if (
        typeof cell !== "object" ||
        cell === null ||
        typeof (cell as Piece).id !== "number" ||
        typeof (cell as Piece).value !== "number"
      ) {
        return false;
      }
    }
  }

  return true;
}