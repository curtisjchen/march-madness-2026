#!/bin/bash
# ── March Madness Bracket App Launcher ─────────────────────────────────────

echo "🏀 Starting March Madness Bracket App..."

# 1. Backend
cd "$(dirname "$0")/backend"
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "✅ Backend running at http://localhost:8000 (PID $BACKEND_PID)"

# 2. Frontend
cd ../frontend
npm install --silent
npm start &
FRONTEND_PID=$!
echo "✅ Frontend starting at http://localhost:3000 (PID $FRONTEND_PID)"

echo ""
echo "  Open http://localhost:3000 in your browser"
echo "  Press Ctrl+C to stop both servers"

wait
