/**
 * Componente de estadísticas de ventas
 * Muestra gráficos y métricas de ventas con filtros por fecha
 */

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registro de componentes de Chart.js necesarios
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Interfaz para las estadísticas de ventas
 */
interface SalesStats {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByType: Record<string, number>;
}

/**
 * Componente principal de estadísticas de ventas
 * @returns Componente React con gráficos y métricas
 */
export function SalesStats() {
  // Estado para el rango de fechas
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Consulta para obtener estadísticas generales
  const { data: salesStats, isLoading } = useQuery<SalesStats>({
    queryKey: ['salesStats', dateRange],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/reports/sales', {
        params: dateRange
      });
      return response.data;
    }
  });

  // Consulta para obtener ventas diarias
  const { data: dailySales } = useQuery<Record<string, number>>({
    queryKey: ['dailySales', dateRange],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/reports/daily-sales', {
        params: dateRange
      });
      return response.data;
    }
  });

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Datos para el gráfico de ventas diarias
  const chartData = {
    labels: Object.keys(dailySales || {}),
    datasets: [
      {
        label: 'Ventas Diarias',
        data: Object.values(dailySales || {}),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con filtros de fecha */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Estadísticas de Ventas</h2>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Ventas Totales</h3>
          <p className="text-3xl font-bold text-primary">
            ${salesStats?.totalSales.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total de Pedidos</h3>
          <p className="text-3xl font-bold text-primary">
            {salesStats?.totalOrders}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Valor Promedio</h3>
          <p className="text-3xl font-bold text-primary">
            ${salesStats?.averageOrderValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Ventas por tipo */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Ventas por Tipo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(salesStats?.salesByType || {}).map(([type, amount]) => (
            <div key={type} className="p-4 bg-gray-50 rounded">
              <p className="font-medium capitalize">{type.replace('_', ' ')}</p>
              <p className="text-xl font-bold text-primary">${amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de ventas diarias */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Ventas Diarias</h3>
        <div className="h-80">
          <Line data={chartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => `$${value}`
                }
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
} 