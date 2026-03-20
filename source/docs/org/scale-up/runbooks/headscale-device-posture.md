# Device posture checks

Runbook for configuring and enforcing device posture checks on nodes connecting to the banking operations namespace. Mr. Bent's requirements state that banking operations personnel must connect only from devices that meet specific security standards: disk encryption enabled, firewall active, operating system up to date. A node that does not meet these requirements is denied access to Royal Bank systems regardless of the user's identity.

## How posture checks work

Headscale does not natively enforce device posture; Tailscale's commercial product (the hosted version) includes this feature. The Golem Trust implementation uses a combination of:

1. Node expiry: nodes must re-register periodically, forcing a posture check at registration time
2. A pre-registration check script that runs on the client device before generating a pre-authentication key
3. Graylog alerts that flag nodes with stale posture data

This is a pragmatic approach given the self-hosted Headscale constraint. If the Royal Bank's requirements become stricter, the migration path is either Tailscale's hosted product or a dedicated device management solution such as Canonical's Landscape (Ubuntu) or Fleet (open source, cross-platform).

## Node expiry

Headscale supports node key expiry. Nodes whose keys have expired must re-register before they can communicate. Set the expiry for banking-ops nodes to 24 hours:

```
headscale nodes expire --identifier <node-id>
```

Automate expiry by setting it at registration time via the pre-authentication key:

```
headscale preauthkeys create \
  --user banking-ops \
  --expiration 24h \
  --reusable false
```

A single-use key that expires after 24 hours means banking operations workstations must re-register daily. The re-registration script (see below) performs the posture check before generating a new key.

## Client-side posture check script

Banking operations personnel run a script before their daily registration. This script is distributed via the internal self-service portal and is signed with the Golem Trust code signing key (stored in Vault). The script checks the required conditions and, if all pass, contacts the pre-authentication key endpoint to receive a fresh key and register the device.

Create `/opt/posture-check/banking-posture-check.sh`:

```
#!/bin/bash
set -euo pipefail

FAILURES=0
REPORT=""

# Check 1: disk encryption
check_disk_encryption() {
  if command -v lsblk &>/dev/null; then
    # Linux: check for LUKS encryption
    if lsblk -o NAME,TYPE | grep -q crypt; then
      REPORT+="PASS: Disk encryption active (LUKS)\n"
    else
      REPORT+="FAIL: No LUKS encryption detected\n"
      FAILURES=$((FAILURES + 1))
    fi
  elif [[ "$(uname)" == "Darwin" ]]; then
    # macOS: check FileVault
    if fdesetup status | grep -q "FileVault is On"; then
      REPORT+="PASS: Disk encryption active (FileVault)\n"
    else
      REPORT+="FAIL: FileVault is not enabled\n"
      FAILURES=$((FAILURES + 1))
    fi
  fi
}

# Check 2: firewall
check_firewall() {
  if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
    REPORT+="PASS: Firewall active (ufw)\n"
  elif command -v iptables &>/dev/null && iptables -L INPUT | grep -q "policy DROP\|policy REJECT"; then
    REPORT+="PASS: Firewall active (iptables)\n"
  elif [[ "$(uname)" == "Darwin" ]]; then
    if /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate | grep -q "enabled"; then
      REPORT+="PASS: Firewall active (macOS)\n"
    else
      REPORT+="FAIL: macOS firewall is not enabled\n"
      FAILURES=$((FAILURES + 1))
    fi
  else
    REPORT+="FAIL: Could not determine firewall status\n"
    FAILURES=$((FAILURES + 1))
  fi
}

# Check 3: OS updates
check_os_updates() {
  if command -v apt &>/dev/null; then
    PENDING=$(apt list --upgradable 2>/dev/null | grep -c upgradable || true)
    if [ "$PENDING" -lt 10 ]; then
      REPORT+="PASS: OS update pending count: ${PENDING}\n"
    else
      REPORT+="FAIL: ${PENDING} pending OS updates. Please update before connecting.\n"
      FAILURES=$((FAILURES + 1))
    fi
  fi
}

check_disk_encryption
check_firewall
check_os_updates

printf "$REPORT"

if [ $FAILURES -gt 0 ]; then
  echo "Device posture check failed. $FAILURES requirement(s) not met."
  echo "Resolve the issues above before registering for banking network access."
  exit 1
fi

echo "All posture checks passed. Requesting registration key..."

# Contact the Headscale pre-auth key endpoint via the internal API
# The endpoint validates the posture report before issuing a key
AUTHKEY=$(curl -s -X POST https://headscale.golemtrust.am/api/v1/posture/banking \
  -H "Authorization: Bearer $(vault kv get -field=posture_api_token kv/golemtrust/posture)" \
  -H "Content-Type: application/json" \
  -d "{\"hostname\": \"$(hostname)\", \"report\": \"$(printf "$REPORT" | base64)\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['key'])")

tailscale up \
  --login-server https://headscale.golemtrust.am \
  --authkey "$AUTHKEY" \
  --hostname "$(hostname)" \
  --accept-routes

echo "Registered successfully. Banking network access active for 24 hours."
```

The endpoint at `/api/v1/posture/banking` is a small Flask service running on `headscale.golemtrust.am` that validates the posture report, logs it to Graylog, and issues a pre-authentication key if all checks pass. The service code lives in `src/posture-api/` in the internal repository.

## Server-side posture API

The posture API service validates incoming posture reports and issues pre-authentication keys. It runs on `headscale.golemtrust.am` as a systemd service on port 8181, behind Nginx.

On receiving a posture report, it:

1. Validates the bearer token (a per-device token issued during device enrolment)
2. Parses the base64-encoded posture report
3. Confirms all required checks passed
4. Logs the report to Graylog (source system: `posture-check`, log type: `device-posture`)
5. Issues a single-use Headscale pre-authentication key with 24-hour expiry

Rejected requests (failed posture checks) are logged with `result: denied` and trigger a Graylog alert if the same device fails three times in 24 hours.

## Device enrolment

New banking operations workstations are enrolled by Carrot. Enrolment:

1. Verifies the device's hardware and OS configuration manually
2. Installs the posture check script from the signed package in the internal package repository
3. Issues a device-specific bearer token for the posture API (generated and stored in Vault per device)
4. Runs the first posture check and registration manually, confirming the device receives banking network access

Device tokens are stored in Vault at `kv/golemtrust/posture/<device-hostname>`. If a device is lost or decommissioned, revoke its token immediately:

```
vault kv delete kv/golemtrust/posture/<device-hostname>
```

## Monitoring

Graylog receives all posture check results. Create a stream `Device posture` filtered on `source_system: posture-check`.

Alert on consecutive failures: if a device fails posture three times in 24 hours, alert to `#security-alerts`. This may indicate the device is no longer meeting requirements, or that someone is attempting to use a compromised or non-compliant device.

Alert on devices that have not checked in for 48 hours: these may have stale Tailscale registrations. Carrot reviews this list weekly and follows up with device owners.
