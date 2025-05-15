import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { PlusCircle, AlertTriangle, ShoppingCart, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import type { Order, OrderItem } from '../types/order';
import { orderService } from '../services/orderService';
import { Link } from 'react-router-dom';

export function POSPage() {
  const queryClient = useQueryClient();
  const { orderId } = useParams<{ orderId: string }>();

  const { 
    data: currentOrder, 
    isLoading: isLoadingOrder, 
    error: orderError 
  } = useQuery<Order, Error>({
    queryKey: ['orders', orderId],
    queryFn: () => {
      if (!orderId) throw new Error("Order ID is required");
      return orderService.getOrderById(Number(orderId));
    },
    enabled: !!orderId,
    retry: 1,
  });

  const completeOrderMutation = useMutation<Order, Error, number>({
    mutationFn: orderService.completeOrder,
    onSuccess: (completedOrder) => {
      console.log('Orden completada y stock actualizado en backend:', completedOrder);
      alert('¡Pedido completado y stock de ingredientes actualizado exitosamente!');

      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (completedOrder && completedOrder.id) {
        queryClient.invalidateQueries({ queryKey: ['orders', completedOrder.id.toString()] });
      }
    },
    onError: (error) => {
      console.error('Error al completar la orden y actualizar stock:', error);
      alert(`Error al procesar la completitud del pedido: ${error.message}. El stock podría no estar actualizado.`);
    },
  });

  const calculateTotal = () => {
    return currentOrder?.total?.toFixed(2) || '0.00';
  };

  const handleProcessOrder = () => {
    if (!currentOrder) {
        alert('No hay un pedido cargado para procesar.');
        return;
    }
    completeOrderMutation.mutate(currentOrder.id);
  };

  if (!orderId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,4rem)-2rem)] gap-4 p-4">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-semibold">ID de Pedido no encontrado</h2>
          <p className="text-muted-foreground">
            No se especificó un ID de pedido en la URL.
          </p>
          <Button asChild>
            <Link to="/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Pedidos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoadingOrder) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-var(--header-height,4rem)-2rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Cargando pedido...</p>
        </div>
      </Layout>
    );
  }

  if (orderError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,4rem)-2rem)] text-red-500 p-4">
          <AlertTriangle className="h-12 w-12 mb-2" />
          <p className="text-lg font-semibold">Error al cargar el pedido #{orderId}</p>
          <p>{orderError.message}</p>
          <Button asChild className="mt-4">
            <Link to="/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Pedidos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (!currentOrder) {
     return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,4rem)-2rem)] text-muted-foreground p-4">
          <AlertTriangle className="h-12 w-12 mb-2" />
          <p className="text-lg font-semibold">Pedido #{orderId} no encontrado.</p>
          <p>Es posible que el pedido haya sido eliminado o el ID sea incorrecto.</p>
           <Button asChild className="mt-4">
            <Link to="/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Pedidos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handlePrintOrder = async (orderToPrint: Order) => {
    if (!orderToPrint || !orderToPrint.id) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.post(`${apiUrl}/api/orders/${orderToPrint.id}/print`);
      console.log('Solicitud de impresión enviada para la orden:', orderToPrint.id);
    } catch (error) {
      console.error('Error al solicitar la impresión:', error);
      alert('La orden fue completada, pero hubo un error al intentar imprimir el recibo. Revise la conexión de la impresora y la configuración del backend.');
    }
  };

  completeOrderMutation.options.onSuccess = (completedOrder) => {
    console.log('Orden completada y stock actualizado en backend:', completedOrder);
    alert('¡Pedido completado y stock de ingredientes actualizado exitosamente!');

    queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    if (completedOrder && completedOrder.id) {
      queryClient.invalidateQueries({ queryKey: ['orders', completedOrder.id.toString()] });
    }
    handlePrintOrder(completedOrder);
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-var(--header-height,4rem)-2rem)] gap-4 p-4">
        <div className="md:w-2/3 lg:w-3/4 flex flex-col gap-4">
          <Card className="shadow-lg">
            <CardHeader className="p-4">
              <CardTitle className="text-xl">Detalles del Pedido #{currentOrder.id}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p><span className="font-semibold">Cliente:</span> {currentOrder.customerName || 'No especificado'}</p>
              <p><span className="font-semibold">Teléfono:</span> {currentOrder.customerPhone || 'No especificado'}</p>
              {currentOrder.address && <p><span className="font-semibold">Dirección:</span> {currentOrder.address}</p>}
              <p><span className="font-semibold">Tipo:</span> {currentOrder.type}</p>
              <p><span className="font-semibold">Estado:</span> {currentOrder.status}</p>
              <p><span className="font-semibold">Método de Pago:</span> {currentOrder.paymentMethod}</p>
              {currentOrder.notes && <p><span className="font-semibold">Notas:</span> {currentOrder.notes}</p>}
               <p><span className="font-semibold">Creado por:</span> {currentOrder.createdBy?.username || 'N/A'}</p>
              <p><span className="font-semibold">Fecha Creación:</span> {new Date(currentOrder.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="flex-grow overflow-hidden shadow-lg">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg">Ítems del Pedido</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-grow">
              <CardContent className="p-3 space-y-2">
                {currentOrder.items && currentOrder.items.length > 0 ? (
                  currentOrder.items.map((item: OrderItem) => (
                    <div key={item.id || item.productId} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                      <div>
                        <p className="text-sm font-medium truncate" title={item.product?.name || `Producto ID ${item.productId}`}>
                          {item.product?.name || `Producto ID ${item.productId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x ${item.price?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-10">Este pedido no tiene ítems.</p>
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>

        <Card className="md:w-1/3 lg:w-1/4 flex flex-col shadow-lg">
          <CardHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-primary"/>
                Procesar Compra
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 flex-grow space-y-2">
            <p className="text-sm text-muted-foreground">Revisa los detalles del pedido antes de completar.</p>
          </CardContent>
          <div className="p-4 border-t mt-auto bg-slate-50 rounded-b-md">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-xl font-bold text-primary">${calculateTotal()}</span>
            </div>
            <Button 
              className="w-full h-12 text-lg bg-green-500 hover:bg-green-700 text-white"
              onClick={handleProcessOrder} 
              size="lg" 
              disabled={!currentOrder || (currentOrder.status !== 'pending' && currentOrder.status !== 'in_progress') || completeOrderMutation.isPending}
            >
              {completeOrderMutation.isPending ? 
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Procesando...</> : 
                <><CheckCircle className="h-5 w-5 mr-2" /> Completar y Cobrar Pedido</>}
            </Button>
            {(currentOrder.status === 'completed' || currentOrder.status === 'cancelled') && (
                <p className="text-sm text-center mt-3 text-muted-foreground">
                    Este pedido ya está {currentOrder.status === 'completed' ? 'completado' : 'cancelado'}.
                </p>
            )}
             <Button variant="outline" className="w-full mt-3" asChild>
                <Link to="/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Lista de Pedidos</Link>
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

export default POSPage; 