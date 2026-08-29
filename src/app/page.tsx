"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Dir,
  type Grid,
  addRandom,
  canMove,
  hasValue,
  isGrid,
  listPieces,
  move,
  newGame,
} from "@/lib/game";

const SAVE_KEY = "2048_save_v1";
const BEST_KEY = "2048_best_v1";
const SWIPE_MIN = 40;

const KEYS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right",
};

type Save = {
  grid: Grid;
  score: number;
  won: boolean;
  keepGoing: boolean;
};

function loadBest() {
  const raw = localStorage.getItem(BEST_KEY);
  const value = raw == null ? 0 : Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function loadSave(): Save | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Save>;
    if (!isGrid(data.grid)) return null;
    if (typeof data.score !== "number" || !Number.isFinite(data.score)) return null;
    return {
      grid: data.grid,
      score: data.score,
      won: Boolean(data.won),
      keepGoing: Boolean(data.keepGoing),
    };
  } catch {
    return null;
  }
}

export default function Home() {
  const [grid, setGrid] = useState<Grid | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const [over, setOver] = useState(false);
  const [spawnedId, setSpawnedId] = useState<number | null>(null);
  const [mergedIds, setMergedIds] = useState<number[]>([]);
  const [gained, setGained] = useState(0);
  const [canAnimate, setCanAnimate] = useState(false);
  const [help, setHelp] = useState(false);

  const swipeStart = useRef({ x: 0, y: 0, active: false });

  const gridRef = useRef<Grid | null>(null);
  const overRef = useRef(false);
  const wonRef = useRef(false);
  const keepGoingRef = useRef(false);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const helpRef = useRef(false);

  gridRef.current = grid;
  overRef.current = over;
  wonRef.current = won;
  keepGoingRef.current = keepGoing;
  scoreRef.current = score;
  bestRef.current = best;
  helpRef.current = help;

  useEffect(() => {
    const saved = loadSave();
    const bestScore = loadBest();
    setBest(bestScore);

    if (saved) {
      setGrid(saved.grid);
      setScore(saved.score);
      if (saved.score > bestScore) setBest(saved.score);
      setWon(saved.won);
      setKeepGoing(saved.keepGoing);
      setOver(!canMove(saved.grid));
    } else {
      setGrid(newGame());
    }

    requestAnimationFrame(() => setCanAnimate(true));
  }, []);

  useEffect(() => {
    if (!grid) return;
    localStorage.setItem(BEST_KEY, String(best));
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ grid, score, won, keepGoing } satisfies Save),
    );
  }, [grid, score, best, won, keepGoing]);

  function applyMove(dir: Dir) {
    if (helpRef.current) return;
    const current = gridRef.current;
    if (!current) return;
    if (overRef.current) return;
    if (wonRef.current && !keepGoingRef.current) return;

    const result = move(current, dir);
    if (!result.moved) return;

    const spawned = addRandom(result.grid);
    const next = spawned.grid;
    const nextScore = scoreRef.current + result.score;

    gridRef.current = next;
    scoreRef.current = nextScore;
    setGrid(next);
    setScore(nextScore);
    setSpawnedId(spawned.newId);
    setMergedIds(result.mergedIds);
    setGained(result.score);

    if (nextScore > bestRef.current) {
      bestRef.current = nextScore;
      setBest(nextScore);
    }
    if (hasValue(next, 2048) && !wonRef.current) {
      wonRef.current = true;
      setWon(true);
    }
    if (!canMove(next)) {
      overRef.current = true;
      setOver(true);
    }
  }

  function reset() {
    const fresh = newGame();
    gridRef.current = fresh;
    scoreRef.current = 0;
    overRef.current = false;
    wonRef.current = false;
    keepGoingRef.current = false;
    setCanAnimate(false);
    setGrid(fresh);
    setScore(0);
    setWon(false);
    setKeepGoing(false);
    setOver(false);
    setSpawnedId(null);
    setMergedIds([]);
    setGained(0);
    requestAnimationFrame(() => setCanAnimate(true));
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHelp(false);
        return;
      }
      if (helpRef.current) return;
      const dir = KEYS[event.key];
      if (!dir) return;
      event.preventDefault();
      applyMove(dir);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onPointerDown(event: React.PointerEvent) {
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    swipeStart.current = {
      x: event.clientX,
      y: event.clientY,
      active: true,
    };
  }

  function onPointerUp(event: React.PointerEvent) {
    if (!swipeStart.current.active) return;
    swipeStart.current.active = false;

    const dx = event.clientX - swipeStart.current.x;
    const dy = event.clientY - swipeStart.current.y;
    if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;

    if (Math.abs(dx) > Math.abs(dy)) applyMove(dx > 0 ? "right" : "left");
    else applyMove(dy > 0 ? "down" : "up");
  }

  const pieces = grid ? listPieces(grid) : [];
  const showWin = won && !keepGoing && !over;
  const showLose = over;

  return (
    <div className="page">
      <button type="button" className="howto-btn" onClick={() => setHelp(true)}>
        how to play
      </button>

      <main className="wrap">
        <header className="top">
          <h1>2048</h1>
          <button type="button" className="restart" onClick={reset} aria-label="Restart">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-2.6-6.3" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        </header>

        <div
          className={"board" + (canAnimate ? " anim" : "")}
          role="grid"
          aria-label="2048 board"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className="slot" />
          ))}

          {pieces.map((piece) => (
            <div
              key={piece.id}
              className={
                "tile t-" +
                piece.value +
                (piece.id === spawnedId ? " is-new" : "") +
                (mergedIds.includes(piece.id) ? " is-merge" : "")
              }
              style={
                {
                  "--r": piece.row,
                  "--c": piece.col,
                } as React.CSSProperties
              }
            >
              {piece.value}
            </div>
          ))}

          {(showWin || showLose) && (
            <div
              className="overlay"
              role="dialog"
              aria-label={showWin ? "You reached 2048" : "No more moves"}
            >
              <p>{showWin ? "you made 2048" : "no more moves"}</p>
              <div className="overlay-btns">
                {showWin && (
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => {
                      keepGoingRef.current = true;
                      setKeepGoing(true);
                    }}
                  >
                    keep going
                  </button>
                )}
                <button
                  type="button"
                  className="newgame"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={reset}
                >
                  try again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="scores">
          <div className="scorebox">
            <span>score</span>
            <strong>{score.toLocaleString("en-US")}</strong>
            {gained > 0 && (
              <em key={score} className="gain">
                +{gained.toLocaleString("en-US")}
              </em>
            )}
          </div>
          <div
            className={
              "scorebox is-best" +
              (best > 0 && score === best ? " is-tied" : "")
            }
          >
            <span>best score</span>
            <strong>{best.toLocaleString("en-US")}</strong>
          </div>
        </div>
      </main>

      {help && (
        <div
          className="help-scrim"
          onClick={() => setHelp(false)}
        >
          <div
            className="help-card"
            role="dialog"
            aria-labelledby="help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="help-top">
              <h2 id="help-title">how to play</h2>
              <button type="button" className="help-close" onClick={() => setHelp(false)}>
                close
              </button>
            </div>
            <p>
              Use the arrow keys, WASD, or swipe. Tiles slide until they hit
              something. Two with the same number merge into one, and that adds
              to your score. After every move a new 2 shows up, sometimes a 4.
              Reach 2048 to win. The game ends when the board is full and nothing
              can merge.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
