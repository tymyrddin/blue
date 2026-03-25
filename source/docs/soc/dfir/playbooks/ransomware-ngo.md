# Ransomware response playbook (NGO, 20 staff)

## Trigger

Any of these means ransomware:
- Files suddenly have strange extensions (.locked, .encrypted, .crypt, random letters)
- Ransom note appears on screen or in folders (TXT, HTML, or image file)
- Can't open files that worked yesterday
- Desktop wallpaper changed to ransom demand
- Multiple staff report files becoming inaccessible

If you see any of these: STOP. Follow this playbook immediately.

## Immediate Actions (First 5 Minutes)

### 1. Don't panic, but move fast

Person who discovers it:
- Take a photo of the ransom note with your phone (don't copy/paste, don't touch files)
- Note the time you first noticed
- Shout for help (literally—get others' attention)

### 2. Disconnect everything

Everyone in the office:
- Unplug network cables from affected computers (pull them out)
- Turn off WiFi on affected laptops (airplane mode or switch off)
- DO NOT shut down computers yet—we may need forensics
- Stop others from logging in to shared drives or systems

Why: Ransomware spreads through networks. Isolation stops it spreading to more systems.

### 3. Alert the response team

Call these people immediately (in this order until someone answers):

1. IT Manager: \[Name] - \[Mobile] - \[Email]
2. Director: \[Name] - \[Mobile] - \[Email]
3. External IT Support: \[Company] - \[Phone] - \[Email]

Say: "We have ransomware. \[X] computers affected. Following the playbook. Need help now."

## Investigation (Next 30 Minutes)

IT Manager or External IT Support leads this:

### 4. Assess the damage

Walk around and check:
- How many computers are affected? (List them)
- Are servers affected? (Check if you can access shared drives)
- When did this start? (Check timestamps on ransom notes or encrypted files)
- Is it still spreading? (Are more files getting encrypted right now?)

Document everything: Write it down or type in a safe device (your phone, a clean laptop).

### 5. Check backups

Critical question: Do we have clean backups?

Check:
- When was the last backup? (Today? Yesterday? Last week?)
- Are backups physically disconnected or in separate cloud account? (If they're on the same network, they might be encrypted too)
- Can you access backups right now? (Test access, don't restore yet)

If backups are also encrypted or inaccessible: Note this. You're in a worse position but not hopeless.

### 6. Identify the ransomware (if possible)

- Take clear photos of ransom notes
- Note any file extensions or filenames
- [Check ID Ransomware](https://id-ransomware.malwarehunterteam.com/) if you can access internet safely
- Knowing the variant helps determine if decryption is possible

## Decisions (Within 1 Hour)

Director + IT Manager decide together:

### Decision 1: Do we have working backups?

YES - We have recent, clean, accessible backups:
→ Go to Recovery Plan A (restore from backup)
→ Do NOT pay ransom
→ Skip to Section: Recovery from Backup

NO - Backups are encrypted, missing, or too old:
→ Go to Recovery Plan B (damage control)
→ Consider whether to pay (but read warnings first)
→ Skip to Section: Recovery Without Backup

### Decision 2: Do we report this?

For NGOs with sensitive beneficiary data or operating in restricted environments:
- Consider safety implications of reporting (could it expose beneficiaries or partners?)
- Balance transparency against operational security
- Document your reasoning either way

Legal/regulatory obligations:
- If you process personal data (GDPR applies): likely need to report within 72 hours
- If you're in critical sector or have government contracts: check if mandatory reporting applies
- Document your assessment

Who to potentially notify:
- Data protection authority (if GDPR applies and personal data affected)
- Insurance company (if you have cyber insurance)
- Donors/partners (if their data affected)
- Law enforcement (optional in most jurisdictions, but can provide intelligence)

## Recovery Plan A: Restore from Backup

If you have good backups, follow these steps:

### 7. Isolate and clean infected systems

Before restoring anything:
- Keep infected computers offline and isolated
- Scan all other computers with antivirus (use free tools: Microsoft Defender, Malwarebytes)
- Change all passwords from a clean device (email, cloud services, admin accounts)
- Check for persistence (look for scheduled tasks, startup items, suspicious programs)

Consider: Rebuilding infected machines from scratch is safer than trying to clean them. Back up any critical files first (after scanning), then wipe and reinstall.

### 8. Restore from backup

In this order:
1. Servers first (if you have them)
2. Critical systems (whatever you absolutely need to operate)
3. Everyone else's computers

Test before going live:
- Restore to isolated system first
- Check files open properly
- Scan restored files for malware
- Only reconnect to network when clean

### 9. Verify and monitor

After restoration:
- Check file integrity (open documents, test systems)
- Monitor for 48 hours (is anything still acting weird?)
- Keep backups of the infected state (for forensics or insurance claims)

Expected downtime: 1-3 days depending on data volume and help available.

## Recovery Plan B: Without Working Backup

This is harder. You have limited options.

### 10. Assess what you've lost

Be honest about the damage:
- What data is encrypted?
- What's the impact if we never recover it?
- Do we have any copies anywhere else? (old laptops, personal devices, email attachments, cloud syncs)
- What's our worst-case scenario?

### 11. Check for free decryption tools

Some ransomware variants have known decryptions:
- [Check No More Ransom Project](https://www.nomoreransom.org/)
- Upload sample encrypted file and ransom note
- If decryptor exists, follow their instructions carefully

### 12. Consider paying ransom (carefully)

Before you even think about paying:

Arguments against:
- No guarantee you'll get your data back (many don't)
- Funds criminal activity
- May violate sanctions (some ransomware groups are sanctioned entities)
- You become a known payer (may be targeted again)
- Even if you get decryption key, files may be corrupted

Arguments for (rare cases only):
- Data is irreplaceable and critical to life-saving work
- No other recovery option exists
- Financial impact of loss exceeds ransom cost
- Legal and ethical considerations allow it

If you decide to pay:
- Consult legal counsel first (sanctions risk is real)
- Consider using professional negotiation/recovery service
- Document decision and rationale
- Expect this to take days and cost more than the initial demand
- Assume data may be sold/leaked anyway (many double-extort)

### 13. Rebuild from scratch

If you can't decrypt and won't pay:
- Wipe all infected systems completely
- Reinstall operating systems from scratch
- Restore what you can from partial backups, cloud services, old devices
- Recreate what you can't recover
- Accept the data loss and document lessons learned

Expected downtime: 1-2 weeks or more, depending on extent of loss.

## Communication

### Internal

To all staff (within 4 hours):
```
Subject: Security Incident - Ransomware

We've experienced a ransomware attack affecting [X] systems.

Current status: [Contained/Under investigation/Recovering]

What you need to do:
- Don't access shared drives until cleared
- Change your passwords immediately (email, cloud services)
- Report any suspicious files or behaviour
- Don't click links or open attachments unless verified

Next update: [time]

Questions: Contact [Name]
```

### External (if required)

To donors/partners (within 24 hours if their data affected):
```
Subject: Security Incident Notification

We're writing to inform you of a security incident that occurred on [date].

What happened: Ransomware attack affecting [brief description]

What data was affected: [Specific description if known, or "under investigation"]

What we're doing: [Containment, recovery, investigation]

What you should do: [Specific actions if any, or "no action required"]

Questions: [Contact]
```

Keep it factual. Don't speculate. Update as you learn more.

## Prevention (after recovery)

Once you're back online, fix these immediately:

### Critical fixes (do this week)

1. Backup properly:
   - Daily backups of all critical data
   - One copy offsite or in separate cloud account
   - Test restores monthly (actually try restoring, don't just check that backup ran)

2. Email security:
   - Block .exe, .zip, .js, .vbs attachments
   - Enable warning banners on external emails
   - Train everyone on phishing (show examples)

3. Updates:
   - Turn on automatic updates for Windows
   - Update all software (especially web browsers)
   - Replace anything you can't update

4. Access control:
   - Remove admin rights from daily-use accounts
   - Implement MFA on email and cloud services
   - Review who has access to what

### Important fixes (do this month)

5. Endpoint protection:
   - Install and maintain good antivirus (Windows Defender is fine, just keep it on)
   - Enable ransomware protection in Windows Security

6. Network segmentation:
   - Guest WiFi separate from work WiFi
   - Servers isolated if you have them

7. Monitoring:
   - Log and review login attempts
   - Monitor for suspicious file activity
   - Set up alerts for mass file changes

### Document what happened

- Timeline of attack and response
- What worked and what didn't
- Total cost (downtime, recovery, lost productivity)
- Changes implemented
- Share lessons with peer organisations

## Key contacts

Fill this in and print it out. Keep a copy at home.

| Role                    | Name | Mobile | Email | Backup Person |
|-------------------------|------|--------|-------|---------------|
| IT Manager              |      |        |       |               |
| Director                |      |        |       |               |
| External IT Support     |      |        |       |               |
| Insurance Provider      |      |        |       |               |
| Legal Counsel           |      |        |       |               |
| Data Protection Contact |      |        |       |               |

## Emergency services
- Police (non-emergency): \[local number]
- Cyber crime reporting: \[national cyber centre]

## Useful resources
- [No More Ransom](https://www.nomoreransom.org/)
- [ID Ransomware](https://id-ransomware.malwarehunterteam.com/)
- [Have I Been Pwned](https://haveibeenpwned.com/)

## Version control playbook

Current Version: 1.0  
Last Updated: \[Date]  
Next Review: \[Date in 6 months]  
Owner: \[Name]

Update this playbook after:
- Any ransomware incident (within 1 week)
- Staff changes affecting key contacts
- IT system changes (new backup system, new tools)
- Every 6 months minimum

## Notes

This playbook assumes:
- Limited IT resources (one part-time person or external support)
- No complex infrastructure (no domain controllers, limited servers)
- Priority is getting back to work, not forensic perfection
- Operation in environments where reporting may have safety implications

If you have more resources: Get professional incident response help. This playbook is for "we are on our own and 
need to act now" situations.

```{raw} html
<div class="page-post-card__link">
    <a href="https://tymyrddin.dev/contact/">
      See something you like? Let’s create your custom playbook.
    </a>
</div>
```
