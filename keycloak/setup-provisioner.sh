#!/usr/bin/env bash
# Idempotent post-import setup for the `room` realm: creates the room-provisioner
# service-account client (used by pm-Identity's Admin API provisioning), grants it
# manage-users/view-users, and DISABLES self-registration (registration is portal-owned).
# Run after `docker compose up` (the realm import doesn't carry service-account role mappings).
#   ./keycloak/setup-provisioner.sh
set -euo pipefail
KC_BASE=${KC_BASE:-http://localhost:8080}
REALM=${REALM:-room}
PROV_SECRET=${PROV_SECRET:-room-provisioner-dev-secret}

TOKEN=$(curl -s "$KC_BASE/realms/master/protocol/openid-connect/token" \
  -d grant_type=password -d client_id=admin-cli -d username=admin -d password=admin | jq -r .access_token)
KC="$KC_BASE/admin/realms/$REALM"; H="Authorization: Bearer $TOKEN"

# 1. create the provisioner client if missing
if [ "$(curl -s -H "$H" "$KC/clients?clientId=room-provisioner" | jq 'length')" = "0" ]; then
  curl -s -o /dev/null -X POST -H "$H" -H "Content-Type: application/json" "$KC/clients" -d "{
    \"clientId\":\"room-provisioner\",\"enabled\":true,\"publicClient\":false,
    \"serviceAccountsEnabled\":true,\"standardFlowEnabled\":false,\"directAccessGrantsEnabled\":false,
    \"clientAuthenticatorType\":\"client-secret\",\"secret\":\"$PROV_SECRET\"}"
  echo "created room-provisioner"
else echo "room-provisioner already exists"; fi

# 2. grant realm-admin to its service account (needs to create users AND read/assign the
#    'broker' realm role). realm-admin is broad — for PROD, scope to manage-users + view-realm
#    + the specific role-assign permission instead.
CID=$(curl -s -H "$H" "$KC/clients?clientId=room-provisioner" | jq -r '.[0].id')
SA=$(curl -s -H "$H" "$KC/clients/$CID/service-account-user" | jq -r '.id')
RM=$(curl -s -H "$H" "$KC/clients?clientId=realm-management" | jq -r '.[0].id')
ROLES=$(curl -s -H "$H" "$KC/clients/$RM/roles" | jq -c '[.[] | select(.name=="realm-admin")]')
curl -s -o /dev/null -X POST -H "$H" -H "Content-Type: application/json" "$KC/users/$SA/role-mappings/clients/$RM" -d "$ROLES"
echo "granted realm-admin"

# 3. disable self-registration (registration is portal-owned)
curl -s -o /dev/null -X PUT -H "$H" -H "Content-Type: application/json" "$KC" -d '{"realm":"room","registrationAllowed":false}'
echo "self-registration disabled"
echo "done."
