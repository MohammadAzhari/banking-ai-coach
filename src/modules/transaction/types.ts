export interface CreateTransactionRequest {
    amount: number;
    category: TransactionCategory;
    type: TransactionType;
    storeName?: string;
  }

  export type TransactionType = 'CREDIT' | 'DEBIT';

  export const TRANSACTION_TYPES: TransactionType[] = ['CREDIT', 'DEBIT'];

  export function isValidTransactionType(type: string): type is TransactionType {
    return TRANSACTION_TYPES.includes(type as TransactionType);
  }
  
  export type TransactionCategory = 
    | 'food'
    | 'transportation'
    | 'entertainment'
    | 'shopping'
    | 'bills'
    | 'health'
    | 'education'
    | 'travel'
    | 'other';
  
  export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
    'food',
    'transportation',
    'entertainment',
    'shopping',
    'bills',
    'health',
    'education',
    'travel',
    'other'
  ];
  
  export function isValidCategory(category: string): category is TransactionCategory {
    return TRANSACTION_CATEGORIES.includes(category as TransactionCategory);
  }
  