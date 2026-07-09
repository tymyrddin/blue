# SAML federation

Runbook for federating Keycloak with the Royal Bank of Ankh-Morpork's identity provider via SAML 2.0. After federation, Bank employees authenticate to Golem Trust systems using their existing Bank credentials. Golem Trust does not store Bank employee passwords. Just-in-time provisioning creates Keycloak accounts automatically on first login.

## How federation works

The Royal Bank operates an identity provider (their Active Directory Federation Services instance) that issues SAML 2.0 assertions. Keycloak is configured as a SAML service provider. When a Bank employee attempts to log in to a Golem Trust application, Keycloak redirects them to the Bank's IdP, the Bank authenticates them, and the Bank's IdP returns a SAML assertion to Keycloak confirming their identity and group memberships.

Keycloak receives the assertion, maps the Bank's user attributes to Golem Trust roles, and creates or updates the user account automatically. The Bank's authentication policy (including their MFA requirements) applies; Golem Trust does not manage Bank employees' authentication strength.

## Prerequisites

- A working Keycloak instance with the `golemtrust-customer` realm (see the startup Keycloak deployment runbook)
- The Royal Bank's SAML 2.0 metadata XML document, obtained from Mr. Bent's IT contact
- The Royal Bank's IdP signing certificate, included in the metadata document
- Agreement on the attribute mappings: which LDAP attributes in the Bank's directory map to which Keycloak roles

The attribute mapping must be agreed with the Royal Bank's IT department before configuration begins. The Bank's IT contact is noted in Vaultwarden under the Royal Bank collection.

## Configuring the identity provider in Keycloak

Log in to the Keycloak admin console at `https://auth.golemtrust.am` and navigate to the `golemtrust-customer` realm.

Navigate to Identity Providers, then Add Provider, then SAML v2.0.

Configure the basic settings:
- Alias: `royal-bank`
- Display name: `Royal Bank of Ankh-Morpork`
- First Login Flow: `first broker login` (Keycloak's built-in flow that handles JIT provisioning)
- Sync Mode: `force` (always update local account from the SAML assertion on each login)

Import the Bank's metadata:
- In the `Import from URL` or `Import from File` section, upload the metadata XML provided by the Bank's IT contact
- Keycloak reads the metadata and populates the `Single Sign-On Service URL`, `Single Logout Service URL`, and the IdP signing certificate automatically

Verify the populated fields against the metadata document manually. Errors in the SSO URL mean authentication will fail silently for Bank employees.

Set the Name ID Policy Format to `Email`. Bank employees are identified by their corporate email address in the Bank's directory.

Enable `Want AuthnRequests Signed` and upload the Golem Trust SAML signing certificate (generated in the next step).

## Generating the service provider certificate

Keycloak needs a signing certificate to sign authentication requests sent to the Bank's IdP. Generate a dedicated certificate for this purpose:

```
openssl req -new -x509 -days 1095 \
  -subj "/CN=golemtrust-saml-sp/O=Golem Trust/C=AM" \
  -newkey rsa:2048 -nodes \
  -keyout /etc/keycloak/saml-sp-key.pem \
  -out /etc/keycloak/saml-sp-cert.pem
chmod 640 /etc/keycloak/saml-sp-key.pem
chown keycloak:keycloak /etc/keycloak/saml-sp-key.pem /etc/keycloak/saml-sp-cert.pem
```

Upload the private key and certificate in Keycloak's Identity Provider configuration under Keys. The public certificate is also sent to the Royal Bank's IT contact so their IdP can verify Golem Trust's authentication requests.

Store the private key in Vaultwarden under the Royal Bank collection. The certificate expires in three years; set a calendar reminder for rotation at 30 months.

## Service provider metadata

After saving the identity provider configuration, export the Golem Trust service provider metadata:

```
curl -s https://auth.golemtrust.am/realms/golemtrust-customer/broker/royal-bank/endpoint/descriptor
```

Send this XML to the Royal Bank's IT contact. They register it in their IdP. Until they have done so, the federation will not work from their end.

Allow 2 to 5 business days for the Bank's IT processes. Test in staging before production.

## Attribute mappers

Keycloak maps attributes from the SAML assertion to local user attributes and roles. Configure attribute mappers under the `royal-bank` identity provider's Mappers tab.

Create the following mappers:

Email mapper:
- Name: `email`
- Mapper type: Attribute Importer
- Attribute Name: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`
- User Attribute Name: `email`

First name mapper:
- Attribute Name: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname`
- User Attribute Name: `firstName`

Last name mapper:
- Attribute Name: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname`
- User Attribute Name: `lastName`

Department mapper (for role assignment):
- Name: `department`
- Mapper type: Attribute Importer
- Attribute Name: `department`
- User Attribute Name: `bankDepartment`

Role mapper for banking operations:
- Name: `banking-ops-role`
- Mapper type: Hardcoded Role
- Role: `banking-ops-user`
- This assigns the role to all federated Bank users; further role filtering is done via Keycloak groups if needed

The exact attribute names depend on what the Bank's IdP sends in the assertion. Ask the Bank's IT contact for a sample assertion (with sensitive data redacted) to confirm the attribute names before configuring mappers.

## Just-in-time provisioning

The `first broker login` flow handles JIT provisioning. On a Bank employee's first login:

1. Keycloak receives the SAML assertion
2. It checks whether an account with the matching email address already exists
3. If no account exists, it creates one automatically using the assertion attributes
4. The new account is assigned the `banking-ops-user` role via the hardcoded role mapper
5. The employee is logged in without further prompts

If an account with the same email already exists (created manually, for example), Keycloak links it to the federated identity. Review the `first broker login` flow configuration to confirm the linking behaviour is set to `confirm` (requires the user to confirm the link on first federation login), unless the Bank's IT contact has confirmed that the email addresses are authoritative.

## Quarterly access review

Keycloak tracks the last login time for all users. Use this for the quarterly access review of Bank-federated accounts. Users who have not logged in for 90 days are suspended in Keycloak. The suspension is communicated to the Bank's IT contact, who confirms whether the account should be permanently removed.

```
# List all banking-ops-user accounts and their last login time
kcadm.sh get users -r golemtrust-customer \
  --query "max=200" \
  --fields username,email,enabled,attributes
```

The `kcadm.sh` tool is included in the Keycloak distribution. Automating the quarterly review is on Ponder's list; until then, run it manually and export to a spreadsheet for Carrot's review.

## Testing federation

Test with a Bank test account (provided by the Bank's IT contact for integration testing; not a real Bank employee account):

1. Navigate to a Golem Trust application in the `golemtrust-customer` realm
2. Click `Login with Royal Bank of Ankh-Morpork`
3. You should be redirected to the Bank's IdP login page
4. Log in with the test credentials
5. You should be redirected back to Keycloak and then to the application

If the redirect fails, check:
- The SSO URL in the Keycloak IdP configuration matches the Bank's actual SSO endpoint
- The Golem Trust SP metadata has been registered in the Bank's IdP
- The signing certificate is correctly configured on both sides
- The attribute names in the mappers match what the Bank's IdP sends

Keycloak's admin console shows a log of identity provider events under Events, which is the first place to look when federation fails.
Last updated: 10 July 2026
