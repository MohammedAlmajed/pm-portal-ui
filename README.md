# pm-portal-ui

Authenticated **external-actor portals** for the PropertiesManager platform — broker portal
(v1), customer portal (later). Standalone Next.js 15 app, Keycloak-authenticated,
multi-tenant, Arabic/RTL-first, fully themeable.

> Public marketing lives in `properties-manager-ui`. This app is portals only.

## Quick start

```bash
cp .env.example .env.local   # fill in Keycloak + session secret + gateway URL
npm install
npm run dev                  # http://localhost:3000
```

## Docs

| File | What |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Architecture + hard rules. **Read first.** |
| [`docs/THEMING.md`](./docs/THEMING.md) | Tokenized theme system; switch theme / reskin a tenant. |
| [`docs/UI_BEST_PRACTICES.md`](./docs/UI_BEST_PRACTICES.md) | How to build UI here. |
| [`CLAUDE.md`](./CLAUDE.md) | Orientation for Claude Code. |

## Architecture at a glance

```
Browser ──fetch('/api/<svc>/…')──► BFF proxy (Route Handler)
                                      │  injects Bearer (sealed session) + x-tenant-host
                                      ▼
                                   API Gateway ──► microservices
```

- **Auth:** Keycloak (realm `room`) OIDC + PKCE. Access token sealed in an HttpOnly cookie —
  never reaches the browser. Login/callback in `src/app/api/auth/*`; guards in
  `src/lib/auth/`.
- **Tenancy:** resolved by the backend from `x-tenant-host` (hostname). No numeric tenant ids
  in the frontend.
- **Theming:** three-layer CSS tokens (primitives → semantic → theme/tenant). See THEMING.md.

## Status

Frontend scaffold + broker portal skeleton. The broker **backend** (Keycloak realm +
BrokerProfile/BrokerApplication in PM-CustomerEngagement) is next; calls to `/api/engagement/*`
are stubbed with `TODO(backend)`.
