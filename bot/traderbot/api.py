from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .engine import run_backtest
from .models import SimulationRequest

app = FastAPI(
    title="Trader Paper Engine",
    version="0.1.0",
    description="Educational forex and cryptocurrency backtesting and paper simulation. No broker connection or live order execution.",
)


allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "TRADER_ALLOWED_ORIGINS",
        "http://localhost:8000,http://127.0.0.1:8000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health():
    return {"status": "ok", "mode": "paper_only", "live_execution": False}


@app.get("/markets")
def markets():
    return {
        "forex": ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD"],
        "crypto": ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", "ADA/USDT"],
        "timeframes": ["5m", "15m", "30m", "1h", "4h", "1d", "1w"],
        "data_note": "Supply historical OHLCV candles from a CSV export or trusted market-data provider. No live feed is bundled.",
    }


@app.post("/backtest")
def backtest(request: SimulationRequest):
    try:
        return run_backtest(
            [c.model_dump() for c in request.candles],
            request.strategy,
            request.risk,
            request.market,
            request.symbol,
            request.timeframe,
        )
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/paper/replay")
def paper_replay(request: SimulationRequest):
    """Replay supplied historical candles in a simulated account; nothing is sent externally."""
    result = backtest(request)
    result["mode"] = "PAPER_REPLAY_ONLY"
    result["live_execution"] = False
    return result
