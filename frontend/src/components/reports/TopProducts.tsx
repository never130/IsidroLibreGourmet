/**
 * Componente de productos más vendidos
 * Muestra gráficos y tabla de los productos con mayor volumen de ventas
 */

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registro de componentes de Chart.js necesarios
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Interfaz para los datos de un producto más vendido
 */
interface TopProduct {
  product: {
    id: number;
    name: string;
    price: number;
  };
  totalQuantity: number;
  totalSales: number;
}

/**
 * Componente principal de productos más vendidos
 * @returns Componente React con gráficos y tabla de productos
 */
export function TopProducts() {
  // Estado para el rango de fechas
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Consulta para obtener productos más vendidos
  const { data: topProducts, isLoading } = useQuery<TopProduct[]>({
    queryKey: ['topProducts', dateRange],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/reports/top-products', {
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

  // Datos para el gráfico de barras
  const chartData = {
    labels: topProducts?.map(p => p.product.name) || [],
    datasets: [
      {
        label: 'Cantidad Vendida',
        data: topProducts?.map(p => p.totalQuantity) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      },
      {
        label: 'Ventas Totales ($)',
        data: topProducts?.map(p => p.totalSales) || [],
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con filtros de fecha */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Productos Más Vendidos</h2>
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

      {/* Gráfico de barras */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="h-96">
          <Bar data={chartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value: number) => `$${value}`
                }
              }
            }
          }} />
        </div>
      </div>

      {/* Tabla de detalles */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Detalles de Productos</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Vendida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas Totales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Unitario
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts?.map((product) => (
                <tr key={product.product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.totalQuantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${product.totalSales.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${product.product.price.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 