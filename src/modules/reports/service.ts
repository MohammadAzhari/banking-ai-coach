import { prisma } from '../../configs/db';
import { ShortReportSummary } from './types';
import transactionService from '../transaction/service';
import aiService from '../ai/service';
import { Report, Transaction, TransactionType, ReportType } from '@prisma/client';
import messageService from '../messages/service';

class ReportsService {

  async generateShortReport(userId: string): Promise<Report> {
    // Fetch unreported transactions
    const unreportedTransactions = await transactionService.getUnreportedTransactionsByUserId(userId);

    if (unreportedTransactions.length === 0) {
      throw new Error('No unreported transactions found for this user');
    }

    // Calculate summary data
    const summary = this.calculateShortReportSummary(unreportedTransactions);

    // Create short report in database
    const shortReport = await prisma.report.create({
      data: {
        userId,
        totalTransactions: summary.totalTransactions,
        totalAmount: summary.totalAmount,
        creditAmount: summary.creditAmount,
        debitAmount: summary.debitAmount,
        categoryBreakdown: summary.categoryBreakdown as any,
        from: summary.period.from,
        to: summary.period.to,
        type: ReportType.SHORT
      }
    });

    // Mark transactions as reported
    await transactionService.markTransactionsAsReported(userId);

    // Generate AI context for the report in background
    this.generateReportContextInBackground(shortReport.id, unreportedTransactions);

    // Update or create life report in background
    this.updateLifeReportInBackground(userId, shortReport);

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

  private async generateReportContextInBackground(reportId: string, transactions: Transaction[]): Promise<void> {
    try {
      const context = await aiService.generateContextForReport(reportId, transactions);

      if (!context) {
        return;
      }

      const report = await prisma.report.update({
          where: { id: reportId },
          data: { context }
        });

      messageService.sendMessage(
        report.userId,{content: context,});
    } catch (error) {
      console.error('Error generating report context:', error);
    }
  }

  private async updateLifeReportInBackground(userId: string, shortReport: Report): Promise<void> {
    try {
      // Get existing life report for user
      let lifeReport = await prisma.report.findFirst({
        where: {
          userId,
          type: ReportType.LIFE
        }
      });

      // Get previous 10 short reports for analysis
      const previousShortReports = await prisma.report.findMany({
        where: {
          userId,
          type: ReportType.SHORT
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      if (!lifeReport) {
        // Create new life report based on the short report
        lifeReport = await prisma.report.create({
          data: {
            userId,
            totalTransactions: shortReport.totalTransactions,
            totalAmount: shortReport.totalAmount,
            creditAmount: shortReport.creditAmount,
            debitAmount: shortReport.debitAmount,
            categoryBreakdown: shortReport.categoryBreakdown as any,
            from: shortReport.from,
            to: shortReport.to,
            type: ReportType.LIFE
          }
        });
      } else {
        // Update existing life report with aggregated data
        const updatedData = this.aggregateLifeReportData(lifeReport, shortReport);
        
        lifeReport = await prisma.report.update({
          where: { id: lifeReport.id },
          data: {
            totalTransactions: updatedData.totalTransactions!,
            totalAmount: updatedData.totalAmount!,
            creditAmount: updatedData.creditAmount!,
            debitAmount: updatedData.debitAmount!,
            categoryBreakdown: updatedData.categoryBreakdown!,
            from: updatedData.from!,
            to: updatedData.to!,
          }
        });
      }

      // Generate AI context for life report
      const context = await aiService.generateContextForLifeReport(lifeReport.id, previousShortReports, lifeReport);
      
      if (context) {
        await prisma.report.update({
          where: { id: lifeReport.id },
          data: { context }
        });
      }
    } catch (error) {
      console.error('Error updating life report:', error);
    }
  }

  private aggregateLifeReportData(currentLifeReport: Report, newShortReport: Report): {
    totalTransactions: number;
    totalAmount: number;
    creditAmount: number;
    debitAmount: number;
    categoryBreakdown: Record<string, number>;
    from: Date;
    to: Date;
  } {
    // Increment totals with new short report data
    const totalTransactions = currentLifeReport.totalTransactions + newShortReport.totalTransactions;
    const totalAmount = currentLifeReport.totalAmount + newShortReport.totalAmount;
    const creditAmount = currentLifeReport.creditAmount + newShortReport.creditAmount;
    const debitAmount = currentLifeReport.debitAmount + newShortReport.debitAmount;

    // Merge category breakdowns
    const currentBreakdown = currentLifeReport.categoryBreakdown as Record<string, number>;
    const newBreakdown = newShortReport.categoryBreakdown as Record<string, number>;
    const categoryBreakdown: Record<string, number> = { ...currentBreakdown };
    
    Object.entries(newBreakdown).forEach(([category, amount]) => {
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + amount;
    });

    // Update date range - extend the 'to' date to include new short report
    const from = currentLifeReport.from;
    const to = newShortReport.to > currentLifeReport.to ? newShortReport.to : currentLifeReport.to;

    return {
      totalTransactions,
      totalAmount,
      creditAmount,
      debitAmount,
      categoryBreakdown,
      from,
      to
    };
  }

  async getLifeReportByUserId(userId: string): Promise<Report | null> {
    return await prisma.report.findFirst({
      where: {
        userId,
        type: ReportType.LIFE
      }
    });
  }
}

export default new ReportsService();
