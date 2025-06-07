# On-prem/Alternative clouds (Hetzner, OVH, etc.) lock-in assessments  

## Lock-in risks  

- Custom APIs:  
  - Hetzner Cloud API (e.g., for dedicated servers)  
  - Proprietary networking (e.g., OVH vRack)  
- Managed Services:  
  - Hetzner Kubernetes (custom CNI/load balancers)  
  - Storage solutions (e.g., Ceph-based but with unique management)  
- Data Gravity:  
  - No egress fees, but physical migration is slow.  

## How to check for lock-in  

1. Inventory: Manually review VM templates, network configs.  
1. API Audit: Check for `hcloud-go` (Hetzner SDK) or `ovh-python`.  
1. Portability Test: Export VMs to QCOW2/OVA and test in other clouds.  

## Mitigation strategies  

- Use Kubernetes (vanilla, not managed) for portability.  
- Avoid proprietary storage; use Ceph/MinIO for S3 compatibility.  
- Keep backups in open formats (SQL dumps, CSV, Parquet).  
