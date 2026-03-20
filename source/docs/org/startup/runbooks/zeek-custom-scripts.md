# Custom script development

Runbook for writing and deploying custom Zeek scripts and Suricata rules. The standard Zeek scripts and ET Open rules cover general threat patterns. The custom work covers patterns specific to Golem Trust's environment and customer base. Ludmilla leads this; Moist von Lipwig contributes the banking fraud patterns. Dr. Crucible reviews everything before deployment.

## Zeek scripting overview

Zeek scripts are written in the Zeek scripting language and live in `/opt/zeek/share/zeek/site/`. The entry point is `local.zeek`, which loads everything else. Custom scripts specific to Golem Trust are in `/opt/zeek/share/zeek/site/golemtrust/`.

Create the directory:

```
mkdir -p /opt/zeek/share/zeek/site/golemtrust
```

Load all scripts in the directory from `local.zeek`:

```
@load golemtrust
```

Each `.zeek` file in the `golemtrust/` directory is loaded automatically.

## Detecting beaconing

The compromised developer workstation that was discovered two days after Zeek deployment was beaconing to a command and control server in Tsort. The beacon was regular: a connection every 300 seconds, 128 bytes out, 64 bytes back. Zeek's `conn.log` showed this clearly in retrospect; the following script makes it visible in real time.

Create `/opt/zeek/share/zeek/site/golemtrust/beacon-detection.zeek`:

```
module BeaconDetection;

export {
  redef enum Notice::Type += {
    Potential_Beacon
  };
}

global connection_intervals: table[addr] of vector of interval &create_expire = 1hr;

event connection_state_remove(c: connection) {
  if ( c$id$resp_h !in Site::local_nets ) {
    local src = c$id$orig_h;
    local ts = c$start_time;

    if ( src !in connection_intervals )
      connection_intervals[src] = vector();

    connection_intervals[src] += network_time() - ts;

    if ( |connection_intervals[src]| >= 5 ) {
      local intervals = connection_intervals[src];
      local sum: interval = 0 sec;
      for ( i in intervals )
        sum += intervals[i];
      local mean = sum / |intervals|;

      local variance: double = 0.0;
      for ( i in intervals )
        variance += (interval_to_double(intervals[i]) - interval_to_double(mean)) ^ 2;
      variance /= |intervals|;

      if ( variance < 100.0 && interval_to_double(mean) > 60.0 ) {
        NOTICE([$note=Potential_Beacon,
                $conn=c,
                $msg=fmt("Potential beacon from %s to %s, mean interval %.1f sec, variance %.2f",
                         src, c$id$resp_h, interval_to_double(mean), variance),
                $identifier=fmt("%s-%s", src, c$id$resp_h)]);
      }
    }
  }
}
```

This script tracks connection intervals from each internal host to each external destination. If more than five connections have occurred with low variance in their interval (variance below 100 seconds squared) and a mean interval above 60 seconds, it raises a `Potential_Beacon` notice. The thresholds are deliberately loose; tighten them after reviewing the baseline from the first week of operation.

## Detecting guild data access

The Seamstresses' Guild and other customers' data should only be accessed by their authorised portal servers. Direct database access from unexpected hosts is a concern. This script raises a notice when any host other than the expected application servers connects to the database server on port 5432.

Create `/opt/zeek/share/zeek/site/golemtrust/guild-data-access.zeek`:

```
module GuildDataAccess;

export {
  redef enum Notice::Type += {
    Unexpected_Database_Access
  };

  const authorised_db_clients: set[addr] = {
    10.0.0.2,  # auth.golemtrust.am
  } &redef;

  const db_server: addr = 10.0.0.3 &redef;
}

event new_connection(c: connection) {
  if ( c$id$resp_h == db_server && c$id$resp_p == 5432/tcp ) {
    if ( c$id$orig_h !in authorised_db_clients ) {
      NOTICE([$note=Unexpected_Database_Access,
              $conn=c,
              $msg=fmt("Unexpected connection to database from %s", c$id$orig_h),
              $identifier=fmt("%s", c$id$orig_h)]);
    }
  }
}
```

Update `authorised_db_clients` when new application servers are authorised to connect to the database.

## Banking fraud patterns (Moist von Lipwig)

Moist contributes pattern signatures based on fraud techniques he encountered before joining Golem Trust in a consulting capacity. These are Suricata rules rather than Zeek scripts, because they match on specific payload content.

Create `/etc/suricata/rules/golemtrust.rules`. The following detects a pattern associated with credential stuffing tools that use a characteristic HTTP header ordering:

```
alert http $EXTERNAL_NET any -> $HOME_NET any (msg:"GOLEMTRUST Potential credential stuffing - characteristic header order"; flow:established,to_server; http.header_order; content:"User-Agent|0d 0a|Accept|0d 0a|Host"; nocase; threshold: type threshold, track by_src, count 10, seconds 60; classtype:attempted-user; sid:9000001; rev:1;)
```

The following detects unusually rapid sequential account lookups, a pattern consistent with account enumeration:

```
alert http $EXTERNAL_NET any -> $HOME_NET any (msg:"GOLEMTRUST Rapid sequential account enumeration"; flow:established,to_server; http.method; content:"GET"; http.uri; content:"/api/account/"; threshold: type threshold, track by_src, count 20, seconds 10; classtype:attempted-recon; sid:9000002; rev:1;)
```

Custom rule SIDs are in the 9000000 range to avoid conflicts with the ET Open rules. Add new custom rules from this range upwards.

Load the custom rules file by adding it to suricata-update's local rules configuration:

```
echo "rule-files:" >> /etc/suricata/update.yaml
echo "  - /etc/suricata/rules/golemtrust.rules" >> /etc/suricata/update.yaml
suricata-update
systemctl reload suricata-nsm
```

## Deploying Zeek script changes

After editing any Zeek script, test the syntax and redeploy:

```
zeekctl check
zeekctl deploy
```

`zeekctl check` validates the scripts without restarting Zeek. If it reports errors, fix them before running `deploy`. A Zeek deploy briefly stops and restarts the monitor; there is a short gap in logging during this period. Schedule deploys during low-traffic hours where possible.

## Testing custom detection

Test each new script or rule in the staging environment before deploying to production. Staging is a separate Zeek instance reading from a PCAP file rather than a live interface; Dr. Crucible maintains test PCAP files in `src/nsm-tests/pcaps/` in the internal repository.

To replay a PCAP against the current Zeek configuration:

```
zeek -r /path/to/test.pcap /opt/zeek/share/zeek/site/local.zeek
```

Inspect the resulting log files in the current directory. The `notice.log` should contain the expected notice if the script is working correctly.

For Suricata rule testing, use the `-r` flag to read from a PCAP:

```
suricata -r /path/to/test.pcap -c /etc/suricata/suricata.yaml -l /tmp/suricata-test/
cat /tmp/suricata-test/fast.log
```

Do not deploy untested rules to production. A rule that generates thousands of false positives against live traffic creates noise that masks genuine alerts.
