# 2048

Same rules as the original. Different look.

Next.js + React. Game logic is in `src/lib/game.ts`. The UI is in `src/app/page.tsx`.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Play

Arrow keys, WASD, or swipe. Matching tiles merge. A 2 (sometimes a 4) appears after every real move.

The current game and best score are saved in localStorage.

## How movement works

Only slide-left is implemented. Up, down, and right rotate or flip the grid first, then use that same function.

A tile can only merge once per move, so `[2, 2, 2, 2]` becomes two 4s, not one 8.

## Deploy

This is a Next.js app, so Vercel is the straightforward host.