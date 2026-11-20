from __future__ import annotations

import pandas as pd

REQUIRED_COLUMNS = {"timestamp", "open", "high", "low", "close"}


def load_ohlcv_csv(path: str) -> list[dict]:
    """Load standard MT4/MT5-exported or provider OHLCV CSV candles."""
    frame = pd.read_csv(path)
    frame.columns = [str(c).strip().lower() for c in frame.columns]
    missing = REQUIRED_COLUMNS - set(frame.columns)
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")
    if "volume" not in frame:
        frame["volume"] = 0
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True, errors="raise")
    for column in ("open", "high", "low", "close", "volume"):
        frame[column] = pd.to_numeric(frame[column], errors="raise")
    frame = frame.sort_values("timestamp").drop_duplicates("timestamp", keep="last")
    if len(frame) < 60:
        raise ValueError("At least 60 candles are required for a meaningful indicator warm-up.")
    if (frame[["open", "high", "low", "close"]] <= 0).any().any():
        raise ValueError("OHLC prices must be positive.")
    if (frame["high"] < frame[["open", "low", "close"]].max(axis=1)).any():
        raise ValueError("CSV contains invalid candle highs.")
    if (frame["low"] > frame[["open", "high", "close"]].min(axis=1)).any():
        raise ValueError("CSV contains invalid candle lows.")
    return frame.to_dict(orient="records")
