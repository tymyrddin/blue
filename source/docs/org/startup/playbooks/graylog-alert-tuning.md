# Alert tuning

Playbook for managing false positives, enabling GeoIP lookups, and iterating on alert conditions over time. An alert that fires too often is ignored; an alert that never fires is useless. Angua reviews alert performance monthly. This runbook covers the mechanisms she uses.

## GeoIP lookup configuration

The source country alert relies on Graylog enriching log messages with the country of origin for each source IP. Enable GeoIP lookup in Graylog as follows.

Download the MaxMind GeoLite2 City database. A free account at MaxMind is required:

```
mkdir -p /etc/graylog/server/geoip
wget -O /tmp/GeoLite2-City.mmdb.tar.gz \
  "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=<key>&suffix=tar.gz"
tar xzf /tmp/GeoLite2-City.mmdb.tar.gz --strip-components=1 -C /etc/graylog/server/geoip
chown -R graylog:graylog /etc/graylog/server/geoip
```

The MaxMind licence key is stored in Vaultwarden under the Infrastructure collection. The database should be updated monthly; MaxMind provides a download link that includes the licence key. Add to cron on `graylog-1`:

```
0 5 1 * * wget -q -O /etc/graylog/server/geoip/GeoLite2-City.mmdb.tar.gz \
  "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=<key>&suffix=tar.gz" \
  && tar xzf /etc/graylog/server/geoip/GeoLite2-City.mmdb.tar.gz \
     --strip-components=1 -C /etc/graylog/server/geoip
```

In Graylog, navigate to System, then Configurations, then Message Processors. Enable the `GeoIP Resolver` processor and configure the path to `/etc/graylog/server/geoip/GeoLite2-City.mmdb`. Set the source field to `client_ip`. After enabling, new incoming messages will have `gl2_remote_ip_country`, `gl2_remote_ip_city`, and `gl2_remote_ip_coordinates` fields populated.

## Reviewing alert history

Navigate to Alerts, then Alert and Event Search. Filter by the last 30 days. Export to CSV for monthly review.

For each alert, note:

- How often it fired
- Whether the events were genuine security concerns or false positives
- Whether any genuine events were missed (a harder question; requires reviewing raw logs)

Bring this to the monthly security review. Angua chairs it. Carrot attends. Dr. Crucible attends if he is not teaching.

## Adjusting thresholds

To change a threshold, navigate to Alerts, then Event Definitions, click the alert, and edit the condition. Common adjustments:

Lowering a threshold (more sensitive): do this if genuine attacks are going undetected. Accept that false positives may increase temporarily while the new threshold is validated.

Raising a threshold (less sensitive): do this if a rule is firing on benign activity. Before raising, understand why the benign activity matches the rule. It may be that the rule needs a better query rather than a higher threshold.

Increasing the grace period: do this if repeated alerts for the same event are creating noise. The grace period suppresses re-alerting within its window; set it long enough to cover the typical duration of the triggering behaviour.

Do not disable an alert to silence it. If a rule is wrong, fix the rule. A disabled alert is silent until someone re-enables it, which may not happen before the next incident.

## Managing false positives with suppression

For known benign patterns that regularly match alert conditions, add suppression rules. Graylog does not have a native suppression mechanism; use query exclusions in the alert condition instead.

Example: the source country alert was firing for a legitimate integration that connects from a Netherlands IP (a payment processor). Add an exclusion to the search query:

```
NOT gl2_remote_ip_country:(GB DE NL AT CH AM) AND NOT client_ip:198.51.100.42
```

Alternatively, add the Netherlands (`NL`) to the allowed country list if the payment processor relationship is stable. Document the reason in the alert description field.

Maintain a record of suppressed patterns. If a suppressed IP later becomes a source of actual attacks, the suppression is a problem. Review suppressions quarterly and remove any that are no longer needed.

## Adding new alert conditions

New conditions should follow the pattern established by the initial ruleset:

1. Write a search query in the Graylog Search interface and verify it returns the expected events
2. Determine whether the condition is filter-based (any matching event triggers the alert) or aggregation-based (a count or rate triggers the alert)
3. Set the time range and evaluation interval conservatively at first; tighten them after confirming the rule behaves correctly
4. Run the rule in a silent mode for one week if possible (create it with no notifications attached, review it manually each day, then add notifications once the false positive rate is understood)
5. Document the intent of the rule in the description field: what attack or anomaly is it detecting, and what response is expected

Angua reviews all new alert conditions before they are assigned notifications. Send her the Graylog event definition ID and a brief explanation of what prompted the rule.

## After a missed detection

If an attack or anomaly was not detected by existing alerts, conduct a brief post-detection analysis:

1. Identify the log patterns that were present during the attack
2. Determine whether a rule could have matched those patterns
3. If yes: write the rule. If no: identify what additional logging or data enrichment would have made a rule possible, and implement that first.
4. Do not write a rule so specific that it only catches the exact technique used in the incident. Write for the class of technique.

The Seamstresses' Guild attacker used curl. The rule Angua wrote looks for scripted user agents broadly, not curl specifically. The attacker returned a week later using a different tool. The rule caught them anyway.
