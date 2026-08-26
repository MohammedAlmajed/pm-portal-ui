# Local Keycloak (dev)

Runnable Keycloak for exercising the portal auth locally. **Dev only.**

```bash
docker compose -f keycloak/docker-compose.yml up
```

- Admin console: http://localhost:8080 (`admin` / `admin`)
- Realm: **room** (auto-imported from `room-realm.json`)
- Client: **room-portal-spa** — public, Auth Code + PKCE, redirect `http://localhost:3000/*`
- Realm roles: **broker**, **customer**
- Dev broker user: `broker@example.com` / `broker` (has the `broker` role)

Then in `.env.local`:

```
KEYCLOAK_ISSUER=http://localhost:8080/realms/room
KEYCLOAK_CLIENT_ID=room-portal-spa
KEYCLOAK_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## Multi-tenancy (Organizations)

Production tenancy uses **Keycloak Organizations**: each tenant is an Organization whose
membership carries `tenant_id`. The token then contains
`organization.<alias>.tenant_id`, which the backend
(`PropertiesManager.Shared/Authentication/CustomerClaimsTransformation.cs`) and the frontend
(`src/lib/auth/verify.ts` → `extractOrg`) both read.

Organizations are created per-tenant at runtime (admin API / provisioning), not baked into
this dev realm. For a single-tenant local smoke test you can skip Organizations — `tenantId`
will be empty and the app still authenticates.

## Audience

The access token includes `aud: room-api` (via the `aud-room-api` mapper) to match the
backend Keycloak scheme's audience validation. The id_token's audience is the client id
(`room-portal-spa`), which is what the frontend verifies in the callback.
