
Example Learning Idea

I want to build a simple banking ai coach that helps the users to know where they spend their money and how they can save more.

the ai needs to have context about the account, transactions
how the ai get the context in the first place?
lets consider the account will be already setup and each transaction have a category

the user will asked to provide more context about the transactions
the question itself need to have some default options needs to be generated based on:
- the transaction category
- the transaction amount
- the previous transactions contexts (total, same category, same place)

then after providing enough context the ai can provide some insights about the transactions, let's say scheduled cron job, or on triggered manually

also the user can chat with the ai coach to make some decisions

Functional Requirements:
- after transaction, users needs to asked to provide more context about the transaction by quesitons are friendly with default options
- users can recived insights about the transactions, on-demand or scheduled
- users can chat with the ai coach to make some decisions

Entities:
- User (id, name, balance)
- Transaction (id, user_id, amount, category, date, store_name, context?)

Apis:
POST /transactions { amount, category, store_name } -> void (ack)
POST /message { text } -> void (ack)


