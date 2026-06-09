# OS credential stores and memory extraction

Three credential stores attract the most attention: LSASS process memory, the SAM registry
hive, and the Active Directory database file NTDS.dit. Each has a different extraction path
and a different detection surface.

## LSASS

The Local Security Authority Subsystem Service holds plaintext credentials and NTLM hashes
in memory for currently and recently authenticated accounts. On older systems or with legacy
authentication settings, WDigest authentication leaves plaintext passwords in memory; on
modern Windows with WDigest disabled, NTLM hashes and Kerberos tickets remain.

Common extraction techniques:

- Direct memory reads via the Windows process access API, as used by Mimikatz
  (`sekurlsa::logonpasswords`)
- ProcDump creating a minidump of lsass.exe, which can be parsed offline
- The comsvcs.dll MiniDump technique, invoking a system DLL via rundll32 to avoid
  third-party tooling signatures
- Task Manager's "Create dump file" option, which produces a usable dump without any
  additional tooling

Detection surface: Sysmon Event 10 (ProcessAccess) captures the source process, target
process, and the access rights requested. A process opening lsass.exe with VM_READ access
that is not a recognised security product, WER, or system component is the primary
indicator. The GrantedAccess mask and CallTrace fields narrow the determination: Mimikatz
and similar tools request characteristic access masks, and the call trace shows whether a
known credential-dumping DLL appears in the call chain.

Mitigations:

- Credential Guard moves credential material into an isolated VM using Virtualisation-Based
  Security (VBS). LSA runs in a separate trust level; direct memory reads of the credential
  store are no longer possible from the host OS. Available on Windows 10 and Server 2016
  and later.
- Protected Process Light (RunAsPPL) configures lsass.exe as a protected process. Processes
  without a matching signing level cannot open it with read access. Enabled via a registry
  value; takes effect after a reboot.
- Disabling WDigest authentication (`HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest,
  UseLogonCredential = 0`) removes plaintext credential caching on systems where the default
  has not already changed.

## SAM

The Security Account Manager hive at `HKLM\SAM` stores hashed credentials for local accounts.
The SYSTEM hive at `HKLM\SYSTEM` contains the boot key used to derive the encryption key for
the SAM hashes; both are needed for offline extraction.

The SAM hive is locked while Windows is running but can be exported using `reg save HKLM\SAM`
by an account with SeBackupPrivilege (administrators hold this by default). Volume shadow
copies also expose the SAM hive from the snapshot path without the live-lock restriction.

Detection surface: registry key access auditing on `HKLM\SAM` and `HKLM\SECURITY` produces
Event 4663 (object access). Processes other than lsass.exe, svchost, and the backup service
requesting access to these keys are unusual. Command line auditing (or Sysmon Event 1) also
catches `reg save HKLM\SAM` and `reg save HKLM\SYSTEM` as explicit extraction commands.

## NTDS.dit

The Active Directory database at `%SystemRoot%\NTDS\ntds.dit` on domain controllers holds
credential hashes for all domain accounts. It is the highest-value credential store in a
Windows environment: extraction provides offline cracking material for every domain account.

The file is locked by the directory service during normal operation. Common extraction paths:

- Volume shadow copy: create a snapshot, then copy ntds.dit from the snapshot path where
  the lock does not apply
- `ntdsutil activate instance ntds` followed by `ifm create full`: the built-in AD backup
  utility, which produces an offline copy of the database
- `esentutl /y` or `robocopy` from a VSS snapshot path

The SYSTEM hive is also needed alongside the database file.

Detection surface: process creation events for vssadmin, ntdsutil, wbadmin, and esentutl on
a domain controller are worth reviewing in any window. File access auditing on the NTDS
directory produces Event 4663 when the database file is opened by a process other than
lsass.exe. The VSS creation events appear in the System log (Event 8193 from VSS provider,
or Event 7 from Sysmon) and in process creation logs.

Dcsync, which replicates credential hashes over the directory replication protocol without
touching the file, is covered in the Active Directory section.

## Limiting the blast radius

Detection tells you a dump happened; key design decides how much it was worth. A scoped key
hierarchy, in which one compromised secret does not decrypt the rest, is built in
[key hierarchy design](../../org/enterprise/runbooks/key-hierarchy-design.md).
