from __future__ import annotations

import pandas as pd

from .models import StrategyConfig


def apply_strategy(frame: pd.DataFrame, config: StrategyConfig) -> pd.DataFrame:
    """EMA cross + RSI regime filter. Signals are known only at candle close."""
    data = frame.copy()
    bullish_cross = (data["ema_fast"] > data["ema_slow"]) & (
        data["ema_fast"].shift(1) <= data["ema_slow"].shift(1)
    )
    bearish_cross = (data["ema_fast"] < data["ema_slow"]) & (
        data["ema_fast"].shift(1) >= data["ema_slow"].shift(1)
    )
    data["entry_signal"] = 0
    data.loc[bullish_cross & (data["rsi"] >= config.rsi_long_threshold), "entry_signal"] = 1
    data.loc[bearish_cross & (data["rsi"] <= config.rsi_short_threshold), "entry_signal"] = -1
    return data
