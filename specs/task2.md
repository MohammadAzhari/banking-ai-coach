Task2:
1. fill the data files with some sample data, maintain correct relations
2. create an endpoint to get context questions by transaction id GET /context-questions/:transaction_id:
- it depends on the amount, category, and previous contexts and latest n transactions for user

for example the user buy some food, the quesitons will be something like
- you buy a 20$ meal today, why you have a second meal?
- it's been a long time since you buy a meal, is it a special occasion?

so we need to provide a context that have access to previous transactions and latest transactions populated with their contexts