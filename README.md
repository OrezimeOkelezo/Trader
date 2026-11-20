# Trader

Trader is an educational market-learning website with Supabase-powered account access, a learning dashboard, sample watchlists, paper-practice explanations and a dedicated Trading Signals learning page.

## Stack
- Static frontend: HTML, CSS and JavaScript modules
- Authentication and database: Supabase Auth + Postgres
- Browser SDK: supabase-js v2 with the project's publishable key
- Hosting: GitHub Pages or any static host

## Supabase project
Configured for the Supabase project **Klasek** (project ref: qijqcrcxhbiftvfplyyl).

### Account and data storage
- New users register with name, email and password using Supabase Auth.
- Passwords are handled by Supabase Auth and are never stored by this frontend.
- A database trigger creates a matching row in public.profiles.
- Lesson completions are stored in public.lesson_progress.
- Row Level Security restricts each learner to their own profile and progress rows.
- Email verification and password reset behaviour follow the Supabase Auth project settings.

## Run locally
Serve this folder with a static server, for example: python -m http.server 8000, then visit http://localhost:8000.

## Configure Supabase Auth URLs
In Supabase Dashboard, open Authentication → URL Configuration and add your deployed site URL to Site URL and Redirect URLs. For local testing, add http://localhost:8000/**. Ensure the Email provider is enabled and configure email confirmation as desired.

## Trading signals page
The Trading Signals section contains educational chart-study examples only. It does not publish actionable buy/sell instructions, live trading calls, broker orders or financial advice. All market figures elsewhere in the app are illustrative placeholders.

## Saved GitHub project inspiration
The saved references Freqtrade, Freqtrade Strategies and Superalgos informed the separation of market-study concepts, strategy-learning vocabulary and simulation from execution. Their bots are not copied, deployed or connected to Trader.

## Security notes
- The publishable Supabase key in browser code is intended for frontend use. Database access is restricted by Row Level Security.
- Never put a Supabase secret or service-role key in this repository.
- Review Supabase Auth email settings, URL allow-lists, RLS policies and project security advisors before public launch.
- Trader is educational, not a broker or investment service.
