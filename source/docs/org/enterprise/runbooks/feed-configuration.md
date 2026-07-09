# Feed configuration

A threat intelligence platform with no feeds is a very organised way of knowing nothing. Dr. Crucible's first priority after deploying MISP was establishing a reliable set of inbound data sources, covering both the broad commercial and open intelligence landscape and the specific threats relevant to Ankh-Morpork's business community. This runbook covers adding and configuring each feed source, the pull schedule, and monitoring feed health.

## Adding feeds in MISP

Navigate to `Sync Actions`, `Feeds`, then click `Add Feed`. Each feed requires a name, URL, feed format, and schedule. Feeds that require authentication store their credentials in Vaultwarden; fetch them before beginning this procedure.

## CIRCL OSINT feed

The Computer Incident Response Centre Luxembourg publishes MISP-format feeds covering a wide range of indicators. This is the highest-quality free feed available and should be the first configured.

```
Name: CIRCL OSINT Feed
URL: https://www.circl.lu/doc/misp/feed-osint/
Feed type: MISP
Input source: Network
Authentication method: None (public feed)
Enabled: Yes
Caching enabled: Yes
```

After adding, enable caching to allow Graylog's lookup table adapter to query locally. The cached data is stored in MISP's Redis instance and refreshed with each pull.

## AlienVault OTX

AlienVault's Open Threat Exchange provides community-contributed indicator data. An API key is required.

Retrieve the OTX API key from Vault:

```
vault kv get secret/misp/feed-credentials/alienvault-otx
```

In MISP:

```
Name: AlienVault OTX
URL: https://otx.alienvault.com/api/v1/pulses/subscribed
Feed type: CSV
CSV headers: indicator,type,title,description
Authentication method: HTTP headers
Header: X-OTX-API-KEY: ${OTX_API_KEY}
Enabled: Yes
Pull interval: Every 6 hours
```

The 6-hour pull interval balances freshness against OTX's rate limits. Pull more frequently only if there is an active incident requiring updated OTX data.

## Abuse.ch feeds

Abuse.ch publishes several free threat intelligence feeds. No authentication is required.

Malware hash feed (MalwareBazaar):

```
Name: Abuse.ch MalwareBazaar
URL: https://bazaar.abuse.ch/export/csv/recent/
Feed type: CSV
CSV headers: sha256_hash,sha1_hash,md5_hash,file_type,file_size,signature,tags,reporter
Authentication method: None
Enabled: Yes
Pull interval: Every hour
```

URLhaus (malicious URLs):

```
Name: Abuse.ch URLhaus
URL: https://urlhaus.abuse.ch/downloads/csv_recent/
Feed type: CSV
CSV headers: id,dateadded,url,url_status,last_online,threat,tags,urlhaus_link,reporter
Authentication method: None
Enabled: Yes
Pull interval: Every hour
```

The hourly pull interval is appropriate for both feeds, as Abuse.ch publishes new indicators continuously and the data volume per pull is manageable. Staleness beyond one hour is unacceptable for active C2 URL detection.

## Circle Sea ISAC (TAXII 2.1)

The Circle Sea Information Sharing and Analysis Centre provides intelligence from Ankh-Morpork's business community via a TAXII 2.1 server. This is the most operationally relevant feed for Golem Trust, as it contains indicators observed by peer organisations in the same sector and geography.

Retrieve the TAXII credentials from Vaultwarden under the entry "Circle Sea ISAC TAXII":

```
Username: golemtrust-member
Password: (see Vaultwarden)
TAXII URL: https://taxii.circlesea-isac.am/taxii2/
Collection: ankhmorpork-financial
```

In MISP, TAXII 2.1 feeds are configured via the `Feed type: TAXII` option:

```
Name: Circle Sea ISAC
URL: https://taxii.circlesea-isac.am/taxii2/collections/ankhmorpork-financial/objects/
Feed type: TAXII
Authentication method: Basic
Username: golemtrust-member
Password: (from Vaultwarden)
Enabled: Yes
Pull interval: Every 6 hours
```

The Circle Sea ISAC feed has stricter TLP handling than public feeds. All events received from this feed are imported with their source TLP markings preserved. Re-distribution outside of Circle Sea ISAC member organisations requires the information sharing procedures described in the information sharing runbook.

## Guild-specific feed: Assassins' Guild attacker profiles

The Assassins' Guild operates a private MISP instance containing anonymised attacker profiles, primarily of parties who have attempted to target the Guild's systems or those of its clients. As a contracted service provider, Golem Trust is authorised to receive this feed via MISP-to-MISP synchronisation.

Configure the sync connection in `Sync Actions`, `Servers`, `Add Server`:

```
Name: Assassins Guild Intel
Base URL: https://misp.assassins-guild.am
Authkey: (stored in Vault at secret/misp/sync-keys/assassins-guild)
Pull enabled: Yes
Push enabled: No
Organisations to pull from: Assassins Guild
Tag filter: tlp:white, tlp:green, tlp:amber
Self-signed allowed: No (Vault PKI certificate expected)
```

Pull only; Golem Trust does not push to the Guild's MISP instance. The Guild's feed is pulled every 12 hours. Events from this feed must not be redistributed outside Golem Trust without explicit written permission from Lord Downey's liaison. They are tagged with a `do-not-redistribute` local tag automatically by a MISP event handler.

## Pull schedule and staggering

To avoid simultaneous large downloads saturating the network link, pull schedules are staggered across the hour:

```
:00 - CIRCL OSINT feed (largest dataset, first in the hour)
:15 - AlienVault OTX (every 6 hours: at 00:15, 06:15, 12:15, 18:15)
:30 - Abuse.ch MalwareBazaar
:45 - Abuse.ch URLhaus
:00 - Circle Sea ISAC (every 6 hours, aligned to CIRCL OSINT)
:30 - Assassins Guild (every 12 hours: at 00:30, 12:30)
```

MISP's feed scheduler is configured via `Administration`, `Server Settings`, `Workers`. Confirm the workers are running:

```
docker exec misp-misp-1 /var/www/MISP/app/Console/cake Admin getWorkers
```

All feed-related workers should show status `running`. If a worker is not running, restart it:

```
docker exec misp-misp-1 /var/www/MISP/app/Console/cake Admin startWorker feed
```

## Monitoring feed health

Feed pull results are visible in `Sync Actions`, `Feeds`, where the last pull time and status are shown for each feed. A feed that has not pulled successfully within twice its scheduled interval is considered unhealthy.

Check feed health via the MISP API:

```
curl -s https://misp.golemtrust.am/feeds/index \
  -H "Authorization: ${MISP_API_KEY}" \
  -H "Accept: application/json" \
  | python3 -c "
import json, sys
feeds = json.load(sys.stdin)
for f in feeds:
    print(f['Feed']['name'], '|', f['Feed']['last_pulled'])
"
```

Angua reviews feed health weekly as part of her Monday threat intelligence review. Feed failures are investigated within 24 hours; a feed that has been failing for more than 48 hours is escalated to Dr. Crucible for diagnosis.
Last updated: 10 July 2026
