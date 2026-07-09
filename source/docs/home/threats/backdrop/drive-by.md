# Drive-by downloads

A drive-by download delivers malware to a device through a web browser, without the user intentionally
downloading anything. The two variants differ in how much the user has to do.

## Authorised downloads

The user downloads and runs a file, but it is not what they thought it was. Common delivery mechanisms include
bundled installers, where a legitimate application includes additional software that was not prominently
disclosed; redirects to fake update pages; and file-sharing sites where the uploaded version has been replaced
or was never legitimate.

The user's action is genuine. The deception is in what the action was applied to.

## Unauthorised downloads

No user action is required beyond visiting a page. The malware is delivered via vulnerabilities in the browser
itself, in browser plugins, or in the page content. A site does not need to be malicious to be a delivery
vector: compromised advertising networks have served drive-by malware through entirely legitimate sites,
reaching visitors who would never have visited a known-bad destination.

This makes unpatched browsers a meaningful exposure. Browser vulnerabilities are actively traded and
exploited; the window between public disclosure and patch adoption is the period of highest risk.

## Aftermath

Outcomes range from adware and unwanted toolbars at the nuisance end to ransomware, spyware, and remote access
trojans at the serious end. The user may not notice anything immediately. Some malware is designed to be
persistent and quiet.

Ad-blockers reduce exposure by blocking the advertising networks that have historically distributed drive-by
malware. Browser updates, applied promptly, close the specific vulnerabilities that unauthorised variants exploit.
