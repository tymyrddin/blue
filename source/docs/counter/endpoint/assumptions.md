# Gaps in endpoint controls

Endpoint controls work within specific conditions. When those conditions are not met, a control may
continue to appear active while offering reduced or no protection. For example, these three controls are frequently
deployed with the specific condition unexamined.

## BYOVD and EDR visibility

Endpoint detection products instrument the kernel through callbacks: the operating system notifying
registered drivers when process creation, image loads, or memory operations occur. Remove the callbacks,
and the EDR continues running while receiving no events.

A signed vulnerable driver gives an attacker a path to remove those callbacks. The driver is a
legitimate, signed binary and passes every application control check that requires a valid signature.
The EDR's status UI shows no issue. From its perspective, nothing has changed.

Application control through publisher rules has an analogous gap. A WDAC policy that permits any
binary signed by "Microsoft Corporation" is necessary for Windows to function. It also permits certutil,
mshta, rundll32, regsvr32, wmic, and bitsadmin, all of which are Microsoft-signed and all of which
have established attacker use. Publisher rules stop unsigned payloads. They do not stop
living-off-the-land use of signed system binaries.

A more restrictive WDAC configuration supplements publisher rules with:
- Hash rules for specific high-risk binaries, locking them to known-good versions
- Path rules restricting execution from user-writable locations (AppData, temp directories)
- Explicit deny rules for LOLBins not required in the specific environment

When the EDR's kernel callbacks are removed, network telemetry and identity plane events remain
visible. Authentication logs, cloud API calls, and lateral movement still produce signals. Detection
shifts to those layers until the compromised host is isolated and reimaged.

HVCI (Hypervisor-Protected Code Integrity) prevents unsigned kernel drivers from loading, defeating
the BYOVD vector at the kernel level. Its performance overhead on older hardware is real and is
covered in [the operational cost of HVCI](../friction/hvci-overhead.md).

## Credential Guard prerequisites and workarounds

Credential Guard virtualises NTLM hashes and Kerberos tickets into a Virtualisation-Based Security
(VBS) enclave inaccessible to processes running in the normal OS context. Standard LSASS-reading
tools do not reach credentials on systems where Credential Guard is correctly running.

The prerequisites are: UEFI Secure Boot, a 64-bit CPU with virtualisation extensions, VBS enabled,
and Credential Guard enabled in the Local Security Authority configuration.

Where it silently fails:

Hypervisors without nested virtualisation: VMs on Hyper-V generation 1 configurations, some VMware
deployments, and cloud instances without nested virtualisation support cannot run VBS. Credential
Guard is unavailable on those guests. The Windows Security page may show partial or misleading status.

The WDigest re-enable path: an attacker with Local Administrator or SYSTEM access can set
`HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest\UseLogonCredential` to 1,
re-enabling cleartext credential caching. This works whenever VBS is not running, because the key
modifies LSASS behaviour. The change takes effect at the next user logon; no reboot is required.

Enforcement requires both Credential Guard enabled via Group Policy or MDM, and the WDigest registry
key protected against modification. Tamper Protection in Defender or a WDAC rule restricting registry
writes to that key path covers the latter.

When Credential Guard cannot be deployed (on VMs without VBS support, for example), Protected Process
Light (PPL) for LSASS raises the bar by requiring kernel-level access rather than userland process
access to read credentials. Kernel-level access produces louder events (driver loads, privilege
changes) that are detectable with Sysmon and the techniques in the BYOVD section.

## Application control in perpetual audit mode

WDAC in audit mode generates Event ID 3076 entries describing what would have been blocked. It does
not block anything. The purpose of audit mode is to produce a baseline for an exclusion list before
switching to enforce mode.

The transition to enforce mode requires a policy entry for every binary that audit mode would have
blocked and that has a legitimate use. In many environments, the list is longer than anticipated.
Line-of-business applications, vendor tools, update installers, diagnostics utilities, and
administrative scripts all appear in the audit log. Each requires a review and a policy decision.

The result: audit mode continues while the exclusion list is refined, the list is never complete
enough to switch confidently, and many deployments measure their time in audit mode in years.

What audit mode still provides: the audit events are actionable even without enforcement. A binary
executing from a user's AppData or temp directory appearing in the audit log is worth investigating
as a potential attacker payload, because those are the paths a dropped binary would use. Routing
3076 events into the SIEM and alerting on high-risk path patterns extracts detection value from a
control that has not reached its intended state.

Partial enforce mode on high-value targets provides meaningful protection regardless of workstation
policy. Domain controllers, certificate authorities, and backup infrastructure under enforce mode
raise the lateral movement cost significantly for most common attacker toolchains.
