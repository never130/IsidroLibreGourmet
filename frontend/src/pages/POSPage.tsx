import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { PlusCircle, Trash2, Search, XCircle, AlertTriangle, ShoppingCart } from 'lucide-react';
import type { Product } from '../types/product';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import type { CreateOrderItemDto } from '../types/order';
import type { Order } from '../types/order';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

const fetchPOSProducts = async (searchTerm: string): Promise<Product[]> => {
  const params = new URLSearchParams();
  params.append('isActive', 'true');
  if (searchTerm) {
    params.append('term', searchTerm);
  }
  const response = await axios.get(`/api/products?${params.toString()}`);
  return response.data.map((product: any) => ({
    ...product,
    price: parseFloat(product.price),
    cost: product.cost !== null && product.cost !== undefined ? parseFloat(product.cost) : null,
    stock: parseInt(product.stock, 10),
  }));
};

export function POSPage() {
  const [searchTermInput, setSearchTermInput] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTermInput);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTermInput]);

  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery<Product[], Error>({
    queryKey: ['posProducts', debouncedSearchTerm],
    queryFn: () => fetchPOSProducts(debouncedSearchTerm),
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Este producto no tiene stock disponible.');
      return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map(item => 
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          alert('No puedes añadir más unidades de las disponibles en stock.');
          return prevCart;
        }
      } else {
        return [...prevCart, { 
          productId: product.id, 
          name: product.name, 
          price: product.price, 
          quantity: 1, 
          stock: product.stock 
        }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    const itemInCart = cart.find(item => item.productId === productId);
    if (!itemInCart) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity > itemInCart.stock) {
      alert(`No puedes seleccionar más de ${itemInCart.stock} unidades (stock disponible).`);
    } else {
      setCart(prevCart => 
        prevCart.map(item => 
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleProcessOrder = () => {
    if (cart.length === 0) {
        alert('El carrito está vacío.');
        return;
    }
    setIsOrderModalOpen(true);
  };

  const handleOrderModalClose = () => {
    setIsOrderModalOpen(false);
  };

  const handleOrderCreated = async (createdOrder: Order) => {
    setIsOrderModalOpen(false);
    setCart([]);
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    alert('¡Orden creada exitosamente!');

    // INICIO: Lógica de Impresión
    try {
      // 'createdOrder' contiene el ID y los datos de la orden
      // Asumimos que la variable de entorno VITE_API_URL está configurada
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.post(`${apiUrl}/api/orders/${createdOrder.id}/print`);
      console.log('Solicitud de impresión enviada para la orden:', createdOrder.id);
      // Opcional: Mostrar notificación de éxito de impresión (ej. usando un toast)
    } catch (error) {
      console.error('Error al solicitar la impresión:', error);
      // Opcional: Mostrar notificación de error de impresión al usuario
      alert('La orden fue creada, pero hubo un error al intentar imprimir el recibo. Revise la conexión de la impresora y la configuración del backend.');
    }
    // FIN: Lógica de Impresión
  };

  const cartItemsForModal: CreateOrderItemDto[] = cart.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  return (
    <Layout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-var(--header-height,4rem)-2rem)] gap-4 p-4">
        <div className="md:w-2/3 lg:w-3/4 flex flex-col gap-4">
          <Card className="shadow-lg">
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar productos (activos y con stock)..."
                  value={searchTermInput}
                  onChange={(e) => setSearchTermInput(e.target.value)}
                  className="flex-grow"
                />
              </div>
            </CardHeader>
          </Card>
          <Card className="flex-grow overflow-hidden shadow-lg">
            <ScrollArea className="h-full">
            {isLoadingProducts && (
                <div className="flex justify-center items-center h-full p-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            )}
            {productsError && (
                <div className="flex flex-col justify-center items-center h-full text-red-500 p-4">
                    <AlertTriangle className="h-12 w-12 mb-2" />
                    <p>Error al cargar productos: {productsError.message}</p>
                </div>
            )}
            {!isLoadingProducts && !productsError && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-3">
                {products && products.length > 0 ? products.map((product) => (
                  <Button 
                    key={product.id} 
                    variant={product.stock > 0 ? "outline" : "secondary"} 
                    className={`h-auto p-3 flex flex-col items-center justify-center text-center space-y-1 product-card shadow-sm hover:shadow-lg transition-shadow duration-150 ease-in-out ${product.stock <= 0 ? 'opacity-60 cursor-not-allowed bg-slate-50 hover:bg-slate-100' : 'hover:border-primary'}`}
                    onClick={() => product.stock > 0 && addToCart(product)}
                    disabled={product.stock <= 0}
                    title={product.name}
                  >
                    <span className="font-semibold text-sm truncate w-full">{product.name}</span>
                    <span className="text-xs text-gray-600">${product.price ? product.price.toFixed(2) : 'N/A'}</span>
                    {product.stock <= 0 && <span className='text-xs text-red-600 font-medium'>(Agotado)</span>}
                    {product.stock > 0 && product.stock < 10 && <span className='text-xs text-amber-600 font-medium'>(Stock bajo: {product.stock})</span>}
                  </Button>
                )) : (
                  <p className="col-span-full text-center text-muted-foreground py-10">
                    No se encontraron productos.
                  </p>
                )}
              </div>
            )}
            </ScrollArea>
          </Card>
        </div>

        <div className="md:w-1/3 lg:w-1/4 flex flex-col gap-4">
          <Card className="flex-grow flex flex-col shadow-lg">
            <CardHeader className="p-4 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center"><ShoppingCart className="h-5 w-5 mr-2 text-primary"/>Pedido Actual</CardTitle>
                {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearCart} className="text-destructive hover:text-destructive px-2">
                        <XCircle className="h-4 w-4 mr-1" /> Vaciar
                    </Button>
                )}
              </div>
            </CardHeader>
            <ScrollArea className="flex-grow">
                <CardContent className="p-3 space-y-2">
                {cart.length === 0 && (
                    <p className="text-center text-muted-foreground py-10">El carrito está vacío.</p>
                )}
                {cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-2 p-2 border rounded-md hover:bg-slate-50 transition-colors duration-150 ease-in-out">
                        <div className="flex-grow">
                            <p className="text-sm font-medium truncate" title={item.name}>{item.name}</p>
                            <p className="text-xs text-muted-foreground">${item.price ? item.price.toFixed(2) : 'N/A'} x {item.quantity}</p>
                        </div>
                        <Input 
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateQuantity(item.productId, isNaN(val) ? 1 : val);
                            }}
                            className="w-16 h-8 text-sm text-center"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => removeFromCart(item.productId)} title="Eliminar item">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                </CardContent>
            </ScrollArea>
            {cart.length > 0 && (
              <div className="p-4 border-t mt-auto bg-slate-50 rounded-b-md">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary">${calculateTotal()}</span>
                </div>
                <Button className="w-full h-12 text-lg bg-green-500 hover:bg-green-700 text-white" onClick={handleProcessOrder} size="lg" disabled={cart.length === 0}>
                  <PlusCircle className="h-5 w-5 mr-2" /> Procesar Pedido
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
      {isOrderModalOpen && (
        <OrderFormModal
          isOpen={isOrderModalOpen}
          onClose={handleOrderModalClose}
          onOrderCreated={handleOrderCreated}
          initialItems={cartItemsForModal}
        />
      )}
    </Layout>
  );
}

export default POSPage; 