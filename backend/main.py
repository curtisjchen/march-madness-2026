from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json, os

app = FastAPI(title="March Madness Bracket API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "bracket_data.json")
with open(DATA_PATH) as f:
    DATA = json.load(f)

PREDICTIONS = DATA["predictions"]
TEAMS = DATA["teams"]
SEED_TO_ID = DATA["seedToId"]


def get_pred(t1: int, t2: int) -> float:
    """Return P(t1 beats t2). Lookup is always stored as min_max."""
    a, b = min(t1, t2), max(t1, t2)
    p = PREDICTIONS.get(f"{a}_{b}", 0.5)
    return p if t1 == a else 1.0 - p


@app.get("/api/bracket-data")
def bracket_data():
    """Return all teams, seed mapping, and play-in structure."""
    # Identify play-in seeds
    playin_seeds: dict[str, list[int]] = {}
    for seed, tid in SEED_TO_ID.items():
        if len(seed) > 3:
            base = seed[:3]  # e.g. 'Y11'
            playin_seeds.setdefault(base, []).append(tid)

    return {
        "teams": TEAMS,
        "seedToId": SEED_TO_ID,
        "playinSeeds": playin_seeds,
    }


@app.get("/api/prediction")
def prediction(t1: int, t2: int):
    """Return win probability for t1 beating t2."""
    return {"t1": t1, "t2": t2, "prob": round(get_pred(t1, t2), 4)}


@app.post("/api/predictions/batch")
def predictions_batch(matchups: list[dict]):
    """
    Body: [{"t1": 1181, "t2": 1373}, ...]
    Returns list of {t1, t2, prob} where prob = P(t1 wins).
    """
    results = []
    for m in matchups:
        t1, t2 = int(m["t1"]), int(m["t2"])
        results.append({"t1": t1, "t2": t2, "prob": round(get_pred(t1, t2), 4)})
    return results
