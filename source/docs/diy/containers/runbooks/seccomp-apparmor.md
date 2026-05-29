# Apply seccomp and AppArmor profiles

Hardening runbook. Restricts the system calls a container can make (seccomp) and the files and operations it can reach (
AppArmor, or SELinux on RHEL-family hosts), so that a compromised process is confined regardless of its user or
capabilities. These are the deepest confinement layer; the [container stack](../stack.md) shows where they sit.

## When to run

When hardening a container, after [non-root](run-as-non-root.md) and [dropping capabilities](drop-capabilities.md). On a
service whose behaviour is stable enough to profile without constant breakage. The default profiles apply automatically;
this runbook is about tightening beyond them.

## What is already on

Docker applies a default seccomp profile that blocks around 44 dangerous system calls, and a default AppArmor profile (
`docker-default`) covering basic restrictions. These hold unless switched off, which is part of why `--privileged` (
which disables both) is such a step backwards. Tightening means a profile scoped to the specific application, not the
generic default.

## Seccomp

A custom seccomp profile is a JSON file listing the syscalls to allow. Apply it at run time:

```
docker run --security-opt seccomp=/path/to/profile.json myimage
```

Building the profile from scratch is involved; the practical route is to start from Docker's default profile and remove
syscall groups the application demonstrably does not use, or to generate one by recording the container's syscalls under
normal load with a tool such as `oci-seccomp-bpf-hook` and using the result as the allow-list.

## AppArmor

On Debian and Ubuntu hosts, load a profile into the kernel and apply it:

```
sudo apparmor_parser -r -W /etc/apparmor.d/containers/myapp
docker run --security-opt apparmor=myapp myimage
```

The profile names the paths the container may read and write and the operations it may perform. On RHEL-family hosts the
equivalent is SELinux, applied with `--security-opt label=...`; the host's mandatory-access-control system determines
which applies.

## Risk

A profile tighter than the application's real behaviour blocks a syscall or a file access it needs, and the container
crashes or misbehaves, often intermittently rather than cleanly at startup. Develop the profile in a non-enforcing mode
first: AppArmor's complain mode logs violations without blocking (`aa-complain`), and a seccomp profile can be trialled
with the action set to log rather than kill. Run the application through its real workload in that mode, collect the
violations, widen the profile to cover legitimate behaviour, and only then switch to enforce. Switching straight to a
tight enforcing profile on a live service is the way to a 2 a.m. crash that is hard to trace.

## Verify

```
docker inspect --format '{{.AppArmorProfile}} {{.HostConfig.SecurityOpt}}' <container>
```

This should show the named profile rather than `docker-default` or empty. With AppArmor in enforce mode, confirm a
denied operation is logged (`/var/log/syslog` or `dmesg` shows `apparmor="DENIED"`), and confirm the application runs
through its normal workload without tripping a denial.

## Done

The container runs under a named, application-specific seccomp or MAC profile rather than only the default. The profile
was developed in complain/log mode and shows no violations from legitimate behaviour. The application functions under
enforce mode. `--privileged` is not in use anywhere that would disable these.

## Rollback

Switch back to the default profile (`--security-opt apparmor=docker-default`, or remove the custom seccomp flag) to
restore the baseline confinement while a too-tight profile is widened. The default is still meaningful protection, so
rollback returns to the baseline rather than to nothing. Do not roll back to `--security-opt seccomp=unconfined` except
as a last-resort diagnostic, since that removes the layer entirely.

## Follow-up

- These profiles are the layer that still holds if [non-root](run-as-non-root.md)
  and [dropped capabilities](drop-capabilities.md) are bypassed; the three together are the confinement set.
- A compromised container that was running unconfined is a candidate
  for [the first hour](../../incidents/first-hour.md).
