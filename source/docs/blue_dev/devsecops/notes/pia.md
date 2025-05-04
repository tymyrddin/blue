# Privacy Impact Assessment (PIA)

The objective of a PIA is to perform an initial self-assessment of what business modules may involve privacy data handling and readiness for GDPR compliance. the data privacy impact analysis is required by the GDPR article 35.

## Privacy data attributes

|        Attributes       | Related business flow or applications                                                     |
|:-----------------------:|-------------------------------------------------------------------------------------------|
| Privacy data type       | Describe collected or processed privacy data, such as name, address, phone                |
| Purpose of colection    | Describe the objective of the data collection and the business                            |
| Is it a must?           | Is the data collection essential to keep the business application running?                |
| Ways of collection      | How the personal data is collected, such as API, email, or web form<br>registration          |
| Lawful basis            | Is the data collection based on user agreement, contract, or legal<br>compliance?            |
| Rights of data subject  | Can the data subject edit or delete the data?                                             |
| Transmission            | How the data is transmitted, such as FTP, email, or API                                   |
| Storage country         | Which country is the data stored in?                                                      |
| Storage format          | In what format is the data stored, such as big data, relational database,<br>or paper-based? |
| Expiration period       | Any specified expiration period of the data usage?                                        |
| Cross-border transfer   | Will the data be transferred out of or into the EU?                                       |
| Third-party involvement | Is any third party involved with the data processing?                                     |
| Owner                   | Who/which team is the owner of the data?                                                  |


## GDPR security requirements

_A controller is the entity that determines the purposes, conditions and means of processing of personal data, while the processor is an entity which processes personal data on behalf of the controller._

| Requirement                                                                                                                    | Processor   | Controller |
|:-------------------------------------------------------------------------------------------------------------------------------|-------------|------------|
| Provide Data Privacy Declaration                                                                                               | Must        | Must       |
| Data collection requires a user's explicit consent to data collection<br>and allows a user to disable data collection.         | Must        | Must       |
| For the purpose of error troubleshooting, the user must be informed<br>if the collectionof logs includes personal information. | Must        | Must       |
| Collection of a user's cookies requires the user's consent.                                                                    | Must        | Must       |
| If the data is collected for marketing analysis purposes, the <br>application must allow users to disable the analysis.        | Recommended | Must       |
| Provide a secure data removal capability after the data expires.                                                               | Must        | Must       |
| If the data will be provided to third-party partners, it must have the <br>user's explicit consent.                            | Recommended | Must       |
| Provide the capability for a user to query and update the data.                                                                | Recommended | Must       |
| Delete any temporary data which is no longer in use.                                                                           | Recommended | Must       |
| Provide the capability to export the data.                                                                                     | Recommended | Must       |
| Secure data transmission.                                                                                                      | Must        | Must       |
| Secure local data storage with encryption, access control, and <br>logging security controls.                                  | Must        | Must       |
