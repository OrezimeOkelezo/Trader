from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Candle(BaseModel):
    model_config = ConfigDict(extra="forbid")
    timestamp: datetime
    open: float = Field(gt=0)
    high: float = Field(gt=0)
    low: float = Field(gt=0)
    close: float = Field(gt=0)
    volume: float = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_ohlc(self):
        if self.high < max(self.open, self.close, self.low):
            raise ValueError("high must be the highest OHLC value")
        if self.low > min(self.open, self.close, self.high):
            raise ValueError("low must be the lowest OHLC value")
        return self


class StrategyConfig(BaseModel):
    fast_ema: int = Field(default=12, ge=2, le=100)
    slow_ema: int = Field(default=26, ge=3, le=300)
    rsi_period: int = Field(default=14, ge=2, le=100)
    atr_period: int = Field(default=14, ge=2, le=100)
    rsi_long_threshold: float = Field(default=52, ge=1, le=99)
    rsi_short_threshold: float = Field(default=48, ge=1, le=99)
    stop_atr_multiple: float = Field(default=2.0, gt=0, le=10)
    target_atr_multiple: float = Field(default=3.0, gt=0, le=20)

    @model_validator(mode="after")
    def validate_periods(self):
        if self.fast_ema >= self.slow_ema:
            raise ValueError("fast_ema must be smaller than slow_ema")
        if self.rsi_short_threshold >= self.rsi_long_threshold:
            raise ValueError("short RSI threshold must be below long RSI threshold")
        return self


class RiskConfig(BaseModel):
    starting_balance: float = Field(default=10_000, gt=0)
    risk_per_trade_pct: float = Field(default=0.5, gt=0, le=2)
    daily_loss_limit_pct: float = Field(default=2, gt=0, le=10)
    max_drawdown_pct: float = Field(default=10, gt=0, le=50)
    fee_rate: float = Field(default=0.0002, ge=0, le=0.02)
    slippage_bps: float = Field(default=2, ge=0, le=100)
    max_leverage: float = Field(default=1.0, ge=0.1, le=1.0)


class SimulationRequest(BaseModel):
    market: Literal["forex", "crypto"]
    symbol: str = Field(min_length=3, max_length=24, pattern=r"^[A-Za-z0-9_./:-]+$")
    timeframe: str = Field(default="1h", min_length=1, max_length=8)
    candles: list[Candle] = Field(min_length=60, max_length=100_000)
    strategy: StrategyConfig = Field(default_factory=StrategyConfig)
    risk: RiskConfig = Field(default_factory=RiskConfig)

    @model_validator(mode="after")
    def validate_candles(self):
        stamps = [c.timestamp for c in self.candles]
        if stamps != sorted(stamps) or len(set(stamps)) != len(stamps):
            raise ValueError("candles must be strictly chronological with no duplicate timestamps")
        return self
