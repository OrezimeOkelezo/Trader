# Trader Bot Engine: Forex + Crypto Paper Simulation

This is a new, independent educational engine for the Trader project. It uses ideas from the user's saved repositories as architectural references, but the implementation in this folder is original. It is not a copied or embedded Freqtrade, EA31337, or Superalgos distribution.

## Safety boundary

- Paper simulation and historical backtesting only.
- No exchange SDK, broker terminal connection, API credentials, order-routing code, or live execution endpoint is included.
- No real-money trading is supported by this engine.
- Outputs are educational simulations, not investment advice or predictions.

## Architecture

- `traderbot/indicators.py`: causal EMA, RSI and ATR calculations.
- `traderbot/strategy.py`: EMA crossover with an RSI regime filter.
- `traderbot/engine.py`: next-candle-open fills, estimated fees and slippage, ATR stop/target, capped position sizing, daily loss and maximum drawdown guardrails.
- `traderbot/csv_data.py`: validates and loads OHLCV CSV exports.
- `traderbot/api.py`: FastAPI endpoints for health, supported markets, backtests and paper replay.
- `traderbot/cli.py`: local command-line backtesting.
- `tests/`: deterministic unit tests. Test candles are synthetic and are never presented as market data.

## Install

Python 3.11 or newer:

```bash
cd bot
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
```

## Start the local API

```bash
uvicorn traderbot.api:app --reload
```

Open `http://127.0.0.1:8000/docs` for the interactive API documentation. `GET /health` confirms the paper-only mode. `GET /markets` lists supported symbol examples.

## Run a historical CSV backtest

Export candles from MT4/MT5 History Center or your broker's demo terminal, or download historical crypto OHLCV from a data provider. Use a CSV with these headers:

```csv
timestamp,open,high,low,close,volume
2025-01-01T00:00:00Z,1.0350,1.0360,1.0340,1.0355,120
```

The sample row above illustrates the file format only; it is not a real quote.

```bash
python -m traderbot.cli --csv ./data/EURUSD_H1.csv --market forex --symbol EURUSD --timeframe 1h
python -m traderbot.cli --csv ./data/BTCUSDT_1h.csv --market crypto --symbol BTC/USDT --timeframe 1h
```

## Strategy and simulation assumptions

The starter strategy studies a fast/slow EMA crossover with RSI confirmation. It is a deliberately simple baseline, not a claim of profitability. Signals are calculated only from completed candles and filled at the next candle open to reduce look-ahead bias. Stops and targets are ATR-scaled. If a candle touches both stop and target, the simulator assumes the adverse stop happened first. Fees and slippage are estimates and must be replaced with instrument- and broker-specific assumptions for meaningful research.

Default guardrails: 0.5% risk budget per trade, 2% daily loss stop, 10% maximum drawdown stop and 1x notional cap. These are simulator constraints, not recommendations.

## MT4 / MT5 and crypto data

This version does not connect to MT4, MT5 or crypto exchanges. Export historical candles as CSV and import them into the simulator. Forex symbols and contract specifications differ by broker. Crypto exchange candles differ by venue, timezone and quote currency. Validate symbol, timeframe, timezone, spread, commission and candle completeness before comparing results.

## API

- `GET /health`
- `GET /markets`
- `POST /backtest`
- `POST /paper/replay`

The POST body accepts a market, symbol, timeframe, at least 60 chronologically ordered OHLCV candles, and optional strategy/risk settings. The API does not persist user portfolios; this is a local single-process starter engine.

## Tests

```bash
pip install -e ".[dev]"
pytest -q
```

## Reference projects and attribution

The following repositories informed the feature decomposition and research workflow. No source code has been copied into this starter engine. Review each upstream repository's current license and notices before incorporating any of its code:

- Freqtrade: https://github.com/freqtrade/freqtrade (GPL-3.0)
- Freqtrade Strategies: https://github.com/freqtrade/freqtrade-strategies (GPL-3.0)
- EA31337: https://github.com/EA31337/EA31337 (GPL-3.0)
- Superalgos: https://github.com/Superalgos/Superalgos (Apache-2.0)

Do not copy source files into this repository without first reviewing the applicable license obligations and preserving required copyright notices.
