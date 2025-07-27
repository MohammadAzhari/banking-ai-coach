import OpenAI from 'openai';
import { prisma } from '../../configs/db';

class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateContextQuestionForTransaction(transactionId: string): Promise<{ content: string; options: string[], responseId: string } | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true }
      });

      if (!transaction || transaction.type !== 'DEBIT') {
        return null;
      }

      const [categoryTransactions, storeTransactions, recentTransactions] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            userId: transaction.userId,
            category: transaction.category,
            id: { not: transactionId }
          },
          orderBy: { date: 'desc' },
          take: 3
        }),
        transaction.storeName ? prisma.transaction.findMany({
          where: {
            userId: transaction.userId,
            storeName: transaction.storeName,
            id: { not: transactionId }
          },
          orderBy: { date: 'desc' },
          take: 3
        }) : [],
        prisma.transaction.findMany({
          where: {
            userId: transaction.userId,
            id: { not: transactionId }
          },
          orderBy: { date: 'desc' },
          take: 3
        })
      ]);

      const systemPrompt = `You are a friendly AI banking assistant. Generate a personalized response for a user after they made a debit transaction.

        Guidelines:
        - Be friendly and supportive
        - Provide relevant insights based on their transaction history
        - Make options specific to the transaction and category
        - Keep the content concise but engaging
        - Focus on helping them understand their spending better`;

      const userPrompt = `User just made a transaction:
        - Amount: $${transaction.amount}
        - Category: ${transaction.category}
        - Store: ${transaction.storeName || 'Not specified'}
        - Current Balance: $${transaction.user.balance}

        Recent transactions in same category (${transaction.category}):
        ${categoryTransactions.map(t => `- $${t.amount} at ${t.storeName || 'Unknown'} on ${t.date.toDateString()}`).join('\n') || 'None found'}

        ${transaction.storeName ? `Recent transactions at ${transaction.storeName}:
        ${storeTransactions.map(t => `- $${t.amount} for ${t.category} on ${t.date.toDateString()}`).join('\n') || 'None found'}` : ''}

        Recent overall transactions:
        ${recentTransactions.map(t => `- $${t.amount} for ${t.category} at ${t.storeName || 'Unknown'} on ${t.date.toDateString()}`).join('\n') || 'None found'}

        Generate a friendly message with context questions for this transaction.
        
        Return the response in the following format:
        {
          "content": "A friendly, conversational message with insights based on spending patterns",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"] // Array of 2-4 contextual questions or response options related to this transaction
        }
        `;

      const response = await this.openai.responses.parse({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        store: true,
      });

      const content = response.output_text;

      if (!content) return null;

      try {
        const parsedContent = JSON.parse(content);
        return {...parsedContent, responseId: response.id};
      } catch (error) {
        console.error('Error parsing response content:', error);
        return null;
      }
    } catch (error) {
      console.error('Error generating context question:', error);
      return null;
    }
  }

  async extractContextFromMessage(transactionId: string, userMessage: string): Promise<{ isRelated: boolean; needFurtherInfo: boolean; context: string; response: { content: string; options: string[]; responseId: string } } | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true }
      });

      if (!transaction) {
        return null;
      }

      const systemPrompt = `You are a financial AI assistant analyzing a user's message about their transaction to extract context and determine next steps.

        Your task is to:
        1. Determine if the message is related to the transaction
        2. Extract meaningful context from the user's message
        3. Decide if you need more information or if the conversation can be closed
        4. Provide an appropriate response

        Guidelines:
        - Extract specific context like purpose, category details, business/personal nature
        - Ask for more info if the context is vague or incomplete
        - Be conversational and helpful
        - Close conversation if you have sufficient context

        Return the response in the following format:
        {
          "isRelated": true/false,
          "needFurtherInfo": true/false,
          "context": "Extracted context from user message",
          "response": {
            "content": "Your response message",
            "options": ["Option 1", "Option 2"]
          }
        }`;

      const userPrompt = `Transaction details:
        - Amount: $${transaction.amount}
        - Category: ${transaction.category}
        - Store: ${transaction.storeName || 'Not specified'}
        - Date: ${transaction.date.toDateString()}
        - Previous context: ${transaction.context || 'None'}

        User's message: "${userMessage}"

        Extract context and determine if more information is needed.`;

      const response = await this.openai.responses.parse({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        store: true,
      });

      const content = response.output_text;
      if (!content) return null;

      try {
        const parsedContent = JSON.parse(content);
        return {
          isRelated: parsedContent.isRelated,
          needFurtherInfo: parsedContent.needFurtherInfo,
          context: parsedContent.context || '',
          response: {
            content: parsedContent.response.content,
            options: parsedContent.response.options || [],
            responseId: response.id
          }
        };
      } catch (error) {
        console.error('Error parsing context extraction response:', error);
        return null;
      }
    } catch (error) {
      console.error('Error extracting context from message:', error);
      return null;
    }
  }

  async evaluateMessageForTransaction(transactionId: string, userMessage: string, latestResponseId: string): Promise<{ isRelated: boolean; response?: { content: string; options: string[]; responseId: string }; shouldClose?: boolean } | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true }
      });

      if (!transaction) {
        return null;
      }

      const systemPrompt = `You are a financial AI assistant evaluating a user's follow-up message to a previous transaction conversation.

        Your task is to:
        1. Determine if the user's message is related to the previous transaction conversation
        2. If related, provide an appropriate response and determine if the conversation should be closed
        3. If not related, indicate it's a new conversation

        Guidelines:
        - Be helpful and understanding
        - If the user provides context about the transaction, acknowledge it and ask if there's anything else
        - If the user asks for help or has questions, provide relevant assistance
        - Close the conversation if the user seems satisfied or says goodbye
        - Mark as unrelated if the message is about a completely different topic

        Return the response in the following format:
        {
          "isRelated": true/false,
          "content": "Your response message (only if related)",
          "options": ["Option 1", "Option 2"] // 1-3 options (only if related and not closing)
          "shouldClose": true/false // whether to close this conversation
        }`;

      const userPrompt = `Previous transaction details:
        - Amount: $${transaction.amount}
        - Category: ${transaction.category}
        - Store: ${transaction.storeName || 'Not specified'}
        - Date: ${transaction.date.toDateString()}
        - Previous context: ${transaction.context || 'None'}
        - Response ID: ${latestResponseId}

        User's new message: "${userMessage}"

        Evaluate if this message is related to the transaction conversation and provide an appropriate response.`;

      const response = await this.openai.responses.parse({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        store: true,
      });

      const content = response.output_text;
      if (!content) return null;

      try {
        const parsedContent = JSON.parse(content);
        if (parsedContent.isRelated && parsedContent.content) {
          return {
            isRelated: true,
            response: {
              content: parsedContent.content,
              options: parsedContent.options || [],
              responseId: response.id
            },
            shouldClose: parsedContent.shouldClose || false
          };
        } else {
          return { isRelated: false };
        }
      } catch (error) {
        console.error('Error parsing evaluation response:', error);
        return null;
      }
    } catch (error) {
      console.error('Error evaluating message for transaction:', error);
      return null;
    }
  }
}

export default new AIService();
