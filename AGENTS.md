# AGENTS.md — pm-portal-ui

Rules for anyone (human or AI) working in this repo. **Read this before editing.**
This app is a deliberate clean break from `properties-manager-ui` — do NOT port its
patterns. When in doubt, follow this file and `docs/UI_BEST_PRACTICES.md`.

## What this app is

The **authenticated external-actor portal** for the PropertiesManager platform:
- **Broker portal** (v1 — live focus)
- **Customer portal** (later)
- The internal **admin** app migrates in eventually.

Public marketing stays in `properties-manager-ui`. This app is portals only.

## Hard rules (do not violate)

1. **Next.js 15 dynamic APIs are async — always `await` them.** `cookies()`, `headers()`,
   and route `params` are Promises. Consult `node_modules/next/dist` over training memory
   if unsure — this Next version has breaking changes vs. older docs.
2. **Tokens are server-only.** The Keycloak access token lives in an **encrypted, HttpOnly
   cookie** (`src/lib/auth/session.ts`). Never put a token in `localStorage`, a
   `NEXT_PUBLIC_*` var, or a client component. `src/lib/env.ts` and everything in
   `src/lib/auth/*` and `src/server/*` are `import 'server-only'` — keep it that way.
3. **All backend calls go through the BFF.** Client components call
   `fetch('/api/<service>/<path>')`; the proxy (`src/app/api/[service]/[...path]/route.ts`)
   injects the bearer token + `x-tenant-host` server-side. Server components use
   `src/server/api-client.ts` directly. Never call the gateway from the browser.
4. **Never send or hardcode a numeric tenant id.** Tenancy is resolved by the backend from
   `x-tenant-host` (the hostname). The old app's `host → tenantId` maps are an anti-pattern
   we deleted on purpose.
5. **Colors come from tokens, never hardcoded hex.** Use semantic utilities (`bg-brand`,
   `text-muted`, `border-border`, `bg-danger-subtle`…). See `docs/THEMING.md`. A raw hex in
   a component is a bug — it breaks theming and per-tenant branding.
6. **Server Components by default.** Add `'use client'` only for interactivity (forms,
   toggles, menus). Never import `src/lib/auth/*` or `src/server/*` into a client component.
7. **Arabic/RTL-first.** `<html dir="rtl" lang="ar">` is fixed. Use logical utilities
   (`ms-`/`me-`, `ps-`/`pe-`, `border-s`/`border-e`) via `tailwindcss-rtl`, never `left`/`right`.

## Auth model (Keycloak, dual-plane)

- Employees stay on the existing pm-Identity JWT — **not here**. This app authenticates
  **external actors** (brokers, customers) via **Keycloak** (realm `room`).
- Flow: `/api/auth/login` (PKCE) → Keycloak → `/api/auth/callback` (verify id_token via
  **JWKS**, seal session) → middleware gates `(portal)` routes → server components read
  `getSession()`.
- Session shape (`src/lib/auth/session-types.ts`) mirrors what the backend reads
  (`sub`, `tenantId` flattened from `organization.<alias>.tenant_id`, `roles` from
  `realm_access.roles`). **UI role checks are for affordances only — the backend enforces.**
- **Backend boundary (why a broker can't reach tenant/employee data):** external-actor tokens
  are validated under a **separate** Keycloak scheme (`ExternalActor`, RS256/JWKS, issuer
  `…/realms/room`, `aud=room-api`) that is **not** the backend default. Plain `[Authorize]`
  (employee) endpoints resolve to the employee HS256/Dapr scheme, which rejects Keycloak tokens
  on both issuer and signature. External endpoints must use `[BrokerOnly]`/`[CustomerOnly]`
  (scheme **+** realm role). Three invariants keep this true — see the `<remarks>` on
  `KeycloakCustomerAuthExtensions` in `PropertiesManager.Shared`: (1) never make `ExternalActor`
  a default scheme, (2) always pair it with a role, (3) other services adopt it additively.

## Where things live

| Concern | Location |
|---|---|
| Auth (session, keycloak, verify, guards) | `src/lib/auth/` (server-only) |
| Env + gateway config | `src/lib/env.ts`, `src/server/gateway.ts` |
| Server backend calls | `src/server/api-client.ts` |
| BFF proxy | `src/app/api/[service]/[...path]/route.ts` |
| Design tokens | `src/styles/tokens.css` (+ `index.css` maps them to Tailwind) |
| UI primitives | `src/components/ui/` |
| Layout frame | `src/components/layout/` |
| Broker feature UI | `src/components/broker/`, `src/app/(portal)/broker/` |

## Backend endpoints (status)

The broker backend (BrokerProfile / BrokerApplication in PM-CustomerEngagement, plus the
Keycloak realm) is **not built yet**. Front-end calls to `/api/engagement/*` are wired but
marked `TODO(backend)`. Verify an endpoint exists before relying on it.

## Definition of done for a change

- `npm run typecheck` and `npm run lint` pass.
- No hardcoded colors, no client-side tokens, no numeric tenant ids.
- New backend calls go through the BFF and are documented in the relevant `TODO(backend)`.
