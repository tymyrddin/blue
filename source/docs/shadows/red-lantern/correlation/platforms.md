# Correlation in different platforms

## Introduction

Much like the Clacks system connecting disparate parts of the Disc, security correlation engines connect seemingly 
unrelated events to reveal the truth lurking beneath. When dealing with BGP hijacking attempts, one must be as 
vigilant as a City Watch constable on Hogswatch Eve, correlating multiple signals to spot the villainy before it's 
too late.

The following examples demonstrate how various platforms can correlate events from our BGP simulator scenarios, 
where attackers attempt route hijacking through fraudulent ROA creation and prefix announcements.

## Wazuh correlation rules (for comparison)

Wazuh employs rules that trigger upon patterns emerging from the chaos.

### Example: Detecting fraudulent ROA publication

```xml
<group name="bgp,rpki,attack">
  <rule id="100001" level="5">
    <decoded_as>bgp-rpki</decoded_as>
    <match>ROA creation request</match>
    <description>ROA creation request detected</description>
  </rule>

  <rule id="100002" level="10">
    <if_sid>100001</if_sid>
    <match>FRAUDULENT</match>
    <description>Fraudulent ROA creation attempt detected!</description>
  </rule>

  <rule id="100003" level="12">
    <if_sid>100002</if_sid>
    <match>ROA published.*arin repository</match>
    <time>0-3600</time>
    <description>Fraudulent ROA successfully published - attack in progress</description>
    <group>attack_success,pci_dss_10.6.1</group>
  </rule>

  <rule id="100004" level="14">
    <if_sid>100003</if_sid>
    <regex>Validator sync.*sees 203.0.113.0/24 as valid</regex>
    <frequency>2</frequency>
    <timeframe>300</timeframe>
    <description>Multiple validators accepting fraudulent ROA - widespread propagation</description>
    <group>critical,attack_propagation</group>
  </rule>
</group>
```

This correlation chain tracks the progression from initial ROA request (as seen at `00:02:00` in playbook2) through 
publication (`00:40:00`) and finally validator acceptance (`00:45:00-00:47:00`).

### Example: Suspicious login preceding ROA request

```xml
<group name="bgp,access_control">
  <rule id="100010" level="3">
    <decoded_as>tacacs</decoded_as>
    <match>login from</match>
    <description>TACACS login detected</description>
  </rule>

  <rule id="100011" level="8">
    <if_sid>100010</if_sid>
    <match>login from 185.220.101</match>
    <description>Login from suspicious Tor exit node range</description>
  </rule>

  <rule id="100012" level="12">
    <if_sid>100011</if_sid>
    <match>ROA creation request</match>
    <same_source_ip/>
    <timeframe>300</timeframe>
    <description>ROA request immediately following suspicious login - probable account compromise</description>
    <group>credential_theft,initial_access</group>
  </rule>
</group>
```

This detects the pattern in playbook2 where a login from `185.220.101.45` (a known Tor exit) at `00:01:00` precedes a 
fraudulent ROA request at `00:02:00`.

## Splunk correlation searches

Splunk's approach resembles Igor's methodical cataloguing of body parts, collecting everything and finding patterns 
through search.

### Example: ROA lifecycle tracking

```
index=bgp sourcetype=rpki 
| transaction prefix maxspan=2h 
    startswith="ROA creation request" 
    endswith="Validator sync"
| eval attack_duration=duration/60
| search "FRAUDULENT" OR "origin AS64513"
| eval attack_stages=mvcount(split(_raw, "\n"))
| where attack_stages >= 4
| table _time prefix origin_as attack_duration attack_stages
| sort -attack_duration
```

This search assembles the complete attack timeline, tracking how long it takes for a fraudulent ROA to propagate 
through the system (approximately 45 minutes in our playbook2 scenario).

### Example: Validator consensus analysis

```
index=bgp sourcetype=rpki "Validator sync"
| rex field=_raw "Validator sync: (?<validator>\w+) sees (?<prefix>[\d\.\/]+)"
| stats dc(validator) as validator_count values(validator) as validators by prefix
| where validator_count >= 3
| eval consensus="widespread"
| join type=left prefix 
    [search index=bgp "FRAUDULENT ROA" 
    | fields prefix]
| fillnull value="unknown" FRAUDULENT
| table prefix validators validator_count consensus FRAUDULENT
```

This correlates validator acceptance (as seen at `00:45:00-00:47:00` in playbook2) to determine whether a ROA has 
achieved dangerous consensus across the RPKI ecosystem.

### Example: Regional validation disparity detection

```
index=bgp "Validation test"
| rex field=_raw "Validation test (?<region>\w+):.*Announcement (?<prefix>[\d\.\/]+) AS(?<asn>\d+) - peer (?<result>\w+)"
| stats values(result) as results dc(result) as result_variety by prefix region
| where result_variety > 1 OR results="rejected"
| table prefix region results
| eval concern_level=case(
    results="rejected", "high",
    result_variety>1, "medium",
    1=1, "low"
)
```

This catches the curious scenario in playbook3 where AMER rejects, EMEA accepts, and APAC shows mixed results for the 
same prefix at `00:51:00-00:53:00`, suggesting configuration inconsistencies that attackers might exploit.

## Elastic aggregations and transforms

Elastic's approach is rather like the Bursar's mathematical approach to reality, though considerably more lucid.

### Example: Transform for ROA attack detection

```json
{
  "transform_id": "bgp-roa-attack-detection",
  "source": {
    "index": ["bgp-logs-*"],
    "query": {
      "bool": {
        "should": [
          {"match": {"message": "ROA creation request"}},
          {"match": {"message": "ROA published"}},
          {"match": {"message": "Validator sync"}},
          {"match": {"message": "FRAUDULENT"}}
        ]
      }
    }
  },
  "dest": {
    "index": "bgp-roa-attack-summary"
  },
  "pivot": {
    "group_by": {
      "prefix": {
        "terms": {"field": "bgp.prefix.keyword"}
      },
      "origin_as": {
        "terms": {"field": "bgp.origin_as.keyword"}
      },
      "time_bucket": {
        "date_histogram": {
          "field": "@timestamp",
          "fixed_interval": "1h"
        }
      }
    },
    "aggregations": {
      "event_count": {"value_count": {"field": "@timestamp"}},
      "fraudulent_indicators": {
        "filter": {"match": {"message": "FRAUDULENT"}}
      },
      "validator_acceptance": {
        "filter": {"match": {"message": "Validator sync"}}
      },
      "unique_validators": {
        "cardinality": {"field": "validator.keyword"}
      },
      "attack_progression_score": {
        "bucket_script": {
          "buckets_path": {
            "fraudulent": "fraudulent_indicators._count",
            "validators": "unique_validators",
            "events": "event_count"
          },
          "script": "(params.fraudulent * 10) + (params.validators * 5) + params.events"
        }
      }
    }
  },
  "frequency": "5m",
  "sync": {
    "time": {
      "field": "@timestamp",
      "delay": "60s"
    }
  }
}
```

### Example: Aggregation for prefix hijacking timeline

`POST /bgp-logs-*/_search`

```json
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        {"range": {"@timestamp": {"gte": "now-2h"}}},
        {"terms": {"bgp.prefix.keyword": ["203.0.113.0/24", "198.51.100.0/24"]}}
      ]
    }
  },
  "aggs": {
    "prefix_timeline": {
      "terms": {"field": "bgp.prefix.keyword"},
      "aggs": {
        "events_over_time": {
          "date_histogram": {
            "field": "@timestamp",
            "fixed_interval": "5m"
          },
          "aggs": {
            "event_types": {
              "terms": {"field": "event.type.keyword"}
            },
            "has_fraudulent": {
              "filter": {"match": {"message": "FRAUDULENT"}}
            },
            "roa_stages": {
              "terms": {"field": "rpki.stage.keyword"}
            }
          }
        },
        "attack_indicators": {
          "filters": {
            "filters": {
              "suspicious_login": {"match": {"message": "login from 185.220.101"}},
              "fraudulent_roa": {"match": {"message": "FRAUDULENT"}},
              "roa_published": {"match": {"message": "ROA published"}},
              "validator_sync": {"match": {"message": "Validator sync"}}
            }
          }
        }
      }
    }
  }
}
```

## Custom correlation engines

Sometimes one must build one's own contraption, like Leonard of Quirm designing a particularly elaborate monitoring device.

## Conclusion

Whether one employs Wazuh's rule-based approach, Splunk's search prowess, Elastic's aggregation wizardry, or constructs 
a bespoke correlation engine, the principle remains the same: connect the dots before the villain gets away with the 
silverware. In the case of BGP hijacking, those dots might be a suspicious login from a Tor exit node, followed by a 
fraudulent ROA request, culminating in widespread validator acceptance of a hijacked prefix.

The key is to correlate events across time, looking for sequences that form a coherent attack narrative. As 
Commander Vimes often observes, one suspicious event is just that, but three suspicious events in sequence is 
a conspiracy worth investigating.

The clacks may be faster, but correlation is what keeps the messages meaningful.

*"It's still magic even if you know how it's done." — Terry Pratchett, A Hat Full of Sky*