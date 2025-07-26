
This task will envolve some updates into the datamodel.

- in the Transaction, add type either (credit, debit)
- in Transaction, add isConversationClosed as boolean default false
- in Transaction, add isReported as boolean default false
- in the User, add WhatsAppId as string

i want to create a feature that will help the report generation, and the decision making process.
the feature is contains of the following:

- having a new table called short_reports
- the short_report will have the following fields: (user have many short_reports)
  - id
  - userId (foreign key to User(id))
  - createdAt
  - updatedAt
  - summary (json)

- having a new table called life_reports
- the life_report will have the following fields: (user have one life_report)
  - id
  - userId (unique and foreign key to User(id))
  - createdAt
  - updatedAt
  - summary (json)

- triggering an Endpoint POST /short-reports/{userId}
which will fetch the transactions where isReported is false and generate a report based on them, the report will trigger the ai service so you can keep the rest of the implementation empty