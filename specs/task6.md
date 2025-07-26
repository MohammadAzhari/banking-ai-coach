in this task we will implement a bit of the ai service, we need functions for:
- generating context questions for a transaction: 
the system will send a message to the user, with some default options, the message will be generated after each debit transaction, based on category of the transaction and the amount, the system will fetch the latest 3 transactions of the same category, the latest 3 transactions of the same storeName, the latest 3 transactions overall, and the user's balance and generate a friendly message to the user

work sequence:
- put this key into .env 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 as OPENAI_API_KEY
- modify the src/modules/ai/service.ts .. add a new method for generating context question for a transaction
- call this function when new transaction happened on requestContextInBackground function