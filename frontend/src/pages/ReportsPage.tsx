/**
 * Página principal de reportes
 * Integra los componentes de estadísticas y productos más vendidos
 * con navegación por pestañas
 */

import { useState } from 'react';
import { SalesStats } from '../components/reports/SalesStats';
import { TopProducts } from '../components/reports/TopProducts';

/**
 * Componente de página de reportes
 * @returns Componente React con navegación por pestañas y visualizaciones
 */
export function ReportsPage() {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<'sales' | 'products'>('sales');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado de la página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reportes y Estadísticas</h1>
        <p className="text-gray-600 mt-2">
          Visualiza el rendimiento de tu negocio y toma decisiones basadas en datos
        </p>
      </div>

      {/* Navegación por pestañas */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`${
              activeTab === 'sales'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Estadísticas de Ventas
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`${
              activeTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Productos Más Vendidos
          </button>
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'sales' ? (
          <div className="p-6">
            <SalesStats />
          </div>
        ) : (
          <div className="p-6">
            <TopProducts />
          </div>
        )}
      </div>
    </div>
  );
} 