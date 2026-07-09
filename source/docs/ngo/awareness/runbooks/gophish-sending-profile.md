# Configure a Gophish sending profile

A sending profile tells Gophish how to deliver emails: which SMTP server to use and what
the From address should appear as to recipients.

## Prerequisites

- Gophish installed and running.
- A sandbox SMTP configuration: either a local Postfix instance on the VM, or credentials
  for the sandbox domain's mail service.

## Steps

1. Log in to the Gophish admin interface at `http://<VM-IP>:3333`.
2. Go to Sending Profiles > New Profile.
3. Enter a name that identifies the session cohort and date, for example
   `Session-2026-04-Finance`.
4. Set the From address to match the impersonation scenario for the session:
   a supplier name, a grant body, a management name, or a plausible system notification
   address. This is what participants see in the From field.
5. Set the Host to the SMTP server:
   - If using local Postfix on the same VM: `localhost:25`
   - If using the sandbox domain's external SMTP: the hostname and port provided by
     the mail service, for example `smtp.sandbox-domain.com:587`
6. Fill in Username and Password if the SMTP server requires authentication. Leave blank
   for local Postfix with no authentication.
7. Click Send Test Email. Enter a controlled inbox address and confirm the email arrives,
   the From address displays as expected, and the email is not filtered as spam.
8. Save the profile.

## Notes

Set up a separate sending profile for each impersonation scenario used in the session.
The From display name can be changed per campaign without creating a new profile, but
keeping profiles distinct by scenario makes reviewing campaign results easier.

If the session includes a QR code phishing demonstration, the From address matters less
than the email body design. Create a profile with a generic sender address for that
campaign type.
Last updated: 21 March 2026
