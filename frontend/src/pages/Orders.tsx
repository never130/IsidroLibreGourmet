import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Order, OrderStatus, OrderType, PaymentMethod, type UpdateOrderStatusDto, OrderItem as OrderItemType } from '../types/order';
import { Product } from '../types/product';
import { OrderForm } from '../components/orders/OrderForm';
import OrderTicket from '../components/orders/OrderTicket';
import { Printer } from 'lucide-react';

export function Orders() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<OrderType | 'ALL'>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [printingOrderData, setPrintingOrderData] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery<Order[], Error, Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await axios.get<Order[]>('/api/orders');
      return response.data;
    },
    select: (data: Order[]): Order[] => {
      return data.map(order => ({
        ...order,
        total: parseFloat(String(order.total)),
        items: order.items.map((item: OrderItemType) => ({
          ...item,
          price: parseFloat(String(item.price)),
          quantity: parseInt(String(item.quantity), 10),
        })),
      }));
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: OrderStatus }) => {
      const payload: UpdateOrderStatusDto = { status };
      const response = await axios.patch(`/api/orders/${orderId}/status`, payload); 
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await axios.post(`/api/orders/${orderId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      console.error('Error cancelling order:', error.response?.data?.message || error.message);
      // Considerar mostrar un toast o alerta al usuario
    }
  });

  const handleStatusFilterChange = (status: OrderStatus | 'ALL') => {
    setSelectedStatus(status);
  };

  const handleTypeFilterChange = (type: OrderType | 'ALL') => {
    setSelectedType(type);
  };

  const handleCreate = () => {
    setIsFormOpen(true);
  };

  const handleCreateOrderSuccess = (createdOrder: Order) => {
    setIsFormOpen(false);
    if (createdOrder && createdOrder.id) {
      navigate(`/pos/${createdOrder.id}`);
    } else {
      console.warn('Pedido creado, pero no se recibió ID para la redirección.');
      // Opcionalmente, notificar al usuario aquí
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleOpenPrintTicket = (order: Order) => {
    setPrintingOrderData(order);
  };

  const handleClosePrintTicket = () => {
    setPrintingOrderData(null);
  };

  const filteredOrders = orders?.filter(order => {
    if (selectedStatus !== 'ALL' && order.status !== selectedStatus) return false;
    if (selectedType !== 'ALL' && order.type !== selectedType) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ordenar por más reciente

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Gestión de Pedidos</h1>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Gestión de Pedidos</h1>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium mb-1">Estado</label>
              <select
                id="statusFilter"
                value={selectedStatus}
                onChange={(e) => handleStatusFilterChange(e.target.value as OrderStatus | 'ALL')}
                className="p-2 border rounded-md bg-card text-card-foreground"
              >
                <option value="ALL">Todos</option>
                {Object.values(OrderStatus).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="typeFilter" className="block text-sm font-medium mb-1">Tipo</label>
              <select
                id="typeFilter"
                value={selectedType}
                onChange={(e) => handleTypeFilterChange(e.target.value as OrderType | 'ALL')}
                className="p-2 border rounded-md bg-card text-card-foreground"
              >
                <option value="ALL">Todos</option>
                {Object.values(OrderType).map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex-grow flex justify-end">
              <button
                onClick={handleCreate}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Nuevo Pedido
              </button>
            </div>
          </div>
          
          {isFormOpen && <OrderForm onSuccess={handleCreateOrderSuccess} />}
          {printingOrderData && <OrderTicket order={printingOrderData} onClose={handleClosePrintTicket} />}

          <div className="bg-card rounded-lg shadow">
            {filteredOrders?.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No hay pedidos para mostrar con los filtros seleccionados.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredOrders?.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-accent/10">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg">Pedido #{order.id} <span className="text-xs font-normal text-muted-foreground">({order.type.replace('_',' ').toUpperCase()})</span></h3>
                        <p className="text-sm text-muted-foreground">Cliente: {order.customerName}</p>
                        {order.notes && <p className="text-xs italic text-muted-foreground">Notas: {order.notes}</p>}
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} items - Total: ${order.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Método de Pago: {(order.paymentMethod.toString().replace('_', ' ').toUpperCase())}</p>
                        <p className="text-xs text-muted-foreground">Atendido por: {order.createdBy?.username || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Creado: {new Date(order.createdAt).toLocaleString()}</p>
                        <ul className="text-xs list-disc list-inside pl-1 mt-1">
                          {order.items.map(item => (
                            <li key={item.id}>{item.quantity} x {item.product?.name || `Producto ID: ${item.productId}`} (${item.price.toFixed(2)} c/u)</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4 min-w-[180px]">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium w-full text-center ${
                          order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                          order.status === OrderStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                          order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                          order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800' // Default, no debería pasar
                        }`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex flex-col gap-2 w-full">
                          {order.status === OrderStatus.PENDING && (
                            <>
                              <button
                                onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: OrderStatus.IN_PROGRESS })}
                                className="text-xs w-full text-white bg-blue-500 hover:bg-blue-600 py-1 px-2 rounded disabled:opacity-50"
                                disabled={updateStatusMutation.isPending || cancelOrderMutation.isPending}
                              >
                                Marcar En Progreso
                              </button>
                              <button
                                onClick={() => cancelOrderMutation.mutate(order.id)}
                                className="text-xs w-full text-white bg-red-500 hover:bg-red-600 py-1 px-2 rounded disabled:opacity-50"
                                disabled={updateStatusMutation.isPending || cancelOrderMutation.isPending}
                              >
                                Cancelar Pedido
                              </button>
                            </>
                          )}
                          {order.status === OrderStatus.IN_PROGRESS && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: OrderStatus.COMPLETED })}
                              className="text-xs w-full text-white bg-green-500 hover:bg-green-600 py-1 px-2 rounded disabled:opacity-50"
                              disabled={updateStatusMutation.isPending || cancelOrderMutation.isPending}
                            >
                              Marcar Completado
                            </button>
                          )}
                          {(order.status === OrderStatus.COMPLETED || order.status === OrderStatus.IN_PROGRESS) && (
                            <button
                              onClick={() => handleOpenPrintTicket(order)}
                              className="text-xs w-full text-white bg-gray-500 hover:bg-gray-600 py-1 px-2 rounded flex items-center justify-center gap-1 disabled:opacity-50"
                              disabled={printingOrderData != null || updateStatusMutation.isPending || cancelOrderMutation.isPending}
                              title="Reimprimir Ticket"
                            >
                              <Printer size={12} /> Reimprimir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 