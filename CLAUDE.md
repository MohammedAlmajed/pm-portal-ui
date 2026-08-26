# CLAUDE.md — pm-portal-ui

Guidance for Claude Code working in this repo.

**Read `AGENTS.md` first** — it holds the hard rules. This file is a short orientation.

## What this is

Standalone Next.js 15 app for the platform's **authenticated external-actor portals**
(broker portal in v1; customer portal later; admin migrates in eventually). A clean-room
rebuild — do **not** copy patterns from `properties-manager-ui`.

## Stack

Next.js 15.5 (App Router, async dynamic APIs) · React 19 · Tailwind v4 (CSS-first `@theme`) ·
TypeScript (strict) · `jose` (Keycloak OIDC) · `react-hook-form` + `zod` · Arabic/RTL-first.

## Commands

```bash
npm install
npm run dev        # user runs this themselves — do not auto-start it
npm run build
npm run typecheck
npm run lint
```

## Must-read docs (in this repo)

- `AGENTS.md` — architecture + hard rules (server-only tokens, BFF, no numeric tenant ids).
- `docs/THEMING.md` — the tokenized theme system; how to switch theme / reskin a tenant.
- `docs/UI_BEST_PRACTICES.md` — how to build UI here (RTL, server components, forms, a11y).

## Non-negotiables (see AGENTS.md for detail)

1. `await` Next 15 `cookies()`/`headers()`/`params`.
2. Access tokens are server-only (encrypted HttpOnly cookie); never in the browser.
3. All backend calls go through the BFF (`/api/<service>/…`) with `x-tenant-host`.
4. Colors via semantic tokens only — no raw hex in components.
5. Server Components by default; `'use client'` only for interactivity.

## Backend status

The broker backend (Keycloak realm + BrokerProfile/BrokerApplication in PM-CustomerEngagement)
is **not built yet**. Front-end calls to `/api/engagement/*` are stubbed with `TODO(backend)`.
