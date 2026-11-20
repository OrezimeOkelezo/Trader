from __future__ import annotations

import pandas as pd


def add_indicators(frame: pd.DataFrame, fast_ema: int = 12, slow_ema: int = 26,
                   rsi_period: int = 14, atr_period: int = 14) -> pd.DataFrame:
    """Return a copy with causal EMA, Wilder-style RSI and ATR columns."""
    data = frame.copy()
    close = data["close"].astype(float)
    high = data["high"].astype(float)
    low = data["low"].astype(float)

    data["ema_fast"] = close.ewm(span=fast_ema, adjust=False, min_periods=fast_ema).mean()
    data["ema_slow"] = close.ewm(span=slow_ema, adjust=False, min_periods=slow_ema).mean()

    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / rsi_period, adjust=False, min_periods=rsi_period).mean()
    avg_loss = loss.ewm(alpha=1 / rsi_period, adjust=False, min_periods=rsi_period).mean()
    relative_strength = avg_gain / avg_loss.replace(0, float("nan"))
    data["rsi"] = 100 - (100 / (1 + relative_strength))
    data.loc[(avg_loss == 0) & (avg_gain > 0), "rsi"] = 100
    data.loc[(avg_loss == 0) & (avg_gain == 0), "rsi"] = 50

    previous_close = close.shift(1)
    true_range = pd.concat(
        [(high - low), (high - previous_close).abs(), (low - previous_close).abs()],
        axis=1,
    ).max(axis=1)
    data["atr"] = true_range.ewm(alpha=1 / atr_period, adjust=False,
                                  min_periods=atr_period).mean()
    return data
