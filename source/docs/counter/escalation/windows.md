# Windows privilege escalation

The divide between limited user access and administrative control on Windows runs through
two distinct mechanisms: User Account Control, which manages the transition between medium
and high integrity within an interactive session, and Windows access tokens, which the
operating system uses to enforce permissions on every process, thread, and object access.
Both are surfaces for escalation, and both are commonly misread.

## UAC bypass

User Account Control is not a security boundary in the way a trust boundary or a privilege
separation is. Microsoft's documentation acknowledges this explicitly: UAC's purpose is to
reduce the attack surface for accidental or casual privilege use, not to prevent determined
privilege escalation by code already running as the interactive user. An attacker who has
code execution as a standard user account can, in the default configuration, elevate
without triggering a UAC prompt by exploiting the auto-elevation mechanism.

Auto-elevation is a feature. Certain Windows binaries are marked in their manifests to
auto-elevate without displaying a consent prompt. When one of these binaries launches
another process, that child inherits the elevated token. The bypass technique is to make
an auto-elevated binary execute attacker-controlled code before it reaches its intended
behaviour.

The three most commonly observed patterns:

fodhelper.exe reads `HKCU\Software\Classes\ms-settings\shell\open\command` before
launching. Since HKCU is user-writable without elevation, writing this key before running
fodhelper causes the auto-elevated process to execute the attacker-specified command at
high integrity.

sdclt.exe follows a similar pattern, reading
`HKCU\Software\Classes\Folder\shell\open\command` as part of its backup UI. The same
write-before-launch approach applies.

eventvwr.exe reads `HKCU\Software\Classes\mscfile\shell\open\command`. One of the older
patterns, documented publicly since around 2016 and still observed in post-compromise
activity because the underlying mechanism remains unchanged.

None of these represent vulnerabilities in the specific binaries. They are outcomes of
two design decisions meeting each other: trusted binaries that auto-elevate, and a
user-writable registry hive those binaries consult at startup. Patching one registry
path leaves equivalent paths available through other auto-elevated processes.

COM elevation moniker abuse is a related technique. COM objects registered for elevation
via `Elevation:Administrator!new:` in their ProgID run at high integrity when instantiated.
Methods exposed by those objects that write to the filesystem or registry can be called from
medium integrity, with the write executing at high integrity.

Detection sits in two places: the registry write and the process tree. A write to HKCU
under one of the known key paths, followed within seconds by the launch of an auto-elevated
binary from the same session, is the staging pattern. In the process tree, a high-integrity
process descending from a medium-integrity parent is anomalous outside an explicit UAC
consent dialog.

## Token impersonation

Every Windows process carries an access token recording the user identity, group
memberships, and privileges that apply to that process. When a process creates a child
process or opens a handle to a securable object, the kernel uses the calling process's
token for the access check.

Impersonation is a deliberate feature of the token model. A service can temporarily adopt
a client's identity for the duration of a named pipe transaction or an RPC call. The
kernel enforces this via impersonation levels ranging from anonymous (no identity
information) through identification (can check identity but not use it for access checks)
to impersonation and delegation.

SeImpersonatePrivilege enables a process to impersonate up to delegation level. Windows
grants it by default to a specific set of service identities: NT AUTHORITY\SYSTEM, Local
Service, Network Service, and service accounts running under IIS application pool
identities, SQL Server, and similar service frameworks. The intent is to allow services
to handle requests on behalf of connecting clients without running the entire service as
a privileged account.

The attack path is direct. A process holding SeImpersonatePrivilege can create a named
pipe server or trigger a COM activation that causes a higher-privileged account, typically
SYSTEM, to connect as a client. Once the higher-privileged token is available to the server
process, impersonation followed by CreateProcessWithTokenW produces a new process running
as SYSTEM.

The Potato family implements this pattern with variations in how the higher-privileged
token is coerced into connecting:

Rotten Potato and Juicy Potato use DCOM activation. A COM object registered to run as
SYSTEM is activated through the local RPC endpoint, which routes through a loopback
connection the attacker controls. Juicy Potato variants select different CLSID values
because the COM objects available to activate vary by Windows version and installed
software.

PrintSpoofer exploits the Windows print spooler's use of named pipes. The spooler, which
runs as SYSTEM, connects to a pipe path that includes the session ID; an attacker can
influence the path and substitute a controlled pipe, causing the spooler to connect and
exposing its token for impersonation.

RoguePotato uses a cross-session variation, redirecting the DCOM activation through a
localhost proxy to handle cases where session boundaries prevent the standard Juicy Potato
CLSID approach from succeeding.

All of these require SeImpersonatePrivilege as a precondition. An interactive shell or
injected code running as a service account holding this privilege is the entry condition. The privilege is commonly present
precisely because the compromised service was running under an account the framework
chose for convenience.
Last updated: 10 July 2026
