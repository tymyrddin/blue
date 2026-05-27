Where the container meets the host
==================================

A container is not a virtual machine. It shares the host kernel, which means the
attack surface of a containerised workload extends to the kernel itself. Kubernetes
adds a control plane: the API server, etcd, and the RBAC model that governs what
each workload can request from the cluster around it.

The hardening problem splits in two. Inside the container: what capabilities the
process holds, what filesystem access it has, what syscalls it can make. Outside
the container: what the service account can request from the API server, what
network paths are open, and whether the admission layer enforces constraints before
the workload starts.

Detection follows the same split. Runtime anomalies are visible through kernel
instrumentation. Control plane anomalies appear in the Kubernetes API server audit
log. An attacker who exploits a pod but makes no API calls appears only in runtime
telemetry; an attacker moving through the API server using a stolen service account
token may produce no runtime anomalies at all.

.. toctree::
   :maxdepth: 1
   :includehidden:

   hardening.md
   detection.md
   runbooks/index


.. raw:: html

        <div class="page__article">
            <div class="page-post-card__link">
                <a href="https://tymyrddin.dev/contact/">Cross the boundary</a>
            </div>
        </div>
