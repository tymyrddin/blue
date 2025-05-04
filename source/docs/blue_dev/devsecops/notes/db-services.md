# Securing managed database services

To deploy a specific build of a database, it can always be deployed inside a VM, but that means overseeing the operating system and database maintenance (including hardening, backup, patch management, and monitoring). Another option is a managed solution for running the database engine:

* Maintenance of the database, security patch deployment, and availability of the database are under the responsibility of the cloud provider.
* Backups are included as part of the service (up to a certain amount of storage and amount of backup history).
* Encryption in transit and at rest are embedded as part of a managed solution.
* Auditing is embedded as part of a managed solution.

The database engine can be a common database engine such as MySQL, PostgreSQL, Microsoft SQL Server, an Oracle Database server, or proprietary databases such as Amazon DynamoDB, Azure Cosmos DB, or Google Cloud Spanner. The basic idea remains the same:

1. Select the database type according to its purpose or use case.
2. Select a database engine.
3. For relational databases, select a machine type (or size).
4. Choose whether high availability is required.
5. Deploy a managed database instance (or cluster).
6. Configure network access control from your cloud environment to the managed database.
7. Enable logging for any access attempt or configuration changes in the managed database.
8. Configure backups on the managed database for recovery purposes.
9. Connect the application to the managed database and use the service.


