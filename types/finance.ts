/**
 * Finance report and sales performance types
 */

export type FinanceMonthlyRow = {
  /** YYYY-MM */
  month: string;
  sales: number;
  purchaseCost: number;
  profit: number;
};

export type FinanceTopCustomer = {
  customerId: string;
  name: string;
  country: string;
  orderCount: number;
  revenue: number;
};

export type FinanceTopProduct = {
  productId: string;
  name: string;
  sku: string | null;
  quantity: number;
  revenue: number;
};

export type FinanceReport = {
  monthly: FinanceMonthlyRow[];
  topCustomers: FinanceTopCustomer[];
  topProducts: FinanceTopProduct[];
  totals: { sales: number; purchaseCost: number; profit: number };
};

export type SalesPerformanceEntry = {
  id: string;
  orderId: string;
  orderNumber: string;
  salesId: string;
  salesName: string;
  month: number;
  year: number;
  amount: number;
  notes: string | null;
};

export type SalesPerformanceSummaryRow = {
  salesId: string;
  salesName: string;
  totalAmount: number;
  entryCount: number;
  /** Amounts keyed by YYYY-MM */
  byMonth: Record<string, number>;
};

export type SalesPerformanceData = {
  entries: SalesPerformanceEntry[];
  summary: SalesPerformanceSummaryRow[];
  /** Sorted attribution months present in the data (YYYY-MM) */
  months: string[];
};

export type UpdateSalesPerformanceInput = {
  month: number;
  year: number;
  notes?: string;
};