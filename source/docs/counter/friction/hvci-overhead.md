# HVCI and performance overhead

Hypervisor-Protected Code Integrity prevents unsigned code from running in kernel mode. It defeats
BYOVD (Bring Your Own Vulnerable Driver) attacks, which have appeared in ransomware deployments
and nation-state operations. HVCI is among the most effective endpoint controls available against
this class of attack.

Its cost: between 5% and 25% overhead on workloads that make intensive use of kernel operations,
on hardware that does not support MBEC (Mode-Based Execution Control). MBEC is supported on processors with 
hardware virtualisation extensions introduced around 2017 to 2019; check the Windows Hardware Compatibility Program or 
the device vendor for a
specific system. On older hardware, the hypervisor cannot
distinguish user-mode from kernel-mode execution at the page level, and enforces protection with
software inspection that adds overhead proportional to kernel call frequency.

On server workloads (database engines, storage controllers, network appliances with kernel bypass
networking), the overhead can reach a level that requires additional hardware capacity. On developer
workstations with virtualisation-heavy workflows, it may cause noticeable performance changes.

The deployment pattern this produces: HVCI on all workstations where the BYOVD risk is highest and
the performance impact is acceptable; HVCI on servers where workloads permit; explicit policy
exceptions for servers where the overhead would require reprovisioning. The exceptions are the
remaining attack surface.

One additional condition: Memory Integrity (the Windows UI name for HVCI) can be disabled via
registry on systems where it is not enforced through hardware or through a policy that prevents
the registry write. An attacker with local administrator access can disable it. Effective deployment
requires enforcement through Secure Boot and a mechanism that prevents the registry modification.
Last updated: 12 June 2026
