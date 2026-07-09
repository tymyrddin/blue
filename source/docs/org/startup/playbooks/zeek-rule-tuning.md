# Rule tuning

Playbook for managing false positives in Zeek notices and Suricata alerts, and for iterating on detection coverage over time. Detection without tuning is a fire alarm that goes off when someone makes toast. Angua leads tuning reviews; Ludmilla handles the Suricata rule adjustments.

## The baseline period

During the first two weeks after deploying Zeek and Suricata on a new environment, do not connect alerting to notification channels. Observe the output directly. The goal is to understand what normal traffic looks like before declaring anything abnormal.

Keep a log of recurring false positives during this period. At the end of two weeks, categorise them:

- Benign traffic from known systems: suppress with threshold rules or exclusions
- Legitimate behaviour that looks suspicious: document what it is and why it matches, then decide whether to exclude or accept the noise
- Genuine anomalies: investigate further

The compromised developer workstation at Golem Trust was discovered two days into the baseline period because the beaconing pattern stood out against clean traffic. Baselines work.

## Suppressing Suricata false positives

Suricata suppressions prevent specific rule matches from generating alerts without disabling the rule entirely. This is preferable to disabling a rule when the false positive is traffic-specific rather than rule-specific.

Create or edit `/etc/suricata/threshold.conf`:

```
# Suppress ET scan alerts from the internal vulnerability scanner
# Vulnerability scanner: 10.0.3.5
suppress gen_id 1, sig_id 2009582, track by_src, ip 10.0.3.5

# Threshold: only alert on DNS anomalies from external IPs more than 5 times in 60 seconds
# Reduces noise from legitimate high-volume DNS resolvers
threshold gen_id 1, sig_id 2017918, type threshold, track by_src, count 5, seconds 60
```

The `sig_id` is the Suricata rule SID. Find it in the alert's `eve.json` output as `alert.signature_id`. The `gen_id` is always 1 for standard Suricata rules.

After editing `threshold.conf`, reload Suricata:

```
systemctl reload suricata-nsm
```

Thresholds take effect immediately without a full restart.

## Disabling Suricata rules

Use `suricata-update` to manage disabled rules. This ensures disabled rules are not re-enabled automatically when rules are updated.

Add to `/etc/suricata/disable.conf`:

```
# Disable by SID
1:2009582

# Disable by regex match on rule content
re:ET WEB_SERVER Possible CVE-2009-1151
```

Then rebuild the rule set:

```
suricata-update --disable-conf /etc/suricata/disable.conf
systemctl reload suricata-nsm
```

Document every disabled rule in a comment in `disable.conf` explaining why it was disabled and when the decision was made. Rules are sometimes disabled because the detection is wrong for the environment; they are sometimes disabled because the service being detected is legitimately in use. Knowing which is which matters when that service is later decommissioned.

## Tuning Zeek scripts

Zeek notice thresholds and detection windows are set as constants in the scripts. To adjust the beacon detection thresholds, edit the relevant values in `/opt/zeek/share/zeek/site/golemtrust/beacon-detection.zeek` and redeploy:

```
zeekctl deploy
```

Zeek does not support hot-reloading of scripts. Every change requires a brief detection gap during the deploy. Keep deploys to low-traffic windows.

For the beacon detection script specifically, the variance threshold (currently 100.0) and the minimum connection count (currently 5) are the most commonly adjusted values. After the first month of operation, review the notice log for beacon detection notices and check each one:

- Was it a real beacon? Mark it as confirmed or benign in the incident log.
- If benign: was it a known internal tool (monitoring agents, keepalive connections)? Add the source IP to an exclusion list in the script.
- If confirmed: treat it as an incident.

## Reviewing Zeek's weird.log

Zeek's `weird.log` records protocol anomalies that do not rise to the level of a notice. It is not alarmed but should be reviewed weekly. Common entries:

`bad_HTTP_request`: a request that does not conform to HTTP specification. Can indicate a scanning tool, a buggy client, or exploitation attempts.

`connection_reset_during_key_exchange`: a TLS handshake that was reset before completing. Common during port scanning. High volumes from a single source warrant investigation.

`unknown_protocol`: traffic on a port Zeek cannot identify by protocol. Could be a legitimate custom protocol or tunnelled traffic.

Filter the weird log to non-localhost traffic and sort by frequency:

```
zeek-cut name id.orig_h id.resp_h < /opt/zeek/logs/current/weird.log \
  | sort | uniq -c | sort -rn | head -30
```

Items at the top of this list that are not explained by known infrastructure should be investigated.

## Monthly tuning review

At the start of each month, Angua and Ludmilla review the following:

1. Total alert volume for the previous month, broken down by rule SID and Zeek notice type
2. Confirmed true positives and confirmed false positives from the incident log
3. Rules with zero matches in the previous month (possibly outdated or broken)
4. New ET Open rules added in the previous month's update that may need local tuning

Rules with zero matches over three consecutive months should be reviewed. They may be detecting a threat that simply has not manifested in the environment, which is fine. Or they may be mis-configured and silently broken. Test them with a PCAP replay (see the custom script development runbook) to confirm they would fire if the relevant traffic appeared.

The output of the monthly review is a short note in the internal wiki: what changed, why, and what was observed. This record is useful context when an incident eventually occurs, because it shows which detection capability was in place at what time.
