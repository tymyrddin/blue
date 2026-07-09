# ADCS certificate template hunt

Hypothesis: certificate template misconfigurations allow an attacker to request a
certificate authenticating as a privileged account.

Two phases: enumerate templates in Active Directory to identify ESC1-vulnerable
configurations, then review CA issuance events for certificates where an unprivileged
requester specified a Subject Alternative Name identifying a different account.

Data sources: Active Directory LDAP (certificate template objects); CA Security event log
(`Event ID 4887`) on the Certificate Authority server; requires CA audit logging enabled
("Issue and manage certificate requests" in the CA Auditing tab).

```powershell
# Phase 1: identify ESC1-vulnerable certificate templates

Import-Module ActiveDirectory

$configNC      = (Get-ADRootDSE).configurationNamingContext
$templateBase  = "CN=Certificate Templates,CN=Public Key Services,CN=Services,$configNC"
$clientAuthEKU = '1.3.6.1.5.5.7.3.2'

Get-ADObject -SearchBase $templateBase -Filter * -Properties @(
    'msPKI-Certificate-Name-Flag',
    'pKIExtendedKeyUsage',
    'msPKI-RA-Signature'
) | Where-Object {
    # CT_FLAG_ENROLLEE_SUPPLIES_SUBJECT: bit 0x1 in msPKI-Certificate-Name-Flag
    ($_.'msPKI-Certificate-Name-Flag' -band 0x1) -and
    ($_.pKIExtendedKeyUsage -contains $clientAuthEKU) -and
    ($_.'msPKI-RA-Signature' -eq 0)
} | Select-Object Name, 'msPKI-Certificate-Name-Flag', pKIExtendedKeyUsage |
    Sort-Object Name
```

A template appearing in this output has all three ESC1 conditions in its current
configuration: the enrolling user can supply an arbitrary SAN, the certificate supports
client authentication, and no manager approval is required. Any domain user able to enrol
in the template can request a certificate for any principal.

The query does not check enrolment permissions. A template may restrict enrolment to
specific groups, limiting exposure to those members. Reviewing the template's
`nTSecurityDescriptor` for enrolment rights, or running `certutil -v -template TEMPLATE_NAME`
on the CA server, identifies who can enrol.

```powershell
# Phase 2: CA event log hunt for anomalous SAN values in issued certificates

$startTime = (Get-Date).AddDays(-7)

Get-WinEvent -ComputerName CA_SERVER -FilterHashtable @{
    LogName   = 'Security'
    Id        = 4887
    StartTime = $startTime
} | ForEach-Object {
    $xml  = [xml]$_.ToXml()
    $data = $xml.Event.EventData.Data

    $requester  = ($data | Where-Object Name -eq 'Requester').'#text'
    $attributes = ($data | Where-Object Name -eq 'Attributes').'#text'
    $requestId  = ($data | Where-Object Name -eq 'RequestId').'#text'

    # CertificateTemplateName is not a separate Event 4887 field; it appears in Attributes
    $template = if ($attributes -match '(?i)CertificateTemplate:([^\r\n]+)') {
        $Matches[1].Trim()
    } else { '' }

    # SAN passed as a request attribute; format: san:upn=account@domain
    if ($attributes -notmatch '(?i)san:') { return }

    [PSCustomObject]@{
        Time       = $_.TimeCreated
        Requester  = $requester
        Template   = $template
        Attributes = $attributes
        RequestId  = $requestId
    }
} | Sort-Object Time
```

In the output, compare the Requester value against the SAN UPN in the Attributes field.
A requester identifying as a standard user account and a SAN UPN identifying a Domain
Admin or other privileged account is the ESC1 exploitation signature. The RequestId
identifies the certificate in the CA database; `certutil -view -restrict "RequestID=ID"` on
the CA server retrieves the full certificate for further review.

The "san:" check covers requests where the SAN was passed as a request attribute, which
is how web enrolment and `certreq -attrib` style requests work. Certify and Certipy embed
the SAN as an X.509 extension inside the CSR; that extension is not reflected in the
Event 4887 Attributes field and will not appear here. For comprehensive SAN review, query
the CA database directly:

```
certutil -view -restrict "NotBefore>=MM/DD/YYYY,Disposition=20" -out "RequestID,RequesterName,CommonName"
```

This lists issued certificates with requester and subject. Certificates where the
CommonName differs from the RequesterName by a privileged account name are worth
retrieving individually with `certutil -view -restrict "RequestID=N"` to inspect the
full SAN extension.

For ESC6 exploitation, the Attributes field contains a SAN on any issued certificate, not
only templates explicitly configured for it. The Phase 1 query does not identify ESC6
because the vulnerability is on the CA policy rather than a specific template. Checking
whether the CA carries the `EDITF_ATTRIBUTESUBJECTALTNAME2` flag uses
`certutil -getreg policy\EditFlags` on the CA server; a value with bit 0x00040000 set
indicates the flag is active.
Last updated: 26 May 2026
