from datetime import datetime, timedelta, timezone

import pandas as pd
import pytest

from traderbot.indicators import add_indicators
from traderbot.models import Candle, RiskConfig, SimulationRequest, StrategyConfig
from traderbot.engine import run_backtest


def make_candles(count=180):
    rows = []
    start = datetime(2024, 1, 1, tzinfo=timezone.utc)
    price = 1.1
    for i in range(count):
        # Deterministic oscillating trend fixture for engine tests only.
        drift = 0.00015 if (i // 24) % 2 == 0 else -0.00012
        price += drift + (0.0003 if i % 7 < 3 else -0.0002)
        rows.append({
            "timestamp": start + timedelta(hours=i),
            "open": price,
            "high": price + 0.0005,
            "low": price - 0.0005,
            "close": price + (0.0001 if i % 2 else -0.0001),
            "volume": 100,
        })
    return rows


def test_indicators_are_finite_after_warmup():
    frame = pd.DataFrame(make_candles())
    result = add_indicators(frame)
    assert result["ema_fast"].iloc[-1] > 0
    assert 0 <= result["rsi"].iloc[-1] <= 100
    assert result["atr"].iloc[-1] > 0


def test_backtest_is_simulation_and_returns_risk_metrics():
    result = run_backtest(make_candles(), StrategyConfig(),
                          RiskConfig(starting_balance=10_000), "forex", "EURUSD", "1h")
    assert result["mode"] == "PAPER_SIMULATION_ONLY"
    assert result["starting_balance"] == 10_000
    assert result["max_drawdown_pct"] >= 0
    assert result["live_execution"] is False
    assert all(t["quantity"] > 0 for t in result["trades"])


def test_candle_rejects_invalid_ohlc():
    with pytest.raises(ValueError):
        Candle(timestamp=datetime.now(timezone.utc), open=10, high=9, low=8, close=10)


def test_request_rejects_duplicate_timestamps():
    t = datetime(2024, 1, 1, tzinfo=timezone.utc)
    candle = Candle(timestamp=t, open=10, high=11, low=9, close=10)
    with pytest.raises(ValueError):
        SimulationRequest(market="forex", symbol="EURUSD", candles=[candle] * 60)
