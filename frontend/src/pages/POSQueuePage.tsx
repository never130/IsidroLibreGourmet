import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { orderService } from '../services/orderService';
import type { Order, OrderItem as OrderItemType, OrderStatus } from '../types/order'; // Asegúrate que OrderStatus esté disponible
import { Loader2, AlertTriangle, ShoppingCart, ArrowRight } from 'lucide-react'; // Añadido ShoppingCart
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function POSQueuePage() {
  const { 
    data: activeOrders, 
    isLoading, 
    error 
  } = useQuery<Order[], Error, Order[]>({ // Especificar el tipo de salida de select si se usa
    queryKey: ['orders', 'activePos'], // Clave de query única para estos pedidos
    queryFn: () => orderService.getAllOrders({ statuses: ['pending', 'in_progress'] }),
    // Descomentar y ajustar si los precios/totales vienen como strings y necesitan conversión
    // select: (data: Order[]): Order[] => {
    //   return data.map(order => ({
    //     ...order,
    //     total: parseFloat(String(order.total)),
    //     items: order.items.map((item: OrderItemType) => ({
    //       ...item,
    //       price: parseFloat(String(item.price)),
    //       quantity: parseInt(String(item.quantity), 10),
    //     })),
    //   }));
    // },
    refetchInterval: 15000, // Opcional: Actualizar la cola cada 15 segundos
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-var(--header-height,4rem)-2rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Cargando pedidos activos...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,4rem)-2rem)] text-red-500 p-4">
          <AlertTriangle className="h-12 w-12 mb-2" />
          <p className="text-lg font-semibold">Error al cargar la cola de pedidos</p>
          <p>{error.message}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Cola de Pedidos - Punto de Venta</h1>
        
        {(!activeOrders || activeOrders.length === 0) && (
          <div className="text-center text-muted-foreground py-10">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl">No hay pedidos activos en este momento.</p>
            <p>Los nuevos pedidos pendientes o en progreso aparecerán aquí.</p>
          </div>
        )}

        {activeOrders && activeOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeOrders.map(order => (
              <Card key={order.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="font-semibold">Cliente:</span> {order.customerName || 'N/A'}</p>
                  <p><span className="font-semibold">Tipo:</span> {order.type.replace('_', ' ').toUpperCase()}</p>
                  {/* Asumimos que total y price ya son números o se manejan en el select */}
                  <p><span className="font-semibold">Total:</span> ${parseFloat(String(order.total)).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Items: {order.items.length} - Creado: {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                  <Button asChild className="w-full mt-3">
                    <Link to={`/pos/${order.id}`} className="flex items-center justify-center">
                      Procesar Pedido <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default POSQueuePage; 