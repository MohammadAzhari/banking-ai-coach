import OpenAI from "openai";
import { prisma } from "../../configs/db";
import { Transaction, Report } from "@prisma/client";

class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateContextQuestionForTransaction(transactionId: string): Promise<{
    content: string;
    options: string[];
    responseId: string;
  } | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true },
      });

      if (!transaction || transaction.type !== "DEBIT") {
        await prisma.transaction.update({
          where: {
            id: transaction?.id,
          },
          data: {
            isConversationClosed: true,
          },
        });
        return null;
      }

      const [categoryTransactions, storeTransactions, recentTransactions] =
        await Promise.all([
          prisma.transaction.findMany({
            where: {
              userId: transaction.userId,
              category: transaction.category,
              id: { not: transactionId },
            },
            orderBy: { date: "desc" },
            take: 3,
          }),
          transaction.storeName
            ? prisma.transaction.findMany({
                where: {
                  userId: transaction.userId,
                  storeName: transaction.storeName,
                  id: { not: transactionId },
                },
                orderBy: { date: "desc" },
                take: 3,
              })
            : [],
          prisma.transaction.findMany({
            where: {
              userId: transaction.userId,
              id: { not: transactionId },
            },
            orderBy: { date: "desc" },
            take: 3,
          }),
        ]);

      const systemPrompt = `You are a friendly AI banking assistant. Your goal is to gather context about WHY and HOW the user made this transaction to better understand their spending patterns.

        Guidelines:
        - Be friendly, curious, and conversational
        - Ask about the PURPOSE, OCCASION, or REASON behind the transaction
        - Compare with their spending history to create personalized insights
        - Generate options that help uncover the story behind the purchase
        - Focus on understanding the context: was it planned/unplanned, social/personal, special occasion, etc.
        - Be creative with options that relate to the specific transaction type and amount
        - Use Arabic language, Saudi dialect

        Example:
        If user spent SAR45 at "Pizza Palace" (20% more than usual SAR38 average):
        Content: "I noticed you visited Pizza Palace again! This time you spent SAR45, which is about 20% more than your usual SAR38 there. I'm curious about what made this visit special?"
        Options: ["I was with friends this time", "Tried their new premium menu", "Ordered extra for family", "It was a celebration"]

        Another example for SAR120 at "Target" (first time this month):
        Content: "Great to see you shopping at Target! SAR120 is quite a haul. I'd love to know what brought you there today?"
        Options: ["Monthly household essentials", "Back-to-school shopping", "Home improvement project", "Unexpected need came up"] IMPORTANT NOTE: """""Make it max 20 chars""""`;

      const userPrompt = `User just made a transaction:
        - Amount: SAR${transaction.amount}
        - Category: ${transaction.category}
        - Store: ${transaction.storeName || "Not specified"}
        - Current Balance: SAR${transaction.user.balance}

        Recent transactions in same category (${transaction.category}):
        ${
          categoryTransactions
            .map(
              (t) =>
                `- SAR${t.amount} at ${
                  t.storeName || "Unknown"
                } on ${t.date.toDateString()}`
            )
            .join("\n") || "None found"
        }

        ${
          transaction.storeName
            ? `Recent transactions at ${transaction.storeName}:
        ${
          storeTransactions
            .map(
              (t) =>
                `- SAR${t.amount} for ${t.category} on ${t.date.toDateString()}`
            )
            .join("\n") || "None found"
        }`
            : ""
        }

        Recent overall transactions:
        ${
          recentTransactions
            .map(
              (t) =>
                `- SAR${t.amount} for ${t.category} at ${
                  t.storeName || "Unknown"
                } on ${t.date.toDateString()}`
            )
            .join("\n") || "None found"
        }

        Generate a friendly message with context questions for this transaction.
        
        Return the response in the following format:
        {
          "content": "A friendly, conversational message with insights based on spending patterns",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"] // Array of 2-4 contextual questions or response options related to this transaction
        }
        `;

      const response = await this.openai.responses.parse({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        store: true,
      });

      const content = response.output_text;

      if (!content) return null;

      const parsedContent = JSON.parse(content);
      return { ...parsedContent, responseId: response.id };
    } catch (error) {
      console.error("Error generating context question:", error);
      return null;
    }
  }

  async extractContextFromMessage(
    transactionId: string,
    userMessage: string
  ): Promise<{
    isRelated: boolean;
    needFurtherInfo: boolean;
    context: string;
    response: { content: string; options: string[]; responseId: string };
  } | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true },
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
        - Do NOT use markdown formatting or markdown response syntax (such as triple backticks, code blocks, or markdown tables) in your answer. Only use plain text.
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
          }
        }`;

      const userPrompt = `Transaction details:
        - Amount: SAR${transaction.amount}
        - Category: ${transaction.category}
        - Store: ${transaction.storeName || "Not specified"}
        - Date: ${transaction.date.toDateString()}
        - Previous context: ${transaction.context || "None"}

        User's message: "${userMessage}"

        Extract context and determine if more information is needed.`;

      const response = await this.openai.responses.parse({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
        context: parsedContent.context || "",
        response: {
          content: parsedContent.response.content,
          options: parsedContent.response.options || [],
          responseId: response.id,
        },
      };
    } catch (error) {
      console.error("Error extracting context from message:", error);
      return null;
    }
  }

  async generateContextForReport(
    reportId: string,
    transactions: Transaction[]
  ): Promise<string | null> {
    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { user: true },
      });

      if (!report) {
        return null;
      }

      const systemPrompt = `You are a financial AI assistant analyzing a user's spending report to provide insights and context.

        Your goal is to:
        1. Analyze the spending patterns and transactions
        2. Identify key insights, trends, and notable patterns
        3. Provide actionable financial advice
        4. Highlight any concerning or positive spending behaviors
        5. Make the analysis personal and relevant to the user

        Guidelines:
        - Do NOT use markdown formatting or markdown response syntax (such as triple backticks, code blocks, or markdown tables) in your answer. Only use plain text.
        - Be encouraging and supportive
        - Focus on actionable insights
        - Highlight both positive and areas for improvement
        - Use specific numbers and percentages when relevant
        - Keep the tone friendly and conversational
        - Provide practical suggestions for better financial management`;

      const transactionsByCategory = transactions.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
      }, {} as Record<string, Transaction[]>);

      const categoryAnalysis = Object.entries(transactionsByCategory)
        .map(([category, txns]) => {
          const total = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
          const avgAmount = total / txns.length;
          return `${category}: ${txns.length} transactions, SAR${total.toFixed(
            2
          )} total (avg: SAR${avgAmount.toFixed(2)})`;
        })
        .join("\n");

      const userPrompt = `User's spending report analysis:
        
        Report Period: ${report.from.toDateString()} to ${report.to.toDateString()}
        Total Transactions: ${report.totalTransactions}
        Total Amount: SAR${report.totalAmount}
        Credit Amount: SAR${report.creditAmount}
        Debit Amount: SAR${report.debitAmount}
        Current Balance: SAR${report.user.balance}
        
        Category Breakdown:
        ${categoryAnalysis}
        
        Transaction Details:
        ${transactions
          .map(
            (t) =>
              `- SAR${t.amount} ${t.type} for ${t.category} at ${
                t.storeName || "Unknown"
              } on ${t.date.toDateString()}${
                t.context ? ` (Context: ${t.context})` : ""
              }`
          )
          .join("\n")}
        
        Provide a comprehensive analysis with insights, patterns, and actionable advice for this user's spending behavior. Focus on helping them understand their financial habits and provide practical suggestions for improvement.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error("Error generating report context:", error);
      return null;
    }
  }

  async summarizeContextForUser(context: string): Promise<string | null> {
    try {
      const summaryPrompt = `Summarize the following financial analysis in a friendly and understandable way.
  
        The summary should:
        - Be written in Arabic using a Saudi dialect
        - Highlight the key points and financial insights
        - Focus on practical tips and clear patterns
        - Avoid going into complex details
        - Be short, personal, and easy to read
        
        Full analysis:
        ${context}
        
        Now write the summary in Arabic (Saudi dialect).`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful financial assistant. Your task is to provide users with a concise and practical summary of their financial report in Arabic with a friendly, conversational Saudi tone. Do NOT use markdown formatting or markdown response syntax (such as triple backticks, code blocks, or markdown tables) in your answer. Only use plain text.`,
          },
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error("Error summarizing context:", error);
      return null;
    }
  }

  async generateContextForLifeReport(
    reportId: string,
    previousShortReports: Report[],
    currentLifeReport: Report
  ): Promise<string | null> {
    try {
      const systemPrompt = `You are a financial AI assistant analyzing a user's comprehensive life report based on their spending history and patterns.

        Your goal is to:
        1. Analyze long-term spending trends and patterns from multiple short reports
        2. Identify significant changes in financial behavior over time
        3. Provide strategic financial insights and long-term recommendations
        4. Highlight progress, achievements, and areas needing attention
        5. Offer actionable advice for long-term financial health

        Guidelines:
        - Do NOT use markdown formatting or markdown response syntax (such as triple backticks, code blocks, or markdown tables) in your answer. Only use plain text.
        - Focus on trends and patterns rather than individual transactions
        - Provide strategic, long-term financial advice
        - Be encouraging about positive trends and constructive about areas for improvement
        - Use data from multiple reporting periods to show progression
        - Offer practical, actionable recommendations for financial growth
        - Keep the tone supportive and forward-looking`;

      const shortReportsAnalysis = previousShortReports
        .map((report, index) => {
          const breakdown = report.categoryBreakdown as Record<string, number>;
          const topCategories = Object.entries(breakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([category, amount]) => `${category}: SAR${amount.toFixed(2)}`)
            .join(", ");

          return `Report ${
            index + 1
          } (${report.from.toDateString()} - ${report.to.toDateString()}):
          - Total: SAR${report.totalAmount.toFixed(2)} (${
            report.totalTransactions
          } transactions)
          - Credit: SAR${report.creditAmount.toFixed(
            2
          )}, Debit: SAR${report.debitAmount.toFixed(2)}
          - Top categories: ${topCategories}
          - AI Context: ${
            report.context
              ? report.context.substring(0, 200) + "..."
              : "No context available"
          }`;
        })
        .join("\n\n");

      const lifeReportBreakdown = currentLifeReport.categoryBreakdown as Record<
        string,
        number
      >;
      const lifeCategoryAnalysis = Object.entries(lifeReportBreakdown)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => `${category}: SAR${amount.toFixed(2)}`)
        .join("\n");

      const userPrompt = `User's Life Report Analysis:
        
        Current Life Report Summary:
        - Period: ${currentLifeReport.from.toDateString()} to ${currentLifeReport.to.toDateString()}
        - Total Transactions: ${currentLifeReport.totalTransactions}
        - Total Amount: SAR${currentLifeReport.totalAmount.toFixed(2)}
        - Credit Amount: SAR${currentLifeReport.creditAmount.toFixed(2)}
        - Debit Amount: SAR${currentLifeReport.debitAmount.toFixed(2)}
        
        Category Breakdown (Life Report):
        ${lifeCategoryAnalysis}
        
        Previous Short Reports Analysis:
        ${shortReportsAnalysis}
        
        Provide a comprehensive life report analysis focusing on:
        1. Long-term spending trends and patterns
        2. Financial behavior changes over time
        3. Category spending evolution
        4. Strategic recommendations for financial improvement
        5. Recognition of positive financial habits
        6. Areas that need attention or adjustment
        
        Make this analysis strategic and forward-looking, helping the user understand their overall financial journey and providing actionable insights for long-term financial success.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error("Error generating life report context:", error);
      return null;
    }
  }

  async generateNaturalMessageResponse(
    userId: string,
    userMessage: string,
    lifeReport: Report | null,
    recentShortReports: Report[],
    latestResponseId: string | undefined = undefined
  ): Promise<{ message: string; responseId: string } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const systemPrompt = `You are a friendly AI financial assistant helping users with their banking and financial questions.

        Your role is to:
        1. Answer financial questions based on the user's spending history and reports
        2. Provide personalized financial advice and insights
        3. Help with budgeting, spending analysis, and financial planning
        4. Be conversational, helpful, and supportive
        5. Use the user's actual financial data to provide relevant context

        Guidelines:
        - Do NOT use markdown formatting or markdown response syntax (such as triple backticks, code blocks, or markdown tables) in your answer. Only use plain text.
        - Be friendly and conversational
        - Provide specific insights based on their actual spending data
        - Offer actionable advice when appropriate
        - If you don't have enough context, ask clarifying questions
        - Keep responses concise but informative
        - Focus on being helpful and supportive
        - Make the message in Arabic using a Saudi dialect
        - Make the message short and easy to read max 300 words`;

      let contextInfo = `
          User Info:
            User name: ${user.name}
            User balance: ${user.balance}
      `;

      if (lifeReport) {
        const lifeBreakdown = lifeReport.categoryBreakdown as Record<
          string,
          number
        >;
        const topCategories = Object.entries(lifeBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category, amount]) => `${category}: SAR${amount.toFixed(2)}`)
          .join(", ");

        contextInfo += `Life Report Summary:
        - Period: ${lifeReport.from.toDateString()} to ${lifeReport.to.toDateString()}
        - Total Transactions: ${lifeReport.totalTransactions}
        - Total Amount: SAR${lifeReport.totalAmount.toFixed(2)}
        - Credit: SAR${lifeReport.creditAmount.toFixed(
          2
        )}, Debit: SAR${lifeReport.debitAmount.toFixed(2)}
        - Top spending categories: ${topCategories}
        - AI Analysis: ${
          lifeReport.context
            ? lifeReport.context.substring(0, 300) + "..."
            : "No analysis available"
        }

`;
      }

      if (recentShortReports.length > 0) {
        contextInfo += "Recent Short Reports:\n";
        recentShortReports.forEach((report, index) => {
          const breakdown = report.categoryBreakdown as Record<string, number>;
          const topCategory = Object.entries(breakdown).sort(
            ([, a], [, b]) => b - a
          )[0];

          contextInfo += `        Report ${
            index + 1
          } (${report.from.toDateString()} - ${report.to.toDateString()}):
        - Total: SAR${report.totalAmount.toFixed(2)} (${
            report.totalTransactions
          } transactions)
        - Top category: ${
          topCategory
            ? `${topCategory[0]}: SAR${topCategory[1].toFixed(2)}`
            : "N/A"
        }
        - AI Context: ${
          report.context
            ? report.context.substring(0, 300) + "..."
            : "No context"
        }

`;
        });
      }

      if (!contextInfo) {
        contextInfo =
          "No financial data available yet. User hasn't created any reports.";
      }

      const userPrompt = `User's Financial Context:
        ${contextInfo}
        
        User's Message: "${userMessage}"
        
        Please provide a helpful response based on their financial context and message. If they're asking about their spending, use the actual data from their reports. If they need financial advice, make it personalized based on their spending patterns.`;

      const response = await this.openai.responses.create({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        previous_response_id: latestResponseId,
        store: true,
      });

      if (!response) {
        return null;
      }

      return {
        message: response.output_text,
        responseId: response.id,
      };
    } catch (error) {
      console.error("Error generating natural message response:", error);
      return null;
    }
  }
}

export default new AIService();
