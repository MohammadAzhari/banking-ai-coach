i've deleted the routes and the services folders, now i want a more clean approach to rebuild them

i want to have modules, each module will have routes.ts and services.ts and types.ts

i want the /entities folder to include each entity as a file of interface and there related sub entities
for example the transaction and the category in the same file

each service is a class thet exports only a new instance of the service

let's break down the modules:

1. transaction
have endpoints
POST /transactions { amount, category, store_name }:
- which will create a transaction. and have a callback (run in the background) to ask for more context
related entities:
- transaction

2. messages
have endpoints
POST /messages { text }:
- which will create a message. and have a callback (run in the background) to further process the message

3. ai
have only empty service service

- now can you create the blueprints for the modules?