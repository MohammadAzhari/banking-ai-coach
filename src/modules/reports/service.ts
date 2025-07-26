import { prisma } from '../../configs/db';
import { ShortReportSummary } from './types';
import transactionService from '../transaction/service';
import { ShortReport, Transaction, TransactionType } from '@prisma/client'

class ReportsService {

  async generateShortReport(userId: string): Promise<ShortReport> {
    // Fetch unreported transactions
    const unreportedTransactions = await transactionService.getUnreportedTransactionsByUserId(userId);

    if (unreportedTransactions.length === 0) {
      throw new Error('No unreported transactions found for this user');
    }

    // Calculate summary data
    const summary = this.calculateShortReportSummary(unreportedTransactions);

    // Create short report in database
    const shortReport = await prisma.shortReport.create({
      data: {
        userId,
        summary: summary as any
      }
    });

    // Mark transactions as reported
    await transactionService.markTransactionsAsReported(userId);

    // TODO: Trigger AI service for report analysis
    console.log(`AI: Analyzing short report for user ${userId}`);

    return shortReport;
  }

  private calculateShortReportSummary(transactions: Transaction[]): ShortReportSummary {
    const totalTransactions = transactions.length;
    let totalAmount = 0;
    let creditAmount = 0;
    let debitAmount = 0;
    const categoryBreakdown: Record<string, number> = {};

    transactions.forEach(transaction => {
      totalAmount += Math.abs(transaction.amount);
      
      if (transaction.type === TransactionType.CREDIT) {
        creditAmount += transaction.amount;
      } else {
        debitAmount += Math.abs(transaction.amount);
      }

      if (categoryBreakdown[transaction.category]) {
        categoryBreakdown[transaction.category] += Math.abs(transaction.amount);
      } else {
        categoryBreakdown[transaction.category] = Math.abs(transaction.amount);
      }
    });

    const dates = transactions.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      totalTransactions,
      totalAmount,
      creditAmount,
      debitAmount,
      categoryBreakdown,
      period: {
        from: minDate,
        to: maxDate
      }
    };
  }

  async getShortReportsByUserId(userId: string): Promise<ShortReport[]> {
    return await prisma.shortReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getShortReportById(id: string): Promise<ShortReport | null> {
    return await prisma.shortReport.findUnique({
      where: { id }
    });
  }
}

export default new ReportsService();
