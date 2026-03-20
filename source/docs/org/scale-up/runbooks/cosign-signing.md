# Cosign signing workflows

Runbook for signing container images with Cosign and verifying signatures before deployment. A signed image provides a cryptographic guarantee that the image was built by an authorised pipeline and has not been tampered with between build and deployment. The `totally-not-malware:latest` incident involved an unsigned image from an unverified source. Signed images cannot impersonate authorised builds.

## How signing works

Cosign attaches a signature to an image in the registry as an OCI artifact alongside the image manifest. The signature is created using a private key held by the build pipeline; verification uses the corresponding public key. Anyone with the public key can verify that a specific image was signed by the expected key holder.

Golem Trust uses keyless signing via Sigstore's Fulcio certificate authority for pipeline-produced images. Fulcio issues short-lived signing certificates tied to the pipeline's OIDC identity (its Gitea Actions token). The signature and certificate are stored in Sigstore's Rekor transparency log. This means no private key needs to be stored or managed; the signing authority is the pipeline's verified identity.

For images signed by humans (base image approvals, security exceptions), a long-lived key pair is used. The private key is stored in Vault.

## Installing Cosign

Install on CI/CD runner nodes and on developer workstations that need to verify signatures:

```
COSIGN_VERSION="2.4.0"
wget "https://github.com/sigstore/cosign/releases/download/v${COSIGN_VERSION}/cosign-linux-amd64"
mv cosign-linux-amd64 /usr/local/bin/cosign
chmod +x /usr/local/bin/cosign
```

## Keyless signing in CI/CD

Add a signing step to the build pipeline after the Trivy scan passes:

```
name: Build, scan, and sign

on:
  push:
    branches: [main]

jobs:
  build-sign:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build image
        run: |
          docker build -t registry.golemtrust.am/golemtrust-prod/${{ github.event.repository.name }}:${{ github.sha }} .

      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: registry.golemtrust.am/golemtrust-prod/${{ github.event.repository.name }}:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: 1

      - name: Login to Harbor
        uses: docker/login-action@v3
        with:
          registry: registry.golemtrust.am
          username: ${{ secrets.HARBOR_USERNAME }}
          password: ${{ secrets.HARBOR_PASSWORD }}

      - name: Push image
        run: docker push registry.golemtrust.am/golemtrust-prod/${{ github.event.repository.name }}:${{ github.sha }}

      - name: Sign image with Cosign
        run: |
          cosign sign \
            --yes \
            registry.golemtrust.am/golemtrust-prod/${{ github.event.repository.name }}:${{ github.sha }}
```

The `--yes` flag accepts the Sigstore terms of service. The `id-token: write` permission allows the pipeline to obtain an OIDC token from Gitea Actions, which Fulcio uses to issue the signing certificate.

The signature is pushed to the same Harbor registry alongside the image. Harbor stores OCI artifacts; Cosign signatures are compatible.

## Key-based signing for manual approvals

For base images and third-party images that are approved and signed manually, use a key pair stored in Vault.

Generate the key pair once:

```
cosign generate-key-pair
```

This creates `cosign.key` (private) and `cosign.pub` (public). Store the private key in Vault:

```
vault kv put kv/golemtrust/cosign \
  private_key="$(cat cosign.key)" \
  public_key="$(cat cosign.pub)"
rm cosign.key
```

Keep `cosign.pub` in the repository at `cosign/golemtrust.pub`. It is not a secret.

Sign a base image after Ludmilla has reviewed and approved it:

```
COSIGN_PRIVATE_KEY=$(vault kv get -field=private_key kv/golemtrust/cosign)
echo "$COSIGN_PRIVATE_KEY" > /tmp/cosign.key
cosign sign \
  --key /tmp/cosign.key \
  registry.golemtrust.am/base-images/debian:bookworm
rm /tmp/cosign.key
```

## Verifying signatures

Verify that an image was signed by the expected pipeline identity (keyless):

```
cosign verify \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp "https://github.com/golemtrust/.*" \
  registry.golemtrust.am/golemtrust-prod/keycloak-app:abc1234
```

Verify that an image was signed with the manual approval key:

```
cosign verify \
  --key cosign/golemtrust.pub \
  registry.golemtrust.am/base-images/debian:bookworm
```

A successful verification outputs the signature details and a `Verified OK` message. A failure means the image is unsigned, was signed by a different key, or has been tampered with since signing.

## Harbor content trust enforcement

Harbor can be configured to reject unsigned images on pull from the production project. This is already enabled in the project configuration (see the Harbor deployment runbook). When a user or pipeline attempts to pull an image from `golemtrust-prod` that has no valid Cosign signature, Harbor rejects the pull.

Test this by attempting to pull an unsigned image from the production project:

```
docker pull registry.golemtrust.am/golemtrust-prod/test-unsigned:latest
```

This should fail with a message indicating that the image does not have a valid signature.

## Key rotation

The manual signing key in Vault is rotated annually. To rotate:

1. Generate a new key pair: `cosign generate-key-pair`
2. Store the new private key in Vault alongside (not replacing) the old one, using a versioned path: `kv/golemtrust/cosign-2027`
3. Re-sign all images in `base-images` and `third-party` with the new key
4. Update the public key in the repository at `cosign/golemtrust.pub`
5. Update the admission controller policy (see the admission controller runbook) to trust the new public key
6. After confirming all images have been re-signed, remove the old Vault secret version
7. Delete the old public key file from the repository

Pipeline keyless signatures do not need rotation; they are issued per-build and expire automatically with Fulcio's certificate TTL.
