# Set up the display machine

The display machine shows the Gophish campaign dashboard to the room during the afternoon
session. This is the attacker view: live events as they occur across all active campaigns.

## Prerequisites

- Gophish installed and running on the VM.
- The display machine on the same network as the VM.
- Port 3333 on the VM firewalled to the display machine's IP address only.

## Steps

1. On the VM, confirm the firewall rule restricts port 3333 to the display machine's
   IP. On UFW:

   ```
   ufw allow from <display-machine-IP> to any port 3333
   ufw deny 3333
   ```

   Verify with `ufw status`.

2. On the display machine, open a browser and navigate to `http://<VM-IP>:3333`.
3. Log in to the Gophish admin interface.
4. Navigate to Campaigns.
5. Once the session campaigns are active, open the first campaign and select the
   Results tab.
6. The Results tab updates in real time without a page refresh.
7. Put the browser in full screen and project the display.

## During the session

If multiple participant campaigns are active simultaneously, open each campaign in a
separate browser tab and arrange them or cycle between them. Alternatively, stay on the
Campaigns list view, which shows a summary row per campaign including sent count, open
count, click count, and submitted data count, updating as events arrive.

The Campaigns list view is the more useful display when many campaigns are running
concurrently because it gives the room an overview across all participant efforts
simultaneously. Switch to individual campaign Results tabs during the debrief to examine
specific emails and events in detail.

## After the session

1. Export campaign results from each campaign before clearing data.
2. Delete all campaigns, templates, landing pages, and target groups from the Gophish
   instance.
3. Rotate the Gophish admin password.
4. If the sandbox domain was registered for this cohort, decommission it: remove DNS
   records, cancel the registration or let it expire, and confirm MX records are no
   longer resolving.
