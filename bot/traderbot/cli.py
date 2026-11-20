from __future__ import annotations

import argparse
import json

from .csv_data import load_ohlcv_csv
from .engine import run_backtest
from .models import RiskConfig, StrategyConfig


def main():
    parser = argparse.ArgumentParser(description="Run Trader's educational paper backtest.")
    parser.add_argument("--csv", required=True, help="OHLCV CSV exported from MT4/MT5 or a market-data provider")
    parser.add_argument("--market", choices=["forex", "crypto"], required=True)
    parser.add_argument("--symbol", required=True, help="Example: EURUSD or BTC/USDT")
    parser.add_argument("--timeframe", default="1h")
    parser.add_argument("--balance", type=float, default=10_000)
    args = parser.parse_args()
    candles = load_ohlcv_csv(args.csv)
    result = run_backtest(candles, StrategyConfig(), RiskConfig(starting_balance=args.balance),
                          args.market, args.symbol, args.timeframe)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
