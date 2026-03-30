"""
Run this from anywhere:
    python generate_team_stats.py

Point INPUT_CSV to your full features CSV.
OUTPUT goes into frontend/public/ so the React app can fetch it.
"""

import pandas as pd
import json
from pathlib import Path

INPUT_CSV  = "submission_mens_2026_features.csv"   # ← change to your actual filename
OUTPUT_JSON = "frontend/public/team_stats.json"

# 2026 tournament team IDs (68 teams)
TOURNEY_IDS = {
    1181,1163,1277,1242,1385,1257,1417,1326,1395,1416,1378,1320,1465,1295,1202,1373,  # East
    1196,1222,1228,1304,1435,1314,1388,1155,1234,1401,1433,1270,1407,1335,1225,1250,1341,  # South
    1276,1235,1438,1104,1403,1397,1246,1208,1387,1365,1275,1374,1103,1220,1460,1398,1224,1420,  # Midwest
    1112,1345,1211,1116,1458,1140,1274,1437,1429,1281,1301,1400,1219,1218,1244,1474,1254,  # West
}

print(f"Reading {INPUT_CSV}...")
df = pd.read_csv(INPUT_CSV)

# Filter to 2026 tourney teams only
df = df[df["Season"] == 2026].copy()
df = df[df["TeamA"].isin(TOURNEY_IDS) & df["TeamB"].isin(TOURNEY_IDS)]
print(f"Filtered rows: {len(df)}")

# ── Per-team absolute stats ────────────────────────────────────────────────
# EloA/B and MasseyMedianA/B are stored as absolutes — grab them when team is TeamA
team_stats = {}

for _, row in df.iterrows():
    tA, tB = int(row["TeamA"]), int(row["TeamB"])

    if tA not in team_stats:
        team_stats[tA] = {
            "elo":         round(float(row["EloA"]), 1),
            "massey":      round(float(row["MasseyMedianA"]), 1),
        }
        # Season absolute stats — derived from: A_stat = Diff/2 + (A+B)/2
        # But we only have diffs, so store what we can directly
        # Season win rate: not stored absolute, skip for now

    if tB not in team_stats:
        team_stats[tB] = {
            "elo":    round(float(row["EloB"]), 1),
            "massey": round(float(row["MasseyMedianB"]), 1),
        }

# ── Per-matchup diffs ─────────────────────────────────────────────────────
# Key: "min_max" (same convention as predictions)
# Value: dict of all diff columns, from perspective of the LOWER id team

DIFF_COLS = [
    "SeedDiff",
    "EloDiff",
    "MasseyMedianDiff",
    "Season_WinRate_Diff",
    "Season_AvgMargin_Diff",
    "Season_AvgOffEff_Diff",
    "Season_AvgDefEff_Diff",
    "Season_EffMargin_Diff",
    "Season_AvgPace_Diff",
    "Last10_WinRate_Diff",
    "Last10_AvgMargin_Diff",
    "Last10_AvgOffEff_Diff",
    "Last10_AvgDefEff_Diff",
    "Last10_EffMargin_Diff",
    "Trend_EffMargin_Diff",
    "Trend_WinRate_Diff",
    "SOS_Season_AvgOppElo_Diff",
    "SOS_Season_AvgOppEffMargin_Diff",
    "SOS_Season_AvgOppWinRate_Diff",
    "Coach_TourneyApps_Diff",
    "Coach_TourneyWins_Diff",
    "Coach_TourneyWinRate_Diff",
    "Season_EFG_Diff",
    "Season_EFGD_Diff",
    "Season_TOR_Diff",
    "Season_TORD_Diff",
    "Season_ORB_Diff",
    "Season_FTR_Diff",
    "Season_FTRD_Diff",
    "Season_3PR_Diff",
    "Season_3P_Diff",
    "Last10_EFG_Diff",
    "Last10_EFGD_Diff",
    "Last10_TOR_Diff",
    "Last10_TORD_Diff",
    "Last10_ORB_Diff",
    "Last10_3PR_Diff",
    "Last10_3P_Diff",
]

# Only include columns that actually exist in this CSV
available = [c for c in DIFF_COLS if c in df.columns]
print(f"Available diff columns: {len(available)}/{len(DIFF_COLS)}")

matchup_diffs = {}
for _, row in df.iterrows():
    tA, tB = int(row["TeamA"]), int(row["TeamB"])
    lo, hi = min(tA, tB), max(tA, tB)
    key = f"{lo}_{hi}"
    if key in matchup_diffs:
        continue
    sign = 1 if tA == lo else -1   # flip diffs so they're always lo-team perspective
    diffs = {}
    for col in available:
        val = row.get(col)
        if pd.notna(val):
            diffs[col] = round(float(val) * sign, 4)
    matchup_diffs[key] = diffs

print(f"Matchup diffs computed: {len(matchup_diffs)}")

# ── Write output ──────────────────────────────────────────────────────────
output = {
    "teamStats": {str(k): v for k, v in team_stats.items()},
    "matchupDiffs": matchup_diffs,
}

Path(OUTPUT_JSON).parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_JSON, "w") as f:
    json.dump(output, f)

size_kb = Path(OUTPUT_JSON).stat().st_size // 1024
print(f"\n✅ Written to {OUTPUT_JSON}  ({size_kb} KB)")
print(f"   Teams with stats: {len(team_stats)}")
print(f"   Matchup diffs:    {len(matchup_diffs)}")

# Quick sanity check
sample_id = 1181  # Duke
if sample_id in team_stats:
    print(f"\n   Duke ELO: {team_stats[sample_id]['elo']}, Massey: {team_stats[sample_id]['massey']}")
