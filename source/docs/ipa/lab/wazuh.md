# Overview of the IPA-SIEM stack

The IPA-SIEM Stack is a specialised cybersecurity tool built on Wazuh, an open-source SIEM/XDR platform designed to 
help survivors of intimate partner abuse (IPA) detect and respond to covert digital surveillance. This includes 
threats like stalkerware, spyware, and unauthorised device access. The system provides a comprehensive approach to 
digital protection for vulnerable individuals.

## Key goals of the IPA-SIEM stack  

The system serves four primary functions. First, it enables forensic data collection by gathering logs and artefacts from survivor devices across Windows, macOS, Android and iOS platforms to identify potential compromises. Second, its threat detection capability uses pre-configured rules to identify common surveillance tools including commercial stalkerware like mSpy and FlexiSPY, along with keyloggers and remote access tools.  

For incident response, the stack provides automated scripts and clear guidance to isolate compromised devices, collect digital evidence, and support survivors in securing their technology. Finally, the platform maintains a privacy-centric design that complies with GDPR and UK Data Protection Act requirements, ensuring all survivor data remains encrypted and anonymised throughout the process.

## How the system operates  

The IPA-SIEM Stack operates through a centralised architecture. A dedicated server or cloud VM forms the foundation, 
running several key components. The Wazuh module continuously monitors connected devices for suspicious activity, 
while Elasticsearch and Kibana work together to store and visualise security logs, including alerts about spyware 
processes or location tracking attempts. Installation is streamlined through an automated `setup.sh` script that handles 
all dependencies and configuration.  

Device integration varies by platform. Windows and macOS systems can install Wazuh agents that automatically 
transmit logs to the central server. For Android devices, rooted systems can deploy the agent through Termux, 
while non-rooted devices require manual log collection via ADB. iOS support is currently limited to jailbroken 
devices using Cydia or manual log extraction through iTunes.  

The detection system employs pre-built rules that identify known threats, such as mSpy processes or unauthorised 
location access attempts. These alerts appear in the Kibana dashboard alongside recommended actions, which might 
include isolating a device or resetting GPS settings. When threats are detected, the incident response protocols 
spring into action. Automated scripts like quarantine_device.sh help contain threats, while comprehensive guidance 
supports survivors through evidence preservation, legal reporting procedures, and transitioning to more secure 
devices when necessary.  

## Importance and applications  

This solution holds particular significance for several reasons. It empowers non-technical advocates by providing 
shelters and support organisations with enterprise-grade security tools without requiring deep cybersecurity 
expertise. The system maintains strict legal and ethical compliance through robust encryption, data anonymisation 
practices, and a 90-day log retention policy that balances evidentiary needs with privacy concerns. Being built on 
free, open-source tools like Wazuh and Elasticsearch makes it particularly cost-effective for cash-strapped 
organisations working with abuse survivors.  

The platform is ideally suited for domestic violence shelters needing to protect clients from digital surveillance, 
digital forensics advocates assisting with evidence collection, and legal aid organisations building cases for 
restraining orders or prosecution. While the project is open-source (licensed under GPLv3) and welcomes community 
contributions, users should note some current limitations. Android and iOS support remains limited for 
non-rooted/jailbroken devices, but we may change that.
