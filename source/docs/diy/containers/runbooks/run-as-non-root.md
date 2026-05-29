# Run a container as non-root

Hardening runbook. Makes a container run as an unprivileged user rather than root, so that a process escaping the
container arrives on the host as a nobody rather than as root. It is the first confinement barrier;
the [container stack](../stack.md) covers how it layers with the rest.

## When to run

When building or deploying a container that currently runs as root, which is the default. As part of hardening any image
that runs a long-lived service. After a [container review](container-review.md) flags containers with `"User": ""`.

## What it does and does not do

A non-root container limits what an escape can do on the host: a process that breaks out lands as the unprivileged user,
not root. It does not close the escape path itself, and it does not help if the container is also `--privileged` or has
the Docker socket mounted. It is one layer, applied alongside dropped capabilities and a confinement profile.

## In the image

Add a non-root user in the Dockerfile and switch to it before the process starts:

```dockerfile
RUN useradd --system --uid 10001 --no-create-home appuser
USER appuser
```

A numeric UID (rather than only a name) lets the runtime enforce non-root even where the username is not resolvable. The
`USER` instruction applies to everything after it, including the container's default command.

## At runtime

For an image that cannot be rebuilt immediately, override the user at run time:

```
docker run --user 10001:10001 myimage
```

Or in Compose:

```yaml
services:
  app:
    user: "10001:10001"
```

## Risk

A process that binds a port below 1024, writes to a root-owned path, or installs packages at startup breaks when it
stops being root. The fixes are bounded: bind a high port inside the container and map it (`-p 80:8080`), `chown` the
writable paths to the new UID at build time, and move package installation into the build rather than the entrypoint.
Test the container starts and serves before rolling it out, since the failure shows up at startup.

## Verify

```
docker inspect --format '{{.Config.User}}' <container>
docker exec <container> id
```

The first should show the configured user, not empty. `id` from inside should report a non-zero uid and gid. Confirm the
application still starts, serves, and can write wherever it legitimately needs to.

## Done

The container runs as a non-zero UID. The application starts and functions. No root-owned write failures in the logs.
The image carries the `USER` instruction rather than relying on a run-time flag that a future deployment might omit.

## Rollback

Remove the `--user` flag or revert the `USER` instruction and rebuild to return to root, if a dependency turns out to
need it while the proper fix (chowning paths, remapping ports) is worked out. Running as root is the wider exposure, so
treat the rollback as temporary.

## Follow-up

- A non-root container still holds a broad set of Linux capabilities. Pair with [dropping capabilities](drop-capabilities.md).
- For defence against an escape regardless of user, combine with 
  [user namespace remapping at the daemon level](container-review.md) and a [confinement profile](seccomp-apparmor.md).
