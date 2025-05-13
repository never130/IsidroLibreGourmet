import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"; // Ruta actualizada
import { CreditCard, DollarSign, ShoppingCart } from 'lucide-react'; // Mantenemos iconos necesarios
import { DashboardSummaryData } from '../types/dashboard';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout'; // Importar MainLayout

const fetchDashboardSummary = async (): Promise<DashboardSummaryData> => {
  const { data } = await axios.get('/api/dashboard/summary');
  return data;
};
export function Dashboard() {
  const { user } = useAuth();

  const { 
    data: summary, 
    isLoading, 
    isError, 
    error 
  } = useQuery<DashboardSummaryData, Error>({
    queryKey: ['dashboardSummary'], 
    queryFn: fetchDashboardSummary,
    enabled: !!user, // Solo ejecutar si el usuario está cargado
  });

  if (isLoading) return <p className="text-center text-gray-500 py-8">Cargando datos del dashboard...</p>;
  if (isError) return <p className="text-center text-red-500 py-8">Error al cargar datos del dashboard: {error?.message || 'Error desconocido'}</p>;
  if (!summary) return <p className="text-center text-gray-500 py-8">No hay datos disponibles para mostrar.</p>;

  // Asegúrate de que totalAmount es un número antes de usarlo
  const salesTodayAmount = typeof summary.salesToday.totalAmount === 'number' ? summary.salesToday.totalAmount.toFixed(2) : '0.00';
  const expensesThisMonthAmount = typeof summary.expensesThisMonth.totalAmount === 'number' ? summary.expensesThisMonth.totalAmount.toFixed(2) : '0.00';

  return (
    <MainLayout title="Dashboard">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Tarjeta de Ventas de Hoy */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Ventas de Hoy</CardTitle>
              <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">${salesTodayAmount}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {summary.salesToday.orderCount} pedidos hoy
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta de Pedidos Pendientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos Pendientes</CardTitle>
              <ShoppingCart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.pendingOrdersCount}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Esperando preparación o entrega
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta de Gastos del Mes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Gastos (Este Mes)</CardTitle>
              <CreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400" /> 
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">${expensesThisMonthAmount}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {summary.expensesThisMonth.expenseCount} gastos registrados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
