Now i need to implement receiving messages from the user,

first i need to check his opened conversations, if there are 1 or more, i need to know if this message related to them, so i will check the latest_response_id and the message text, pass them to the ai service to check if this message is related to the conversation, or it's a new conversation totally, if it's a new conversation i need to verify from the user, if he verified, the current conversation will be closed,

but if there are 2 or more opened conversations?, i will check this related to anyone of them? so that will be complicated, so here is my final approach

- system receive a message from a user
- check the latest transaction, if it's not closed, pick it and check message the ai with the giving message and the last prompt id
- the ai will evaluate the message and check if it's enough or re ask the user for forthur info, and update the transaction context in either ways, but keep it not closed in the second cas