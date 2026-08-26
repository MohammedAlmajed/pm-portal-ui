# UI Best Practices — pm-portal-ui

The standard for building UI in this app. These are **rules to follow**, not suggestions.
Paired with `docs/THEMING.md` (tokens) and `AGENTS.md` (architecture rules).

## 1. Design language

- **Fresh, calm, professional.** This is a B2B/B2C portal, not a marketing site. Favor
  clarity and generous whitespace over decoration. No gradients-as-decoration, no random
  emoji, no drop-shadow soup — one elevation system (`shadow-sm/md/lg`).
- **Tokens only.** Every color/radius/shadow is a semantic token (see THEMING.md). A raw
  hex in a component is a defect.
- **Elevation ladder:** flat surfaces `bg-surface` + `border-border`; raise with
  `shadow-sm` (cards) → `shadow-md` (hover/menus) → `shadow-lg` (modals). Don't invent
  ad-hoc shadows.
- **Radius rhythm:** inputs/buttons `rounded-md`, cards `rounded-lg`, pills `rounded-full`.

## 2. RTL & Arabic-first

- The document is `dir="rtl" lang="ar"` — fixed. **Never** use physical direction utilities
  (`ml-`, `mr-`, `left-`, `right-`, `text-left`). Use logical ones: `ms-`/`me-`, `ps-`/`pe-`,
  `start-`/`end-`, `border-s`/`border-e`, `text-start`/`text-end` (via `tailwindcss-rtl`).
- Force LTR only for intrinsically-LTR data (email, phone, IBAN, license numbers) with
  `dir="ltr"` on that field.
- Use the `.num` class (tabular numerals) for money, counts, dates.

## 3. Server vs. Client components

- **Default to Server Components.** Fetch data in `page.tsx`/`layout.tsx` server components
  via `src/server/api-client.ts`.
- Add `'use client'` **only** for interactivity: forms, toggles, menus, anything using
  `useState`/`useEffect`/event handlers.
- **Never** import `src/lib/auth/*`, `src/lib/env.ts`, or `src/server/*` into a client
  component (they're `server-only` and will fail the build — by design).
- Pass only plain serializable data from server → client components (e.g. the result of
  `getSession()`, not the functions).
- **Never pass a component *type* or function across the server→client boundary** (e.g. a
  Lucide icon component in a props object). React can't serialize it — you get
  *"Only plain objects can be passed to Client Components."* Pass a string **key** and
  resolve it to a component inside the client (see the `ICONS` registry in `SideNav.tsx`).
  Rendered elements (`<Icon />` JSX) are fine as `children`/props; component references are not.

## 4. Data fetching

- Client → **BFF**: `fetch('/api/<service>/<path>')`. Token + `x-tenant-host` are injected
  server-side. Never call the gateway or a microservice directly from the browser.
- Server → `serverJson<T>(service, path)` / `serverFetch`. Throws `ApiError` on non-2xx.
- Always render three states: **loading, empty, error**. Empty states get a helpful message
  and a next action (see the applications page).

## 5. Forms

- `react-hook-form` + `zod` via `@hookform/resolvers/zod`. One schema is the source of truth
  for validation.
- Use the shared `Field` + `Input` primitives (labels, hints, errors are standardized).
- Arabic validation messages. Disable submit while pending; show success/error inline.
- Financial/derived values are **read-only from the backend** — never compute money in the
  client (platform rule).

## 6. Components

- Build small, owned primitives in `src/components/ui/` wrapping Radix where behavior is
  needed (dialog, dropdown, tooltip). Don't pull a heavyweight component library.
- One icon set: **lucide-react**. Consistent sizes (16 for inline, 18–20 for nav/actions).
- Prefer composition (`Card` + `CardHeader` + `CardContent`) over prop explosions.
- `cn()` (`src/lib/cn.ts`) for conditional classes; last-wins Tailwind merge.

## 7. Auth-aware UI

- Gate nav/affordances with `session.roles` (`hasRole`). This is **cosmetic** — the backend
  is the security boundary. Never rely on hiding a button for authorization.
- Unauthenticated → middleware redirects to `/login`. Wrong role → `/forbidden`.

## 8. Accessibility & responsiveness

- Every interactive element is keyboard reachable with a visible focus ring (`:focus-visible`
  is token-styled globally — don't remove outlines).
- Label every input (`Field` does this). Icon-only buttons need `aria-label` (Arabic).
- Mobile-first: the shell collapses the side nav under `md`. Test at 360px width.
- Respect `prefers-reduced-motion` for any animation you add.

## 9. Errors & observability

- Use `error.tsx` / `global-error.tsx` boundaries; show a calm Arabic message + retry.
- (Follow-up) Sentry wiring mirrors the family setup — add DSN via env before enabling.

## 10. Definition of done

- `npm run typecheck` + `npm run lint` clean.
- No hardcoded colors, no physical-direction utilities, no client-side tokens.
- Loading/empty/error states present for any data view.
- New primitive? Document its variants here or in the component.
