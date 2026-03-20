# eBPF configuration

Falco requires a driver to intercept system calls at the kernel level. Three driver types exist: a loadable kernel module (kmod), a legacy eBPF probe compiled per kernel version, and the modern eBPF probe which uses CO-RE (Compile Once, Run Everywhere) and requires no per-kernel compilation. Golem Trust uses the modern eBPF probe on all clusters. Dr. Crucible's preference is firm on this point: loading kernel modules on production nodes is not permitted, and the legacy eBPF probe's dependency on BTF symbol tables from a specific kernel build is fragile across Hetzner's kernel update cadence. The modern probe requires only that the running kernel was built with BTF support, which has been standard on Ubuntu since 5.15.

## Kernel requirements

The modern eBPF probe requires:

- Kernel version 5.8 or later (5.15 recommended; all Hetzner CX42 instances run 5.15 or newer)
- `CONFIG_BPF=y`, `CONFIG_BPF_SYSCALL=y`, `CONFIG_BPF_JIT=y` compiled into the kernel
- BTF (BPF Type Format) debug information available at `/sys/kernel/btf/vmlinux`

Verify BTF availability before deploying Falco on any new node type:

```
ls -lh /sys/kernel/btf/vmlinux
```

If the file is absent, the modern eBPF probe will not load. Check the kernel configuration:

```
grep CONFIG_DEBUG_INFO_BTF /boot/config-$(uname -r)
```

The expected output is `CONFIG_DEBUG_INFO_BTF=y`. If it is not set, the node's kernel does not support the modern probe and must be replaced or re-provisioned with a BTF-enabled image. Contact Ponder before attempting any kernel replacement on a production node.

## Comparing driver types

The three driver types differ in operational characteristics:

- kmod: loaded as a kernel module via `insmod`; fastest path; requires module signing if Secure Boot is enabled; Golem Trust does not permit this on production nodes
- legacy eBPF probe: compiled per kernel version using `falco-driver-loader`; depends on kernel headers or precompiled probes from the Falco repository; must be updated whenever the kernel is updated
- modern eBPF probe: uses CO-RE; no compilation; no kernel headers; works across kernel versions from 5.8 onwards; the only approved driver at Golem Trust

## Enabling the modern eBPF probe

In `falco-values.yaml`, set:

```
driver:
  kind: modern_ebpf
```

No additional parameters are required. The modern probe does not use `falco-driver-loader`; Falco loads it directly at startup using the BPF syscall.

If migrating from a legacy eBPF or kmod deployment, verify that no old probe files remain:

```
ls /root/.falco/
ls /etc/falco/
```

Remove any `.ko` or `.o` files left by previous driver-loader runs to avoid confusion during troubleshooting.

## Verifying the driver in use

After Falco starts, confirm which driver is active:

```
kubectl logs -n falco -l app.kubernetes.io/name=falco | grep -i driver
```

The expected line is:

```
Loading BPF probe (modern_ebpf)
```

Alternatively, check the kernel's loaded BPF programmes. On a worker node:

```
bpftool prog list | grep falco
```

This lists all BPF programmes loaded by Falco. If the list is empty but Falco reports it is running, the probe may have loaded and then been unloaded due to an error. Check `dmesg` for verifier failures.

## Troubleshooting eBPF probe loading failures

If Falco pods are crash-looping or logging probe load failures, work through the following checks.

Check dmesg for BPF verifier errors:

```
dmesg | tail -50 | grep -i bpf
```

A verifier error indicates that the kernel rejected the BPF programme. This is most commonly caused by a kernel that predates the modern probe's minimum requirements. Confirm the kernel version:

```
uname -r
```

If the kernel version is below 5.8, the node must be re-provisioned. On Hetzner, select the Ubuntu 22.04 LTS image, which ships with 5.15.

Check that `CONFIG_BPF_EVENTS` is enabled, as this is required for tracepoint attachment:

```
grep CONFIG_BPF_EVENTS /boot/config-$(uname -r)
```

If Falco logs `permission denied` when loading the probe, check that the DaemonSet is running with the required capabilities. The Helm chart sets these by default; confirm that no admission policy has stripped them:

```
kubectl get pod -n falco <pod-name> -o yaml | grep -A 10 securityContext
```

The pod requires `CAP_BPF`, `CAP_PERFMON`, and `CAP_SYS_RESOURCE` at a minimum. If Gatekeeper policies have blocked these capabilities, raise a temporary exception with Ludmilla before re-deploying.

## Running on Hetzner CX42 instances

Hetzner's Ubuntu 22.04 LTS images ship with a 5.15 kernel and full BTF support. No additional configuration is needed on freshly provisioned CX42 instances. Hetzner applies kernel updates through their standard image pipeline; after a node is re-provisioned with a newer kernel, verify BTF availability again as above before re-joining it to the cluster. Dr. Crucible runs this check as part of the node onboarding playbook in Ansible.
