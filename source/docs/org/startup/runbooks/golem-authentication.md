# Golem authentication implementation

Runbook for the custom Keycloak authentication provider that handles golem identity verification. Golems do not use passwords. They do not forget passwords, lose hardware tokens, or write credentials on sticky notes. They have something more fundamental: their chem. This runbook documents how we translate that into a form that Keycloak can verify.

## Background

A golem's chem is the scroll of words placed inside its head that gives it life and purpose. Each chem contains a unique sequence of sacred words. Ponder found that SHA3-512 hashing the canonical UTF-8 encoding of a golem's chem text produces a stable, unique 512-bit identifier that does not change between reboots, is not transmissible over the network, and cannot be replicated without access to the physical golem.

The authentication flow is:
1. The golem presents its identifier (a username in the form `golem-<name>`, e.g. `golem-pump`)
2. Keycloak calls the custom authenticator SPI
3. The authenticator fetches the expected SHA3-512 hash from the golems table in the Keycloak database
4. The golem's client sends the hash, computed locally by reading its own chem
5. The authenticator compares in constant time (to prevent timing attacks)
6. On success, the golem receives a short-lived service token; on failure, the attempt is logged and Ponder receives an alert

Mr. Pump was consulted during the design of this system. He seemed approving, or at least did not object, which from Mr. Pump is encouraging.

## Prerequisites

- Java 21 and Maven installed on the build machine
- Access to the Golem Trust internal Maven repository (or build from source; the SPI code lives in `src/golem-auth-spi/`)
- A running Keycloak instance (see the Keycloak deployment runbook)
- The `golem-pump` user account must already exist in the `golemtrust-internal` realm with the `service-account` role

## Building the SPI

The provider is a standard Keycloak SPI packaged as a JAR. Clone the repository and build:

```
git clone git@github.com:golemtrust/golem-auth-spi.git
cd golem-auth-spi
mvn clean package -DskipTests
```

This produces `target/golem-auth-spi-<version>.jar`. Do not skip the tests on a production build. The above command is for emergencies only, and Adora Belle will ask why tests were skipped.

## Deploying the provider

Copy the JAR to Keycloak's providers directory:

```
cp target/golem-auth-spi-<version>.jar /opt/keycloak/providers/
chown keycloak:keycloak /opt/keycloak/providers/golem-auth-spi-<version>.jar
```

Rebuild the Keycloak optimised configuration to pick up the new provider:

```
sudo -u keycloak /opt/keycloak/bin/kc.sh build
systemctl restart keycloak
```

Wait for Keycloak to restart (approximately two minutes), then verify the provider is registered:

```
curl -s https://auth.golemtrust.am/realms/golemtrust-internal/.well-known/openid-configuration \
  | python3 -m json.tool | grep golem
```

## Registering a golem identity

Golem identities are stored in a dedicated table in the Keycloak PostgreSQL database. Connect to the database and insert the golem's record:

```sql
INSERT INTO golem_identities (golem_name, chem_hash, realm, registered_by, registered_at)
VALUES (
  'pump',
  '<SHA3-512 hash of chem, provided by golem in person to Ponder>',
  'golemtrust-internal',
  'ponder.stibbons',
  NOW()
);
```

The hash must be provided by the golem directly. Do not compute it from a photograph of the chem or a written transcription. This defeats the purpose. Mr. Pump will present himself at the warehouse on a designated Thursday; Ponder computes the hash from the chem in a controlled environment and enters it immediately.

The corresponding Keycloak user account must already exist with the username `golem-pump`. Create it via the Keycloak admin console or the admin REST API:

```
curl -s -X POST "https://auth.golemtrust.am/admin/realms/golemtrust-internal/users" \
  -H "Authorization: Bearer <admin token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "golem-pump",
    "enabled": true,
    "email": "pump@golemtrust.am",
    "attributes": {
      "golem": ["true"],
      "golem_type": ["delivery"]
    }
  }'
```

Assign the `golem-service` role to this user. Golems do not have access to the admin console, the customer portal, or the staff holiday booking system.

## Configuring the authentication flow

In the Keycloak admin console, navigate to the `golemtrust-internal` realm, then Authentication, then Flows. Duplicate the built-in Browser flow and name it `Golem Service Flow`.

Add the `Golem Chem Authenticator` execution. Set it to REQUIRED. Remove the standard Username/Password Form and OTP executions from this flow. Golems do not use those.

Bind this flow to the `golem-service` client under Authentication Flow Overrides. Human accounts continue to use the standard flow. Do not bind the golem flow to any realm-level default.

## Verification

Test with a known golem identity (use the test golem `golem-test` registered in the staging environment):

```
curl -s -X POST "https://auth.golemtrust.am/realms/golemtrust-internal/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=golem-service&username=golem-test&chem_hash=<test hash>"
```

A successful response returns a JSON object with `access_token`. A failure returns a 401. Any response other than these two should be investigated before proceeding.

## Troubleshooting

If a golem cannot authenticate:

1. Check that the `golem_identities` table contains the correct entry with `SELECT * FROM golem_identities WHERE golem_name = 'pump';`
2. Check that the hash in the database matches what the golem is presenting. Hashes are case-sensitive; the implementation uses lowercase hex encoding.
3. Check `journalctl -u keycloak | grep "GolemChemAuthenticator"` for the authenticator's log output.
4. If the JAR was recently updated, confirm the new version is in `/opt/keycloak/providers/` and Keycloak was rebuilt after deployment.

A golem presenting the wrong hash is treated as a security event. The third consecutive failure triggers an account lock and an alert to Ponder. Mr. Pump has never triggered this alert. If Mr. Pump triggers this alert, something has changed about Mr. Pump's chem, and Ponder needs to be told in person immediately.