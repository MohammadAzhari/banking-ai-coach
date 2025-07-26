import OpenAI from 'openai';
import { prisma } from '../../configs/db';

class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateContextQuestionForTransaction(transactionId: string): Promise<{ content: string; options: string[] } | null> {
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

        Generate a friendly message with context questions for this transaction.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'transaction_context_response',
            schema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'A friendly, conversational message with insights based on spending patterns'
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Array of 2-4 contextual questions or response options related to this transaction',
                  minItems: 2,
                  maxItems: 4
                }
              },
              required: ['content', 'options'],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      try {
        const parsed = JSON.parse(content);
        return {
          content: parsed.content,
          options: parsed.options
        };
      } catch (parseError) {
        console.error('Error parsing structured response:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Error generating context question:', error);
      return null;
    }
  }
}

export default new AIService();
