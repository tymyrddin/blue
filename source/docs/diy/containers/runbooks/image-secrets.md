# Keep secrets out of images

Hardening runbook. Stops credentials from being baked into container images or exposed through environment variables, where anyone who can pull or inspect the image or container can read them. A secret in an image layer persists even after a later layer deletes it.

## When to run

When building any image that needs a credential at build or run time. When reviewing an existing image whose build history or environment is unknown. After a [container review](container-review.md) finds a secret in `docker history` or `docker inspect`.

## Where secrets leak

Three common places:

- Baked into a layer. A `COPY` of a key file or a secret passed to a `RUN` instruction stays in the image history. Deleting the file in a later layer does not remove it from the earlier one; `docker history` still reveals it.
- Build arguments. A secret passed with `--build-arg` is visible in `docker history` and in the build cache.
- Environment variables. A secret in `ENV`, or passed with `--env DB_PASSWORD=...`, is readable in `docker inspect` output and in `/proc/<pid>/environ` inside the container.

## Build-time secrets

For a credential needed only during the build (fetching a private dependency, say), use BuildKit's secret mount, which makes the secret available to one `RUN` without writing it into any layer:

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmtoken \
    NPM_TOKEN=$(cat /run/secrets/npmtoken) npm install
```

```
docker build --secret id=npmtoken,src=./npm_token.txt .
```

The secret is present during that step only and never lands in the image. A multi-stage build helps too: do the work needing the secret in an early stage and copy only the clean artefact into the final image.

## Run-time secrets

A running container reads its secret from a mounted file or a secrets manager. Docker Compose and Swarm mount secrets as files under `/run/secrets/`:

```yaml
services:
  app:
    secrets:
      - db_password
secrets:
  db_password:
    file: ./db_password.txt
```

The application reads `/run/secrets/db_password`. An external secrets manager (Vault, a cloud provider's secret store) adds rotation and access control that a mounted file does not.

## Keeping them out of the build context

A `.dockerignore` excluding `.env`, `*.pem`, `*.key`, and credential files keeps them out of the build context, so a stray `COPY . .` cannot pull them in:

```
.env
*.pem
*.key
secrets/
```

## Risk

A secret already built into a pushed image is exposed and stays exposed in that image's history; removing it from the Dockerfile does not unpublish it. Treat such a secret as compromised: rotate it (see [secret rotation](../../access/runbooks/secret-rotation.md)) and rebuild the image without it. Rebuilding alone, without rotating, leaves the old credential valid in every pulled copy.

## Verify

```
docker history --no-trunc <image> | grep -iE "password|secret|token|key|--build-arg"
docker inspect <container> | grep -iA5 '"Env"'
```

Neither should reveal a credential value. From inside the container, confirm secrets arrive as files under `/run/secrets/`:

```
docker exec <container> env | grep -iE "password|secret|token"
```

This should return nothing sensitive.

## Done

No secret in `docker history` or the build arguments. No credential in the container's environment. Run-time secrets arrive as mounted files or from a secrets manager. `.dockerignore` excludes credential files. Any secret previously baked into a pushed image has been rotated.

## Rollback

There is no safe rollback to embedding a secret. If a build breaks because a secret is no longer where the build expected it, fix the build to use the BuildKit secret mount or a multi-stage copy.

## Follow-up

- A discovered exposed secret feeds [secret rotation](../../access/runbooks/secret-rotation.md).
- Image hygiene pairs with the [container review](container-review.md), which scans existing images for both CVEs and secrets in history.
Last updated: 10 July 2026
