# Trader

Trader is a responsive educational market-learning website. It introduces market concepts, provides illustrative watchlists and signal studies, and explains simulated portfolio practice.

## Included
- Three pictorial onboarding slides explaining the platform.
- Email/password login and signup interface for a front-end preview.
- Overview dashboard with illustrative chart and sample watchlist.
- Market watch page with clearly labelled sample figures.
- Paper-practice page with a virtual-only balance.
- Educational signal studies: trend structure, support/resistance and uncertainty.
- Eight beginner learning topics with local completion tracking.
- Responsive dark interface with green accents.

## Run locally
Open index.html in a browser, or run a static server in this folder:
python -m http.server 8000
Then visit http://localhost:8000.

## Authentication
The current login/signup screen is a front-end preview only. It does not create secure user accounts, store passwords, or provide password recovery. Before public launch, connect a trusted authentication provider and implement server-side sessions, email verification, password reset, rate limiting and appropriate security rules. Never store plain-text passwords in browser storage.

## Market data and practice
All displayed prices, percentage changes, charts and the $10,000 practice balance are illustrative placeholders. They are not live prices, trade alerts or recommendations. The practice experience is explanatory only; it does not submit, route or execute orders.

## Reference projects
The design and learning direction take conceptual inspiration from the user's saved GitHub references:
- Freqtrade: modular strategy concepts and the distinction between analysis, testing and execution.
- Freqtrade Strategies: examples of how strategy ideas can be organised for study.
- Superalgos: visual, workflow-oriented presentation of market-analysis concepts.

These projects are references only. Trader does not copy their source code, run trading bots, connect brokerages or execute trades.

## Suggested production milestones
1. Add secure authentication and a user profile database.
2. Add a lesson-content model and persist learner progress.
3. Add a market-data provider only if current quotes are needed, with clear source and delay labels.
4. Build a fully simulated portfolio ledger with explicit virtual-only state.
5. Add accessibility, security and mobile-device testing before launch.

## Educational disclaimer
Trader is for learning and demonstration. It does not provide financial advice, personalised investment recommendations, or actionable buy/sell signals. Financial markets involve risk.
