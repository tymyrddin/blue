# ACL configuration

Runbook for configuring Headscale access control lists. ACLs define which nodes can communicate with which other nodes on the zero-trust network. The default Tailscale behaviour is to allow all nodes in the same namespace to communicate with each other. That default is too permissive for Mr. Bent's requirements. This runbook documents the explicit, minimal-access ACL policy that replaced it.

## The requirement

Section 47, subsection 12b: no implicit trust. Every permitted communication path must be explicit. Compromising one system must not grant access to others (Section 89, subsection 3a).

In ACL terms: the default policy is deny-all. Every permitted connection is listed explicitly. If a path is not listed, it does not exist.

## ACL file location and format

The ACL policy lives at `/etc/headscale/acls.hujson`. HuJSON is JSON with comments, which Headscale supports. Use comments extensively; an ACL without comments becomes unmaintainable quickly.

The ACL file is deployed to Headscale with:

```
headscale policy set -f /etc/headscale/acls.hujson
```

Changes take effect immediately for all connected nodes. Test ACL changes in a staging Headscale instance before applying to production.

## Current ACL policy

```
{
  // Golem Trust zero-trust ACL policy
  // Last reviewed: 2026-03-20
  // Reviewed by: carrot.ironfoundersson
  //
  // Default: deny all. Only explicitly listed paths are permitted.

  "hosts": {
    // Infrastructure servers
    "auth-server":      "100.64.0.1",
    "db-server":        "100.64.0.2",
    "graylog-1":        "100.64.0.3",
    "graylog-2":        "100.64.0.4",
    "graylog-3":        "100.64.0.5",
    "vault-1":          "100.64.0.6",
    "vault-2":          "100.64.0.7",
    "vault-3":          "100.64.0.8",
    "vault-transit":    "100.64.0.9",
    "nsm-server":       "100.64.0.10",
    "metrics-server":   "100.64.0.11",
    "teleport-server":  "100.64.0.12",
    "headscale-server": "100.64.0.13",
    "strongdm-server":  "100.64.0.14",
    // Royal Bank portal servers
    "bank-app-01":      "100.64.1.1",
    "bank-app-02":      "100.64.1.2",
    "bank-db-01":       "100.64.1.3"
  },

  "tagOwners": {
    "tag:infrastructure": ["infrastructure"],
    "tag:banking":        ["banking-ops"],
    "tag:soc":            ["soc-team"],
    "tag:vendor":         ["vendor-access"]
  },

  "acls": [
    // Infrastructure: servers may reach Vault for secrets
    {
      "action": "accept",
      "src": ["tag:infrastructure"],
      "dst": ["vault-1:8200", "vault-2:8200", "vault-3:8200"]
    },

    // Infrastructure: servers may reach the database
    {
      "action": "accept",
      "src": ["auth-server", "bank-app-01", "bank-app-02"],
      "dst": ["db-server:5432"]
    },

    // Infrastructure: all servers send logs to Graylog
    {
      "action": "accept",
      "src": ["tag:infrastructure"],
      "dst": ["graylog-1:12201", "graylog-2:12201", "graylog-3:12201",
              "graylog-1:5044",  "graylog-2:5044",  "graylog-3:5044"]
    },

    // Infrastructure: Prometheus scrapes node exporters
    {
      "action": "accept",
      "src": ["metrics-server"],
      "dst": ["tag:infrastructure:9100", "tag:infrastructure:9187"]
    },

    // SOC team: access to logging and monitoring infrastructure
    {
      "action": "accept",
      "src": ["tag:soc"],
      "dst": ["graylog-1:443", "graylog-2:443", "graylog-3:443",
              "metrics-server:443"]
    },

    // SOC team: read-only access to NSM server for PCAP analysis
    {
      "action": "accept",
      "src": ["tag:soc"],
      "dst": ["nsm-server:22"]
    },

    // Banking operations: access to Royal Bank portal servers only
    // Access requires device compliance check (see device posture runbook)
    {
      "action": "accept",
      "src": ["tag:banking"],
      "dst": ["bank-app-01:443", "bank-app-02:443"]
    },

    // Banking operations: database access goes via StrongDM only
    {
      "action": "accept",
      "src": ["strongdm-server"],
      "dst": ["bank-db-01:5432", "db-server:5432"]
    },

    // Teleport: SSH access to all infrastructure servers
    {
      "action": "accept",
      "src": ["teleport-server"],
      "dst": ["tag:infrastructure:3022", "tag:infrastructure:22"]
    },

    // Teleport: agents report back to the Auth server
    {
      "action": "accept",
      "src": ["tag:infrastructure"],
      "dst": ["teleport-server:3025"]
    },

    // Headscale: nodes register with the control plane
    {
      "action": "accept",
      "src": ["*"],
      "dst": ["headscale-server:443"]
    }
  ],

  // ssh rules (if using Tailscale SSH; not currently in use - Teleport handles SSH)
  "ssh": []
}
```

## ACL review process

Carrot reviews the ACL policy quarterly. Each review confirms:

1. Every listed path is still required by an active service or team
2. No path has been added informally outside this process
3. Banking operations paths comply with the current Mr. Bent audit requirements
4. New services added since the last review have been added to the ACL (and not permitted by accident via a too-broad existing rule)

Changes to the ACL policy require a pull request reviewed by Carrot. Emergency changes (during an active incident) may be applied immediately by Carrot or Ponder, with the pull request filed retrospectively within 24 hours.

## Adding a new service

When a new server or service is added to the zero-trust network:

1. Assign it a static Tailscale IP by registering it with a specific pre-authentication key
2. Add it to the `hosts` block with its IP
3. Add explicit ACL entries for only the paths it needs
4. Apply the updated policy: `headscale policy set -f /etc/headscale/acls.hujson`
5. Verify connectivity for the permitted paths and absence of connectivity for all others

Do not add a new service to an existing broad tag (such as `tag:infrastructure`) without confirming that all paths granted by that tag to the new service are intentional. Tags are convenience groupings, not implied permission grants.

## Testing ACL changes

After applying an ACL change, test from a node on the relevant namespace:

```
# Should succeed (explicitly permitted)
tailscale ping auth-server

# Should fail (no ACL rule permits this path)
tailscale ping bank-db-01
```

`tailscale ping` tests ICMP reachability. For service-level testing, attempt an actual connection:

```
# From a banking-ops node - should succeed
curl -sk https://bank-app-01/health

# From a banking-ops node - should be refused
psql -h bank-db-01 -U test
```

The second command should time out or be refused at the network level. A TCP connection that reaches the database but fails authentication indicates the ACL is not blocking the path; investigate and correct the ACL before proceeding.
Last updated: 10 July 2026
