# Theming & Design Tokens

This app is **fully tokenized**. Every color, radius, shadow, and font is a **named CSS
variable**, so switching theme (light/dark) or reskinning a tenant is a pure CSS cascade —
no rebuild, no component changes.

## The three layers

```
PRIMITIVES  (src/styles/tokens.css :root, --pm-c-*)   raw palette/scale
    ↓ referenced by
SEMANTIC    (--pm-canvas, --pm-surface, --pm-brand…)  what components read
    ↓ exposed to Tailwind via @theme inline (index.css)
UTILITIES   (bg-brand, text-muted, border-border…)    what you write in JSX
    ↓ overridden by
THEME/TENANT ([data-theme="dark"], [data-tenant="x"]) reskins
```

**Components only ever touch the semantic layer** (through Tailwind utilities). Never read a
primitive (`--pm-c-brand-600`) or a raw hex directly.

## Naming convention (every tag is override-friendly)

| Semantic token | Tailwind utility | Meaning |
|---|---|---|
| `--pm-canvas` | `bg-canvas` | page background |
| `--pm-surface` | `bg-surface` | cards, panels |
| `--pm-surface-sunken` | `bg-surface-sunken` | wells, table headers |
| `--pm-foreground` | `text-foreground` | primary text |
| `--pm-muted` | `text-muted` | secondary text |
| `--pm-subtle` | `text-subtle` | placeholder/tertiary |
| `--pm-border` | `border-border` | hairlines |
| `--pm-border-strong` | `border-border-strong` | input borders |
| `--pm-ring` | `ring-ring` | focus ring |
| `--pm-brand` | `bg-brand` / `text-brand` | brand fill/text |
| `--pm-brand-hover` / `-active` | — | brand interaction states |
| `--pm-brand-subtle` | `bg-brand-subtle` | tinted brand background |
| `--pm-on-brand` | `text-on-brand` | text/icon on brand fill |
| `--pm-success/-warning/-danger/-info` | `bg-*`, `text-*` | states (+ `-subtle`, `-on-*`) |

Radii: `rounded-{xs,sm,md,lg,xl,2xl}` ← `--pm-radius-*`.
Shadows: `shadow-{sm,md,lg}` ← `--pm-shadow-*`.

## Switch the THEME (light ⇄ dark)

`ThemeProvider` sets `data-theme` on `<html>`. Dark values live in the
`[data-theme="dark"]` block in `tokens.css` and override **only the semantic layer**.
Add a new named theme by adding a `[data-theme="..."]` block that redefines the same
semantic tokens.

## Reskin a TENANT (change the colors)

A tenant overrides a **handful** of named tokens; everything cascades. Two ways:

1. **Static** — add a block in `tokens.css`:
   ```css
   [data-tenant='acme'] {
     --pm-brand: #059669;
     --pm-brand-hover: #047857;
     --pm-brand-active: #065f46;
     --pm-brand-subtle: #e7f7ef;
     --pm-brand-border: #a7f3d0;
     --pm-ring: #10b981;
   }
   ```
   Then pass `tenant="acme"` to `<ThemeProvider tenant="acme">` (sets `data-tenant`).

2. **Dynamic (per-request)** — inject the same variables inline on `<html>` from a
   tenant-branding API response (server component), e.g. a `style` string
   `--pm-brand:#059669;--pm-ring:#10b981`. Because utilities read the vars at runtime
   (`@theme inline`), the whole app re-skins instantly with zero component changes.

You typically only need to override the **brand** tokens and (optionally) the **canvas**.
Buttons, links, badges, focus rings, and active nav all follow `--pm-brand` automatically.

## Rules

- **Never hardcode a hex in a component.** If you need a color that doesn't exist, add a
  named semantic token first.
- Keep dark + light in sync when you add a semantic token.
- Prefer `-subtle` background + solid `text-*` for status pills (see `Badge`).

## White-label a dedicated deployment (env-driven, same image)

For a dedicated per-client instance, don't rebuild — set env (ConfigMap). All read
server-side, threaded to components; no `NEXT_PUBLIC` baking. Empty = keep the default.

| Env | What |
|---|---|
| `BRAND_NAME` | full name (titles, login card) |
| `BRAND_SHORT` | sidebar label |
| `BRAND_MARK` | logo glyph in the brand chip |
| `BRAND_DESCRIPTION` | `<meta name=description>` |
| `BRAND_THEME_COLOR` | `<meta theme-color>` (browser chrome / PWA) |
| `BRAND_COLOR` / `_HOVER` / `_ACTIVE` / `_SUBTLE` / `_BORDER` | `--pm-brand*` overrides |
| `BRAND_RING` | focus ring `--pm-ring` |

Colors are injected as `:root,:root[data-theme="dark"]{ … }` on the server-rendered
`<html>` — buttons, links, focus rings, active nav all follow. Pages that show branding
are `force-dynamic` so the values reflect the deploy's ConfigMap, not build time.
