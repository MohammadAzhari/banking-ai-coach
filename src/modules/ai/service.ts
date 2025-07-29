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

      const systemPrompt = `You are a friendly AI banking assistant. Your goal is to gather context about WHY and HOW the user made this transaction to better understand their spending patterns.

        Guidelines:
        - Be friendly, curious, and conversational
        - Ask about the PURPOSE, OCCASION, or REASON behind the transaction
        - Compare with their spending history to create personalized insights
        - Generate options that help uncover the story behind the purchase
        - Focus on understanding the context: was it planned/unplanned, social/personal, special occasion, etc.
        - Be creative with options that relate to the specific transaction type and amount

        Example:
        If user spent $45 at "Pizza Palace" (20% more than usual $38 average):
        Content: "I noticed you visited Pizza Palace again! This time you spent $45, which is about 20% more than your usual $38 there. I'm curious about what made this visit special?"
        Options: ["I was with friends this time", "Tried their new premium menu", "Ordered extra for family", "It was a celebration"]

        Another example for $120 at "Target" (first time this month):
        Content: "Great to see you shopping at Target! $120 is quite a haul. I'd love to know what brought you there today?"
        Options: ["Monthly household essentials", "Back-to-school shopping", "Home improvement project", "Unexpected need came up"]`;

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

      const parsedContent = JSON.parse(content);
      return {...parsedContent, responseId: response.id};
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
        2. Extract meaningful context from the user's message make it more like the user input message, but a bit more detailed
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
            "content": "Your response message", // if not need further info, provide a response message like "Got it, Thanks!"
            "options": ["Option 1", "Option 2"] // Optional - provide options only if you need more information
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
        temperature: 0.3,
        previous_response_id: transaction.latestResponseId,
        store: true,
      });

      const content = response.output_text;
      if (!content) return null;

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
      console.error('Error extracting context from message:', error);
      return null;
    }
  }
}

export default new AIService();
