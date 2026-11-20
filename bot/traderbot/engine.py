from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import pandas as pd

from .indicators import add_indicators
from .models import RiskConfig, StrategyConfig
from .strategy import apply_strategy


@dataclass
class Position:
    side: int
    quantity: float
    entry_price: float
    stop_price: float
    target_price: float
    entry_time: str
    entry_fee: float


def _round(value: float) -> float:
    return round(float(value), 8)


def run_backtest(candles: list[dict[str, Any]], strategy: StrategyConfig,
                 risk: RiskConfig, market: str, symbol: str,
                 timeframe: str) -> dict[str, Any]:
    """Candle-close signals fill at the following candle open; conservative stop-first ties."""
    frame = pd.DataFrame(candles)
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True)
    frame = frame.sort_values("timestamp").reset_index(drop=True)
    frame = add_indicators(frame, strategy.fast_ema, strategy.slow_ema,
                           strategy.rsi_period, strategy.atr_period)
    frame = apply_strategy(frame, strategy)

    cash = float(risk.starting_balance)
    peak_equity = cash
    max_drawdown = 0.0
    position: Position | None = None
    trades: list[dict[str, Any]] = []
    equity_curve: list[dict[str, Any]] = []
    day_start_equity = cash
    active_day = None
    halted_for_day = False
    halted_for_drawdown = False
    slippage = risk.slippage_bps / 10_000
    fee_rate = risk.fee_rate
    warmup = max(strategy.slow_ema, strategy.rsi_period, strategy.atr_period) + 2

    def close_position(exit_price: float, exit_time: str, reason: str):
        nonlocal cash, position
        if position is None:
            return
        fill = exit_price * (1 - slippage * position.side)
        gross = (fill - position.entry_price) * position.quantity * position.side
        exit_fee = abs(fill * position.quantity) * fee_rate
        net = gross - exit_fee - position.entry_fee
        cash += gross - exit_fee
        trades.append({
            "side": "LONG" if position.side == 1 else "SHORT",
            "entry_time": position.entry_time,
            "exit_time": exit_time,
            "entry_price": _round(position.entry_price),
            "exit_price": _round(fill),
            "quantity": _round(position.quantity),
            "gross_pnl": _round(gross),
            "fees": _round(position.entry_fee + exit_fee),
            "net_pnl": _round(net),
            "exit_reason": reason,
        })
        position = None

    for index in range(warmup, len(frame)):
        row = frame.iloc[index]
        previous = frame.iloc[index - 1]
        stamp = row["timestamp"]
        day = stamp.date()
        if active_day != day:
            active_day = day
            day_start_equity = cash
            halted_for_day = False

        open_price = float(row["open"])
        high = float(row["high"])
        low = float(row["low"])
        close = float(row["close"])
        signal = int(previous["entry_signal"]) if pd.notna(previous["entry_signal"]) else 0
        stamp_text = stamp.isoformat()

        # Apply a signal generated on the previous, fully closed candle at this candle's open.
        if position is not None and signal == -position.side:
            close_position(open_price, stamp_text, "opposite_signal")

        if position is not None:
            stop_hit = low <= position.stop_price if position.side == 1 else high >= position.stop_price
            target_hit = high >= position.target_price if position.side == 1 else low <= position.target_price
            if stop_hit:
                # If both levels are inside one candle, assume the adverse stop happened first.
                gap_price = min(open_price, position.stop_price) if position.side == 1 else max(open_price, position.stop_price)
                close_position(gap_price, stamp_text, "stop_loss")
            elif target_hit:
                gap_price = max(open_price, position.target_price) if position.side == 1 else min(open_price, position.target_price)
                close_position(gap_price, stamp_text, "take_profit")

        current_equity = cash + (
            (close - position.entry_price) * position.quantity * position.side
            if position is not None else 0
        )
        peak_equity = max(peak_equity, current_equity)
        drawdown = (peak_equity - current_equity) / peak_equity * 100 if peak_equity else 0
        max_drawdown = max(max_drawdown, drawdown)
        if drawdown >= risk.max_drawdown_pct:
            halted_for_drawdown = True
        if current_equity <= day_start_equity * (1 - risk.daily_loss_limit_pct / 100):
            halted_for_day = True

        if position is None and signal != 0 and not halted_for_day and not halted_for_drawdown:
            atr = float(previous["atr"]) if pd.notna(previous["atr"]) else 0
            if atr > 0 and open_price > 0:
                stop_distance = atr * strategy.stop_atr_multiple
                risk_cash = cash * risk.risk_per_trade_pct / 100
                quantity_by_risk = risk_cash / stop_distance
                quantity_by_cap = cash * risk.max_leverage / open_price
                quantity = min(quantity_by_risk, quantity_by_cap)
                if quantity > 0:
                    side = signal
                    entry = open_price * (1 + slippage * side)
                    stop = entry - side * stop_distance
                    target = entry + side * atr * strategy.target_atr_multiple
                    entry_fee = abs(entry * quantity) * fee_rate
                    cash -= entry_fee
                    position = Position(side, quantity, entry, stop, target,
                                        stamp_text, entry_fee)

        marked_equity = cash
        if position is not None:
            marked_equity += (close - position.entry_price) * position.quantity * position.side
        equity_curve.append({"timestamp": stamp_text, "equity": _round(marked_equity)})

    if position is not None and len(frame):
        last = frame.iloc[-1]
        close_position(float(last["close"]), last["timestamp"].isoformat(), "end_of_data")
        if equity_curve:
            equity_curve[-1]["equity"] = _round(cash)

    net_profit = cash - risk.starting_balance
    wins = sum(1 for t in trades if t["net_pnl"] > 0)
    losses = sum(1 for t in trades if t["net_pnl"] <= 0)
    gross_profit = sum(max(0, t["net_pnl"]) for t in trades)
    gross_loss = abs(sum(min(0, t["net_pnl"]) for t in trades))
    return {
        "mode": "PAPER_SIMULATION_ONLY",
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "strategy": "EMA crossover with RSI regime filter",
        "starting_balance": _round(risk.starting_balance),
        "ending_balance": _round(cash),
        "net_profit": _round(net_profit),
        "net_return_pct": _round(net_profit / risk.starting_balance * 100),
        "trade_count": len(trades),
        "wins": wins,
        "losses": losses,
        "win_rate_pct": _round(wins / len(trades) * 100 if trades else 0),
        "profit_factor": _round(gross_profit / gross_loss if gross_loss else (gross_profit if gross_profit else 0)),
        "max_drawdown_pct": _round(max_drawdown),
        "risk_controls": {
            "risk_per_trade_pct": risk.risk_per_trade_pct,
            "daily_loss_limit_pct": risk.daily_loss_limit_pct,
            "max_drawdown_pct": risk.max_drawdown_pct,
            "max_leverage": risk.max_leverage,
        },
        "trades": trades,
        "equity_curve": equity_curve,
        "disclaimer": "Historical simulation only. Fees and slippage are estimates. Results are not predictions and do not represent a live account.",
    }
