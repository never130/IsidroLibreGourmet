import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { CreateOrderDto, Order, CreateOrderItemDto } from '../../types/order';
import { OrderType, PaymentMethod } from '../../types/order';
import type { Product } from '../../types/product';
import { Button } from '@/components/ui/button';

const createOrderItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
});

const orderFormSchema = z.object({
  type: z.nativeEnum(OrderType),
  tableNumber: z.number().optional(),
  customerName: z.string().min(1, 'El nombre del cliente es requerido'),
  customerPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod, { required_error: 'El método de pago es requerido' }),
  notes: z.string().optional().nullable(),
  items: z.array(createOrderItemSchema).min(1, 'Debe agregar al menos un producto al pedido'),
}).superRefine((data, ctx) => {
  if (data.type === OrderType.DINE_IN && (data.tableNumber === undefined || data.tableNumber === null || data.tableNumber <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El número de mesa es requerido para pedidos en local y debe ser mayor a 0',
      path: ['tableNumber'],
    });
  }
  if (data.type === OrderType.DELIVERY && (!data.address || data.address.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La dirección es requerida para pedidos de delivery',
      path: ['address'],
    });
  }
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  onSuccess: (createdOrder: Order) => void;
  onCancel?: () => void;
  orderToEdit?: Order | null;
  initialOrderItems?: CreateOrderItemDto[];
}

export function OrderForm({ 
  onSuccess, 
  onCancel, 
  orderToEdit, 
  initialOrderItems 
}: OrderFormProps) {
  const queryClient = useQueryClient();
  const [selectedUIProducts, setSelectedUIProducts] = useState<Array<{ product: Product; quantity: number }>>([]);

  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[], Error, Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await axios.get<Product[]>('/api/products?isActive=true');
      return response.data;
    },
    select: (data: Product[]): Product[] => {
      return data.map(product => ({
        ...product,
        price: parseFloat(String(product.price)),
        cost: product.cost !== null && product.cost !== undefined ? parseFloat(String(product.cost)) : null,
        stock: parseInt(String(product.stock), 10),
      }));
    }
  });

  const isEditMode = !!orderToEdit;

  const mutation = useMutation<Order, Error, CreateOrderDto | { id: number; payload: Partial<CreateOrderDto> }>({
    mutationFn: async (data) => {
      if (isEditMode && orderToEdit) {
        throw new Error("La edición no está implementada aún en este formulario.");
      } else {
        const response = await axios.post<Order>('/api/orders', data as CreateOrderDto);
        return response.data;
      }
    },
    onSuccess: (createdOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess(createdOrder);
      reset();
      setSelectedUIProducts([]);
    },
    onError: (error: any) => {
      console.error('Error en la operación de orden:', error.response?.data || error.message);
      alert('Error al procesar la orden: ' + (error.response?.data?.message || error.message));
    }
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: orderToEdit ? 
      {
        type: orderToEdit.type,
        customerName: orderToEdit.customerName,
        customerPhone: orderToEdit.customerPhone,
        address: orderToEdit.address,
        paymentMethod: orderToEdit.paymentMethod,
        notes: orderToEdit.notes,
        items: orderToEdit.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      } :
      {
        type: OrderType.TAKE_AWAY,
        customerName: '',
        items: [],
        paymentMethod: PaymentMethod.CASH,
        notes: '',
      }
  });

  const orderType = watch('type');

  useEffect(() => {
    if (initialOrderItems && initialOrderItems.length > 0 && products && products.length > 0 && selectedUIProducts.length === 0) {
      const itemsFromPOS: Array<{ product: Product; quantity: number }> = [];
      initialOrderItems.forEach(item => {
        const productDetail = products.find(p => p.id === item.productId);
        if (productDetail) {
          itemsFromPOS.push({ product: productDetail, quantity: item.quantity });
        }
      });
      setSelectedUIProducts(itemsFromPOS);
    }
  }, [initialOrderItems, products, selectedUIProducts.length]);

  useEffect(() => {
    setValue('items', selectedUIProducts.map(p => ({
      productId: p.product.id,
      quantity: p.quantity,
    })), { shouldValidate: true });
  }, [selectedUIProducts, setValue]);

  const handleAddProduct = (productToAdd: Product) => {
    const productInStock = products?.find(p => p.id === productToAdd.id);
    if (!productInStock || productInStock.stock <= 0) {
        alert("Este producto no está disponible o no tiene stock.");
        return;
    }

    setSelectedUIProducts(prev => {
      const existingProduct = prev.find(p => p.product.id === productToAdd.id);
      if (existingProduct) {
        if (existingProduct.quantity < productInStock.stock) {
            return prev.map(p => p.product.id === productToAdd.id ? { ...p, quantity: p.quantity + 1 } : p);
        } else {
            alert("No se pueden añadir más unidades de este producto (stock máximo alcanzado).");
            return prev;
        }
      }
      return [...prev, { product: productInStock, quantity: 1 }];
    });
  };

  const handleRemoveProduct = (productIdToRemove: number) => {
    setSelectedUIProducts(prev => prev.filter(p => p.product.id !== productIdToRemove));
  };

  const handleUpdateQuantity = (productIdToUpdate: number, newQuantity: number) => {
    const productInStock = products?.find(p => p.id === productIdToUpdate);
    if (!productInStock) return;

    if (newQuantity >= 1 && newQuantity <= productInStock.stock) {
      setSelectedUIProducts(prev =>
        prev.map(p => p.product.id === productIdToUpdate ? { ...p, quantity: newQuantity } : p)
      );
    } else if (newQuantity > productInStock.stock) {
        alert(`Cantidad máxima para este producto es ${productInStock.stock}`);
        setSelectedUIProducts(prev =>
            prev.map(p => p.product.id === productIdToUpdate ? { ...p, quantity: productInStock.stock } : p)
        );
    }
  };

  const onSubmit = (formData: OrderFormData) => {
    if (isEditMode && orderToEdit) {
      console.warn("Submit de edición llamado, pero no implementado completamente");
    } else {
      const orderPayload: CreateOrderDto = {
        type: formData.type,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone || undefined,
        address: formData.address || undefined,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
        items: formData.items,
      };
      mutation.mutate(orderPayload);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-1 sm:p-4 bg-card text-card-foreground rounded-lg shadow max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-card py-2 z-10">{isEditMode ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
      <div>
        <label htmlFor="orderType" className="block text-sm font-medium mb-1">Tipo de Pedido</label>
        <select id="orderType" {...register('type')} className="w-full p-2 border rounded-md bg-input">
          <option value={OrderType.DINE_IN}>Comer en el local</option>
          <option value={OrderType.TAKE_AWAY}>Para llevar</option>
          <option value={OrderType.DELIVERY}>Delivery</option>
        </select>
        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
      </div>

      {orderType === OrderType.DINE_IN && (
        <div>
          <label htmlFor="tableNumber" className="block text-sm font-medium mb-1">Número de Mesa</label>
          <input id="tableNumber" {...register('tableNumber', { valueAsNumber: true })} type="number" className="w-full p-2 border rounded-md bg-input" placeholder="Número de mesa" />
          {errors.tableNumber && <p className="text-red-500 text-xs mt-1">{errors.tableNumber.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="customerName" className="block text-sm font-medium mb-1">Nombre del Cliente</label>
        <input id="customerName" {...register('customerName')} type="text" className="w-full p-2 border rounded-md bg-input" placeholder="Nombre del cliente" />
        {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
      </div>

      <div>
        <label htmlFor="customerPhone" className="block text-sm font-medium mb-1">Teléfono (Opcional)</label>
        <input id="customerPhone" {...register('customerPhone')} type="tel" className="w-full p-2 border rounded-md bg-input" placeholder="Teléfono del cliente" />
        {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone.message}</p>}
      </div>

      {orderType === OrderType.DELIVERY && (
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-1">Dirección de Entrega</label>
          <textarea id="address" {...register('address')} className="w-full p-2 border rounded-md bg-input" placeholder="Dirección de entrega" rows={3} />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">Método de Pago</label>
        <select id="paymentMethod" {...register('paymentMethod')} className="w-full p-2 border rounded-md bg-input">
          {Object.values(PaymentMethod).map(method => (
            <option key={method} value={method}>{method.replace('_', ' ').charAt(0).toUpperCase() + method.replace('_',' ').slice(1).toLowerCase()}</option>
          ))}
        </select>
        {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Productos en el Pedido</label>
        {selectedUIProducts.length === 0 && <p className="text-sm text-muted-foreground">No hay productos en el pedido. Agregue productos a continuación.</p>}
        <div className="space-y-2 mb-2">
          {selectedUIProducts.map((uiItem) => (
            <div key={uiItem.product.id} className="flex items-center justify-between p-2 border rounded-md">
              <div>
                <p className="font-medium">{uiItem.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${uiItem.product.price ? uiItem.product.price.toFixed(2) : 'N/A'} c/u (Stock: {uiItem.product.stock})
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max={uiItem.product.stock}
                  value={uiItem.quantity}
                  onChange={(e) => handleUpdateQuantity(uiItem.product.id, parseInt(e.target.value) || 1)}
                  className="w-20 p-2 border rounded-md bg-input text-center"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveProduct(uiItem.product.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={isSubmitting}
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
        {errors.items && !selectedUIProducts.length && <p className="text-red-500 text-xs mt-1">{errors.items.message}</p>}
        
        {!isEditMode && initialOrderItems && initialOrderItems.length > 0 ? null : (
          <div className="mt-2">
            <label htmlFor="productSelector" className="block text-sm font-medium mb-1">Agregar Producto Adicional</label>
            <select
              id="productSelector"
              className="w-full p-2 border rounded-md bg-input"
              onChange={(e) => {
                const productId = parseInt(e.target.value);
                if (productId) {
                  const product = products?.find(p => p.id === productId);
                  if (product) {
                    handleAddProduct(product);
                    e.target.value = ''; 
                  }
                }
              }}
              value=""
              disabled={isLoadingProducts || isSubmitting}
            >
              <option value="">{isLoadingProducts ? 'Cargando productos...' : 'Seleccionar producto adicional'}</option>
              {products?.filter(p => p.isActive && p.stock > 0 && !selectedUIProducts.find(item => item.product.id === p.id) ).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price ? product.price.toFixed(2) : 'N/A'} (Stock: {product.stock})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">Notas Adicionales (Opcional)</label>
        <textarea id="notes" {...register('notes')} className="w-full p-2 border rounded-md bg-input" placeholder="Notas adicionales para el pedido" rows={3} />
        {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-card py-2 z-10">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || mutation.isPending || selectedUIProducts.length === 0}>
          {isSubmitting || mutation.isPending ? 'Procesando...' : (isEditMode ? 'Actualizar Pedido' : 'Crear Pedido')}
        </Button>
      </div>
    </form>
  );
} 