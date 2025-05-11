import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Order } from '../../types/order';
import { OrderStatus } from '../../types/order';

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [OrderStatus.READY]: 'bg-green-100 text-green-800',
  [OrderStatus.DELIVERED]: 'bg-gray-100 text-gray-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800'
};

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.IN_PROGRESS]: 'En Progreso',
  [OrderStatus.READY]: 'Listo',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado'
};

export function OrderList() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/orders');
      return response.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: OrderStatus }) => {
      const response = await axios.patch(`http://localhost:3000/api/orders/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await axios.post(`http://localhost:3000/api/orders/${orderId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const reprintMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await axios.post(`http://localhost:3000/api/orders/${orderId}/reprint`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        Error al cargar los pedidos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders?.map((order) => (
        <div
          key={order.id}
          className="bg-white shadow rounded-lg overflow-hidden"
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Pedido #{order.id}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>

            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} x ${item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium">${item.subtotal.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Subtotal</p>
                  <p className="text-sm text-gray-500">IVA (19%)</p>
                  <p className="font-semibold">Total</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">${order.subtotal.toFixed(2)}</p>
                  <p className="text-sm">${order.tax.toFixed(2)}</p>
                  <p className="font-semibold">${order.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                className="text-blue-600 hover:text-blue-800"
                onClick={() => reprintMutation.mutate(order.id)}
                disabled={reprintMutation.isPending}
              >
                Reimprimir
              </button>
              {order.status === OrderStatus.PENDING && (
                <>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: OrderStatus.IN_PROGRESS })}
                    disabled={updateStatusMutation.isPending}
                  >
                    En Progreso
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    onClick={() => cancelMutation.mutate(order.id)}
                    disabled={cancelMutation.isPending}
                  >
                    Cancelar
                  </button>
                </>
              )}
              {order.status === OrderStatus.IN_PROGRESS && (
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: OrderStatus.READY })}
                  disabled={updateStatusMutation.isPending}
                >
                  Marcar como Listo
                </button>
              )}
              {order.status === OrderStatus.READY && (
                <button
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: OrderStatus.DELIVERED })}
                  disabled={updateStatusMutation.isPending}
                >
                  Marcar como Entregado
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 