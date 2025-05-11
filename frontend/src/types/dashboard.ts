export interface DashboardSummaryData {
  salesToday: { totalAmount: number; orderCount: number };
  pendingOrdersCount: number;
  expensesThisMonth: { totalAmount: number; expenseCount: number };
} 