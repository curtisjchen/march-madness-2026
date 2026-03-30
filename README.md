# 2026 March Madness Bracket Visualizer

Interactive bracket app built with FastAPI + React, powered by your ML model predictions.

## Project Structure

```
march-madness/
├── start.sh                   # One-command launcher
├── backend/
│   ├── main.py                # FastAPI server (prediction lookups)
│   ├── requirements.txt
│   └── data/
│       └── bracket_data.json  # Teams, seeds, and all ~2,278 predictions
└── frontend/
    ├── package.json
    ├── public/
│   │   ├── index.html
    │   └── bracket_data.json  # Static copy (app works without backend)
    └── src/
        ├── index.js / index.css
        ├── App.js             # Main layout + play-in modal + header
        ├── hooks/
        │   └── useBracket.js  # All bracket state + advance/reset/auto logic
        └── components/
            ├── RegionBracket.js  # One region: R64 → R32 → S16 → E8
            ├── FinalFour.js      # Center piece: semis + championship
            ├── Matchup.js        # Two-team game slot pair
            ├── TeamSlot.js       # Individual team button + hover trigger
            └── TeamCard.js       # Baseball card popup on hover
```

## Quick Start

```bash
chmod +x start.sh
./start.sh
```

Then open **http://localhost:3000**

Or run separately:

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm start
```

## How It Works

**Data:** `bracket_data.json` contains all 68 teams (seeds, coach names, region) and ~2,278 precomputed win probabilities for every possible tourney matchup pair. Lookup is instant: `predictions[min(t1,t2)_max(t1,t2)]`.

**Predictions on the fly:** No precomputed round odds. When Michigan is clicked to advance, the UI just looks up `getPred(Michigan, opponent)` for whatever matchup arises. Championship path probability = product of win probs along each clicked path.

**Play-in games:** 4 games (South 16, Midwest 11, Midwest 16, West 11). Click "PLAY-IN GAMES" in header to set winners before filling the bracket.

## Features

| Feature | How |
|---|---|
| Hover any team | Shows baseball card: coach, seed, region, win % vs current opponent |
| Click a team | Advances them to the next round |
| Click again (if already advanced) | De-advances (cascades downstream clears) |
| ⚡ Auto-Advance Model | Fills entire bracket with model's highest probability pick |
| Play-In Games | Modal to set First Four winners |
| Reset | Clears all picks |

## Prediction Model

Features used in training (1985–2025 historical matchups):
- Seed, ELO, Massey Ordinal (median/mean/min/max)
- Season stats: win rate, avg margin, off/def efficiency, pace
- Last 10 game trend: win rate, margin, efficiency, pace
- SOS (strength of schedule): avg opp ELO, efficiency, win rate
- Coach tournament history: apps, wins, win rate
- Four Factors: eFG%, TOR, ORB, FTR
- Three-point metrics: 3PR, 3P%

## Regions (2026)

| Code | Name | #1 Seed |
|---|---|---|
| W | East | Duke |
| X | South | Florida |
| Y | Midwest | Michigan |
| Z | West | Arizona |
