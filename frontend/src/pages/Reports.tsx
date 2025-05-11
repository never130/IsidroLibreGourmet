import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MainLayout } from '../components/layout/MainLayout';
import type { Order, OrderStatus, OrderType } from '../types/order';
import type { Expense, ExpenseCategory } from '../types/expense';
import type { ProductCategory } from '../types/product';

type ReportType = 'SALES' | 'EXPENSES' | 'PRODUCTS';

// --- Interfaces para los datos de los reportes del backend ---

// VENTAS
interface SalesSummaryData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  // Podríamos añadir más si el endpoint /summary los devuelve
}
interface OrderStatsData {
  countByStatus: Record<OrderStatus, { count: number; totalValue: number }>;
  countByType: Record<OrderType, { count: number; totalValue: number }>;
}
interface SalesByPaymentMethodData {
  paymentMethod: string; // o PaymentMethod enum si es consistente
  totalAmount: number;
  count: number;
}
interface RevenueOverTimeDataPoint {
  date: string;
  revenue: number;
}
// Estructura combinada para el reporte de ventas en el frontend
interface FrontendSalesReport {
  summary?: SalesSummaryData;
  orderStats?: OrderStatsData;
  paymentMethods?: SalesByPaymentMethodData[];
  revenueOverTime?: RevenueOverTimeDataPoint[];
}

// GASTOS
interface ExpensesSummaryData {
  totalExpenses: number;
  count: number;
  expensesByCategory: Record<ExpenseCategory, number>; // Usar ExpenseCategory
}
// Estructura para el reporte de gastos en el frontend (ya existe ExpensesReport, podemos renombrar o usar esta)
// type FrontendExpensesReport = ExpensesSummaryData; // Alias

// PRODUCTOS
interface ProductStatsData {
  totalProducts: number;
  activeProducts: number;
  // productsByCategory: Record<ProductCategory, number>; // Si el backend lo añade
}
interface TopProductData {
  productId: number;
  name:string;
  totalQuantitySold: number;
  totalRevenueGenerated: number;
}
interface LowStockProductData {
  id: number;
  name: string;
  stock: number;
  category?: ProductCategory;
}
// Estructura combinada para el reporte de productos en el frontend
interface FrontendProductsReport {
  stats?: ProductStatsData;
  topSelling?: TopProductData[];
  lowStock?: LowStockProductData[];
}


// Tipos de datos que usaba antes (se pueden eliminar o migrar)
// interface SalesReport { ... }
// interface ExpensesReport { ... }
// interface ProductsReport { ... }


export function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('SALES');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // Parámetros específicos para reportes de productos
  const [topProductsLimit, setTopProductsLimit] = useState<number>(5);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);

  // --- QUERIES PARA REPORTES DE VENTAS ---
  const { data: salesSummaryData, isLoading: isLoadingSalesSummary } = useQuery<SalesSummaryData>({
    queryKey: ['reports', 'salesSummary', startDate, endDate],
    queryFn: async () => {
      const response = await axios.get(`/api/reports/summary?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    },
    enabled: selectedReport === 'SALES'
  });

  const { data: orderStatsData, isLoading: isLoadingOrderStats } = useQuery<OrderStatsData>({
    queryKey: ['reports', 'orderStats', startDate, endDate],
    queryFn: async () => {
      const response = await axios.get(`/api/reports/order-stats?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    },
    enabled: selectedReport === 'SALES'
  });

  const { data: salesByPaymentMethodData, isLoading: isLoadingSalesByPaymentMethod } = useQuery<SalesByPaymentMethodData[]>({
    queryKey: ['reports', 'salesByPaymentMethod', startDate, endDate],
    queryFn: async () => {
      const response = await axios.get(`/api/reports/payment-methods?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    },
    enabled: selectedReport === 'SALES'
  });

  const { data: revenueOverTimeData, isLoading: isLoadingRevenueOverTime } = useQuery<RevenueOverTimeDataPoint[]>({
    queryKey: ['reports', 'revenueOverTime', startDate, endDate],
    queryFn: async () => {
      const response = await axios.get(`/api/reports/revenue-over-time?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    },
    enabled: selectedReport === 'SALES'
  });

  // Combinar datos de ventas para la UI
  const salesReportData: FrontendSalesReport | null = selectedReport === 'SALES' ? {
    summary: salesSummaryData,
    orderStats: orderStatsData,
    paymentMethods: salesByPaymentMethodData,
    revenueOverTime: revenueOverTimeData,
  } : null;

  // --- QUERY PARA REPORTES DE GASTOS ---
  const { data: expensesReport, isLoading: isLoadingExpenses } = useQuery<ExpensesSummaryData>({
    queryKey: ['reports', 'expensesSummary', startDate, endDate],
    queryFn: async () => {
      const response = await axios.get(
        `/api/reports/expenses-summary?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    },
    enabled: selectedReport === 'EXPENSES'
  });

  // --- QUERIES PARA REPORTES DE PRODUCTOS ---
  const { data: productStats, isLoading: isLoadingProductStats } = useQuery<ProductStatsData>({
    queryKey: ['reports', 'productStats', startDate, endDate],
    queryFn: async () => {
      const response = await axios.get(`/api/reports/product-stats?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    },
    enabled: selectedReport === 'PRODUCTS'
  });

  const { data: topProducts, isLoading: isLoadingTopProducts } = useQuery<TopProductData[]>({
    queryKey: ['reports', 'topProducts', startDate, endDate, topProductsLimit],
    queryFn: async () => {
      const response = await axios.get(`/api/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=${topProductsLimit}`);
      return response.data;
    },
    enabled: selectedReport === 'PRODUCTS'
  });

  const { data: lowStockProducts, isLoading: isLoadingLowStock } = useQuery<LowStockProductData[]>({
    queryKey: ['reports', 'lowStockProducts', lowStockThreshold], // No depende de fechas por ahora
    queryFn: async () => {
      const response = await axios.get(`/api/reports/low-stock-products?threshold=${lowStockThreshold}`);
      return response.data;
    },
    enabled: selectedReport === 'PRODUCTS'
  });
  
  // Combinar datos de productos para la UI
  const productsReportData: FrontendProductsReport | null = selectedReport === 'PRODUCTS' ? {
    stats: productStats,
    topSelling: topProducts,
    lowStock: lowStockProducts,
  } : null;

  // isLoadingOldSales ya no existe, se reemplaza por los nuevos loaders de ventas
  const isLoading = 
    (selectedReport === 'SALES' && (isLoadingSalesSummary || isLoadingOrderStats || isLoadingSalesByPaymentMethod || isLoadingRevenueOverTime)) ||
    (selectedReport === 'EXPENSES' && isLoadingExpenses) ||
    (selectedReport === 'PRODUCTS' && (isLoadingProductStats || isLoadingTopProducts || isLoadingLowStock));

  if (isLoading) {
    return (
      <MainLayout title="Reportes">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Reportes">
      <div className="space-y-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-md shadow">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Reporte</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value as ReportType)}
              className="p-2 border rounded-md"
            >
              <option value="SALES">Ventas</option>
              <option value="EXPENSES">Gastos</option>
              <option value="PRODUCTS">Productos</option>
            </select>
          </div>

          {selectedReport !== 'PRODUCTS' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-2 border rounded-md"
                />
              </div>
            </>
          )}

          {selectedReport === 'PRODUCTS' && (
            <>
              <div>
                <label htmlFor="topProductsLimitInput" className="block text-sm font-medium mb-1">Límite Top Productos</label>
                <input
                  id="topProductsLimitInput"
                  type="number"
                  value={topProductsLimit}
                  onChange={(e) => setTopProductsLimit(Number(e.target.value))}
                  className="p-2 border rounded-md w-24 bg-white dark:bg-gray-700 dark:border-gray-600"
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="lowStockThresholdInput" className="block text-sm font-medium mb-1">Umbral Bajo Stock</label>
                <input
                  id="lowStockThresholdInput"
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="p-2 border rounded-md w-24 bg-white dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                />
              </div>
            </>
          )}
        </div>

        {/* Contenido del Reporte */}
        <div className="bg-card rounded-lg shadow p-6 min-h-[300px]">
          {selectedReport === 'SALES' && salesReportData && (
            <div className="space-y-8">
              {/* Resumen General de Ventas */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-primary">Resumen General de Ventas</h2>
                {salesReportData.summary ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Ingresos Totales</h3>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">${(salesReportData.summary.totalRevenue || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total de Pedidos</h3>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{salesReportData.summary.totalOrders || 0}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Valor Promedio Pedido</h3>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">${(salesReportData.summary.averageOrderValue || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ) : <p className="text-gray-500 dark:text-gray-400">Cargando resumen...</p>}
              </section>

              {/* Estadísticas de Pedidos (por tipo y estado) */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-primary">Estadísticas de Pedidos</h2>
                {salesReportData.orderStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Pedidos por Tipo</h3>
                      <div className="space-y-2">
                        {Object.entries(salesReportData.orderStats.countByType || {}).map(([type, data]: [string, any]) => (
                          <div key={type} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{type.replace('_', ' ').toUpperCase()}</span>
                            <span className="font-medium text-sm text-gray-900 dark:text-white">${(data.totalValue || 0).toFixed(2)} ({data.count || 0} pedidos)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Pedidos por Estado</h3>
                      <div className="space-y-2">
                        {Object.entries(salesReportData.orderStats.countByStatus || {}).map(([status, data]: [string, any]) => (
                          <div key={status} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{status.replace('_', ' ').toUpperCase()}</span>
                            <span className="font-medium text-sm text-gray-900 dark:text-white">${(data.totalValue || 0).toFixed(2)} ({data.count || 0} pedidos)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : <p className="text-gray-500 dark:text-gray-400">Cargando estadísticas de pedidos...</p>}
              </section>

              {/* Ventas por Método de Pago */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-primary">Ventas por Método de Pago</h2>
                {salesReportData.paymentMethods && salesReportData.paymentMethods.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg shadow">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Método de Pago</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad de Transacciones</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {salesReportData.paymentMethods.map((pm) => (
                          <tr key={pm.paymentMethod}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{pm.paymentMethod.replace('_',' ').toUpperCase()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{pm.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${(pm.totalAmount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-gray-500 dark:text-gray-400">{(isLoadingSalesByPaymentMethod) ? 'Cargando métodos de pago...' : 'No hay datos de métodos de pago para el período seleccionado.'}</p>}
              </section>

              {/* Ingresos a lo Largo del Tiempo */}
              <section>
                <h2 className="text-xl font-semibold mb-4 text-primary">Ingresos a lo Largo del Tiempo</h2>
                {salesReportData.revenueOverTime && salesReportData.revenueOverTime.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg shadow">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ingresos</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {salesReportData.revenueOverTime.map((entry) => (
                          <tr key={entry.date}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(entry.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${(entry.revenue || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-gray-500 dark:text-gray-400">{(isLoadingRevenueOverTime) ? 'Cargando ingresos...' : 'No hay datos de ingresos para el período seleccionado.'}</p>}
              </section>
            </div>
          )}

          {selectedReport === 'EXPENSES' && expensesReport && (
            <div className="space-y-6">
              <div className="bg-accent/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Gastos Totales</h3>
                <p className="text-2xl font-bold">${expensesReport.totalExpenses.toFixed(2)}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Gastos por Categoría</h3>
                <div className="space-y-2">
                  {Object.entries(expensesReport.expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span>{category}</span>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'PRODUCTS' && productsReportData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-accent/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-1">Total de Productos</h3>
                  <p className="text-2xl font-bold">{productsReportData.stats?.totalProducts}</p>
                </div>
                <div className="bg-accent/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-1">Productos Disponibles</h3>
                  <p className="text-2xl font-bold">{productsReportData.stats?.activeProducts}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
                  <div className="space-y-2">
                    {productsReportData.topSelling?.map((product) => (
                      <div key={product.productId} className="flex justify-between items-center">
                        <span>{product.name}</span>
                        <div className="text-right">
                          <p className="font-medium">{product.totalQuantitySold} unidades</p>
                          <p className="text-sm text-muted-foreground">
                            ${product.totalRevenueGenerated.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Productos con Bajo Stock (Umbral: {lowStockThreshold})</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productsReportData.lowStock?.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category ? product.category.toString().replace('_',' ') : 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{product.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 