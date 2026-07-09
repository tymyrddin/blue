# Drop container capabilities

Hardening runbook. Strips the Linux capabilities a container does not need, so that even a root process inside it cannot perform privileged operations the application never uses. It is the second confinement barrier, beneath running as [non-root](run-as-non-root.md).

## When to run

When hardening a container, after the non-root change. On any container that runs with the default capability set, which is broader than most applications require. After a [container review](container-review.md) on a service whose needs are understood well enough to scope.

## The idea

Root's powers are divided into discrete capabilities (binding low ports, changing file ownership, loading kernel modules, and so on). A container keeps a default subset, most of which a typical application never touches. Dropping all of them and adding back only what the process needs leaves far less for a compromise to use, and is more precise than relying on the process user alone.

## Steps

Drop everything, then add back the specific capabilities the application requires:

```
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myimage
```

In Compose:

```yaml
services:
  app:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

The common ones an application might genuinely need: `NET_BIND_SERVICE` (bind a port below 1024), `CHOWN` and `SETUID`/`SETGID` (drop privileges at startup, common in web servers), `DAC_OVERRIDE` (bypass file permission checks, worth questioning). Most need none.

## Finding what is needed

The empirical route: drop all, start the container, and watch what fails. A capability-related failure shows up as a permission-denied or operation-not-permitted error at startup or first use. Add back the one the error points to, and repeat until the container runs cleanly. Starting from zero and adding upward gives a tighter result than starting from the default and removing.

## Risk

Dropping a capability the application relies on breaks it, usually at startup or on the first operation that needs the privilege. The failure is specific and the fix is to add that one capability back, so the iterate-from-empty approach is low-risk as long as it is done before deployment. `--cap-add` of a broad capability such as `SYS_ADMIN` undoes most of the benefit; treat a request for it as a sign to look closer at what the container is doing.

## Verify

```
docker inspect --format '{{.HostConfig.CapDrop}} {{.HostConfig.CapAdd}}' <container>
```

This should show `[ALL]` dropped and only the intended capabilities added. Confirm the application starts and performs its real work, including any operation that exercises an added-back capability.

## Done

The container drops `ALL` and adds back only a short, justified list. The application functions. No capability request broader than the specific operation it covers. The setting is in the image's Compose or run configuration.

## Rollback

Remove the `--cap-drop`/`--cap-add` flags to return to the default capability set while a missing capability is identified. The default is still narrower than `--privileged`, so a rollback is not a return to no confinement, but it is wider than the scoped set and worth closing again.

## Follow-up

- Capabilities limit privileged operations; a [seccomp or AppArmor profile](seccomp-apparmor.md) restricts the system calls and file access beneath them.
- Pair with [non-root](run-as-non-root.md); the two together are considerably tighter than either alone.
Last updated: 10 July 2026
