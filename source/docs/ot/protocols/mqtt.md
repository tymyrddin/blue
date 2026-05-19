# MQTT

![MQTT](/_static/images/protocol-mqtt.png)

The thing the diagram is really showing is decoupling. A publisher knows the broker address and a topic string, nothing
else. It never learns who is listening, or whether anyone is. A subscriber is symmetric: it knows the broker and a topic
filter. You can add the alarm service later without touching either sensor, which is the property that makes MQTT spread
well across telemetry estates. Both sides are just clients; the broker is the only component that has to be reachable by
everyone.

A few mechanisms sit underneath that and do not show up in an architecture sketch. Quality of service is per message: 0
is fire-and-forget, 1 guarantees delivery but can duplicate, 2 guarantees exactly once at the cost of a four-step
handshake. A retained message is the broker holding the last value on a topic, so a subscriber that connects late gets
current state immediately rather than waiting for the next publish. Last Will and Testament is a message the client
registers at connect time and the broker publishes on its behalf if the connection drops unexpectedly, which is how
subscribers learn a sensor has gone quiet. Keep-alive pings keep that liveness detection honest.

![MQTT message exchange](/_static/images/protocol-mqtt2.png)

Read down the page and the broker is in every single exchange. There is no packet that goes publisher to subscriber. 
A client opens with CONNECT and waits for CONNACK before anything else; the subscriber then registers a topic filter 
with SUBSCRIBE and is told it took with SUBACK. Only once a publisher has its own session does its PUBLISH go up to the 
broker, and the broker re-publishes that message as a fresh PUBLISH to each subscriber whose filter matches.

The part the sequence makes visible, more than the architecture sketch did, is that the two PUBACKs are unrelated to 
each other. The first acknowledges the hop from publisher to broker. The second acknowledges the separate hop from 
broker to subscriber. QoS is negotiated per hop, not end to end, so a publisher posting at QoS 1 has a guarantee that 
its message reached the broker and no guarantee at all about what happened after that. A subscriber can even hold a 
lower QoS on its subscription than the publisher used, and the broker downgrades the delivery. 

For anyone reasoning about delivery assurance on an OT bus, the broker is the seam: assurance stops and restarts there.
Two things left off to keep it readable. Keep-alive is a periodic PINGREQ and PINGRESP on an otherwise idle connection, 
which is what lets the broker notice a silent client and fire its Last Will. And a clean shutdown sends DISCONNECT, 
where a client that simply vanishes does not, which is the difference that decides whether the will message goes out.

## The MQTT start

MQTT (Message Queuing Telemetry Transport) was designed in 1999 by Andy Stanford-Clark at IBM and Arlen Nipper at Arcom
for satellite-linked SCADA monitoring of oil pipelines. The design constraints were extreme: low bandwidth, high
latency, unreliable links, and battery-powered field devices. The protocol is small, binary, and publish-subscribe 
rather than request-response. OASIS standardised it in 2013 as v3.1.1; v5 followed in 2019.

Those same properties that made it suitable for satellite SCADA have made it the dominant messaging protocol for IIoT
edge-to-cloud connectivity. Condition monitoring sensors, energy meters, building environmental sensors, and edge
gateways all use MQTT to push telemetry to brokers in the cloud or on the plant LAN. It appears in AWS IoT Core, Azure
IoT Hub, and most IIoT platform stacks. A modern manufacturing facility may run Modbus or Profinet on the process
network and MQTT on the edge layer sitting above it.

## The broker model

MQTT is brokered publish-subscribe. Devices publish messages to topics on a broker; other devices or applications
subscribe to those topics and receive the messages. Topics are hierarchical strings: `factory/line1/robot3/temperature`
is a valid topic. The broker routes published messages to all matching subscribers.

Two wildcard characters extend the subscription model. A `+` matches a single level: `factory/+/robot3/temperature`
matches `factory/line1/robot3/temperature` and `factory/line2/robot3/temperature`. A `#` matches all remaining levels:
`factory/#` matches everything published under the `factory/` prefix, including arbitrarily deep subtopics.

QoS levels control delivery guarantees. QoS 0 delivers at most once with no acknowledgement. QoS 1 delivers at least
once with an acknowledgement that may result in duplicates. QoS 2 delivers exactly once using a four-step handshake.
Most IIoT telemetry uses QoS 0 or 1; control commands more often use QoS 1 or 2.

Retained messages allow a broker to store the most recent message on a topic and deliver it immediately to new
subscribers. Last Will and Testament (LWT) allows a client to register a message the broker publishes on its behalf if
the client disconnects unexpectedly, which provides a mechanism for detecting device failures.

## Authentication and the default gap

MQTT v3.1.1 includes username and password fields in the CONNECT packet, but their use is optional. A broker may accept
connections without credentials. Many do, by default. Mosquitto, the most widely deployed open-source MQTT broker,
ships with `allow_anonymous true` in its default configuration.

The password, when provided, travels in the CONNECT packet as a binary field without any encoding. Without TLS, it is
cleartext on the wire. A device on the same network segment as an unencrypted MQTT connection sees the credentials in
the first packet of the session.

MQTT v5 introduced an enhanced authentication mechanism using AUTH packets, allowing challenge-response flows and
external authentication schemes. It does not mandate authentication; the mechanism is available, and a broker that does
not require it will still accept unauthenticated connections from clients that do not offer credentials.

## The open broker

An unauthenticated connection to an MQTT broker with a `#` subscription receives every message published on
the broker. The mosquitto client tools, available on any Linux system, make this a one-command operation:

```bash
# Subscribe to all topics — no credential, no session to open
mosquitto_sub -h 10.0.0.50 -p 1883 -t '#' -v

# Publish to a command topic — same access
mosquitto_pub -h 10.0.0.50 -p 1883 -t 'factory/line1/conveyor/cmd' -m 'STOP'
```

On an IIoT deployment where sensor telemetry, alarm states, and process measurements flow through the same
broker, the `#` subscription is a complete read of the operational picture.

Publishing to command topics is the write side of the same problem. IIoT deployments frequently separate
telemetry topics from command topics, but the separation is by convention rather than enforcement unless the
broker's access control list explicitly restricts which clients can publish to which topics.

Retained messages extend the exposure window. Sensitive state, authentication tokens passed as payloads, or
device configuration published as a retained message persists on the broker until explicitly cleared. A
subscriber connecting weeks after the original publication receives it.

Internet exposure is more common for MQTT than for most OT protocols. Shodan consistently indexes tens of
thousands of open MQTT brokers, some carrying identifiable industrial telemetry.

## Sparkplug B

Sparkplug B, originally developed by Cirrus Link Solutions and now maintained by the Eclipse Foundation, defines a
structured payload format and topic namespace for OT use on top of MQTT. Topics follow the scheme
`spBv1.0/[group]/[message_type]/[edge_node]/[device]`, and message types include birth certificates (device
registration), data updates, and commands. The DCMD and NCMD message types carry commands from host applications to
devices.

Sparkplug B addresses the semantic layer: it provides a defined structure for what flows over MQTT in an OT context.
It does not add authentication or encryption beyond whatever MQTT provides. The ACL design benefit is real, because the
structured topic namespace makes it straightforward to restrict which clients can publish to command topics and which
can only publish to data topics.

## Broker hardening and topic control

Broker configuration is the most accessible control. Two lines in `/etc/mosquitto/mosquitto.conf` close
unauthenticated access and enforce TLS in one step:

```
allow_anonymous false
listener 8883
cafile   /etc/mosquitto/ca.crt
certfile /etc/mosquitto/server.crt
keyfile  /etc/mosquitto/server.key
```

Topic-level ACL restricts which authenticated clients can publish or subscribe to which topics:

```
# /etc/mosquitto/acl
user sensor-line1
topic read factory/line1/#
topic write factory/line1/+/telemetry

user orchestrator
topic readwrite factory/+/+/cmd
```

A temperature sensor configured this way cannot subscribe to command topics or publish to anything outside
its own telemetry path. The Sparkplug B topic structure makes the ACL easier to write because the topic
hierarchy encodes the role of each message type directly.

Network placement is the structural control for existing deployments where broker reconfiguration is
constrained. Placing the plant-side broker on the OT network segment, accessible only from edge devices and
the data transfer layer in the DMZ, limits who can reach it. The cloud-side broker warrants stricter
authentication controls because it is reachable from the internet by design.

Monitoring for unexpected publishers, wildcard subscriptions, and command topic activity from outside the
expected orchestration layer provides detection. MQTT brokers log connection events and publish/subscribe
activity; forwarding those logs covers the visibility gap that most IIoT deployments leave open.

## Related

- [BACnet](bacnet.md): building automation protocol with a comparable default-open profile and similar
  internet exposure via Shodan
- [HART-IP](hart-ip.md): field instrument access protocol; both MQTT and HART-IP appear on Shodan for
  internet-exposed OT/IIoT infrastructure
- [MQTT specification](https://mqtt.org): OASIS standard; v3.1.1 and v5 specifications published here
- [Eclipse Mosquitto](https://mosquitto.org): open-source MQTT broker; configuration reference for
  `allow_anonymous`, TLS, and ACL settings
- [Shodan: port 1883](https://www.shodan.io/search?query=port%3A1883): internet-exposed MQTT brokers
