# GPS spoofing techniques

In the context of the IPA project — which explores digital safety for those facing surveillance, stalking, or harassment — GPS spoofing is a technique that deserves some attention. Especially if you're wondering how someone could "know" you were at the corner shop… when you weren't.

## What is GPS spoofing?

GPS spoofing is a way of faking your physical location by manipulating the signals your device uses to figure out where you are. It's a bit like convincing your phone that it's in Istanbul when you're really in Izmir. Instead of relying on satellites to give it accurate coordinates, your device is fed false information — on purpose.

There are two sides to GPS spoofing:

1. Spoofing yourself (defensive): This is when *you* use GPS spoofing to protect your privacy or stay safe. Survivors might use it to mislead a stalker who's tracking their phone location. Your phone reports you're somewhere safe — even if you’ve gone elsewhere. It’s not perfect, but it can buy time or peace of mind.
2. Spoofing others (offensive): More worryingly, attackers can also spoof GPS. For example, a stalker could trick a device into thinking it's in a trusted location to bypass alerts, or fake their own location to avoid detection. It's less common (requires more gear), but in the wrong hands, it’s not science fiction.

## How is it done?

Here’s a simple breakdown (no soldering iron required):

* Apps: Some mobile apps (especially on Android) can fake GPS location without needing tech wizardry. They’re legal, and often used by people who just want to play location-based games in peace. But they can also be used for less innocent purposes.
* Hardware spoofers: More advanced spoofers (think Raspberry Pi with the right radio module) can broadcast fake GPS signals in a small area. Your phone or tracker “listens” to the fake signal instead of the real satellite data. This takes a bit of effort, but it's out there — and cheap enough for hobbyists.
* Network-based trickery: Some attackers don’t spoof GPS directly, but fake Wi-Fi or mobile network signals to fool your device’s location estimation. It's sneakier, but it can still nudge your phone into reporting the wrong place.

## Why does it matter in the IPA project?

For the IPA project, which deals with intimate partner abuse and surveillance, GPS spoofing is part of the wider landscape of digital threats and defences:

* Survivors may use GPS spoofing to protect themselves — creating false trails or masking real movement.
* Abusers may abuse GPS spoofing to mislead, misinform, or hide.
* Advocates and tech experts must understand GPS spoofing so they can recognise it in the wild, spot suspicious location patterns, and better advise those at risk.

---

## How to spoof your location safely

*(For survivors, advocates, and allies)*

### On Android (simplest method)

1. Enable developer settings: Go to *Settings > About phone*. Tap *Build number* seven times. You’ll unlock *Developer Options* — no special skills required.
2. Install a GPS spoofing app: Go to the Play Store and search for something like “Fake GPS Location” or “GPS Emulator.” Choose one with good reviews and a sensible-looking interface.
3. Set it as your mock location app: Open *Settings > Developer Options*. Find *Select mock location app* and choose the one you just installed.
4. Choose a location to spoof: Open the app, move the pin to wherever you want to appear to be, and activate it. Your phone will now tell apps you’re in the fake location.
5. Check it’s working: Open Google Maps or a weather app to confirm it’s showing the spoofed location.

Note: Only spoof when necessary. If someone is monitoring your movements obsessively, sudden jumps across the country 
may prompt questions.

### On iPhone (much more limited)

Apple makes this deliberately difficult:

* Computer-based spoofing tools: Programmes like *iTools*, *iAnyGo*, or *Dr.Fone* can temporarily spoof your iPhone’s location when plugged into a computer. These are not free, but they’re legal and relatively simple.
* Jailbreaking: Not advised unless you particularly enjoy tech risk, broken updates, and malware.

Better approach: Use a spare Android phone or a PiRogue to carry out spoofing. Leave the iPhone behind, spoof your 
movements with the second device, and let the original appear stationary.

---

## How to spot spoofing used *against* you

*(For survivors and frontline workers)*

1. Strange or inconsistent location patterns: If someone’s device shows them jumping between distant places without explanation, or being in two places at once, spoofing may be involved.
2. Too-perfect alibis: If someone’s location always says “home” or “work,” regardless of circumstance, and they’re unusually keen on you knowing that — be suspicious.
3. Location tools giving conflicting data: If an app shows one location and your router or Wi-Fi logs suggest another, someone may be tampering with the signals.
4. Unusual equipment nearby: A Raspberry Pi with aerials, a USB device with flashing lights, or any unexplained tech could be part of a spoofing setup — particularly if it’s near devices being tracked.

If something seems off, treat the data as potentially false and look for supporting signs. Never rely solely on GPS data.

---

## How to spoof with a PiRogue or spare Android

*(For support workers, educators, or digital safety advocates)*

Option 1: Android device with spoofing app: Simple and fast. Follow the Android steps above on a secondary phone. 
This allows you to spoof without altering the survivor’s main phone.

Option 2: Raspberry Pi-based GPS spoofer: Requires more effort. A Pi with a GPS module and software-defined radio 
(SDR) can broadcast false satellite signals locally. Open-source tools like *gps-sdr-sim* can be used for controlled 
demonstrations.

Best reserved for workshops or research — not everyday use.

## A final word of caution

Spoofing isn’t a magic shield. Most phones, apps, and trackers aren’t designed with safety in mind — they’re designed 
with marketing and convenience in mind. That means spoofing can help, but it can also raise red flags if the person 
monitoring you is watching closely.

Use with care. Use with purpose. And never assume the map is the territory.
