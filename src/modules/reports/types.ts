export interface ShortReportSummary {
  totalTransactions: number;
  totalAmount: number;
  creditAmount: number;
  debitAmount: number;
  categoryBreakdown: Record<string, number>;
  period: {
    from: Date;
    to: Date;
  };
}

export interface LifeReportSummary {
  totalTransactions: number;
  totalAmount: number;
  monthlyAverage: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  trends: {
    spending: 'increasing' | 'decreasing' | 'stable';
    savings: 'improving' | 'declining' | 'stable';
  };
}
