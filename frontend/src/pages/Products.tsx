import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Layout } from '../components/layout/Layout';
import type { Product, ProductCategory } from '../types/product';
import { ProductForm } from '../components/products/ProductForm';

export function Products() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [filterIsActive, setFilterIsActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data: products, isLoading, error } = useQuery<Product[], Error, Product[]>({
    queryKey: ['products', debouncedSearchTerm, filterIsActive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) {
        params.append('term', debouncedSearchTerm);
      }
      if (filterIsActive === 'ACTIVE') {
        params.append('isActive', 'true');
      }
      if (filterIsActive === 'INACTIVE') {
        params.append('isActive', 'false');
      }
      const response = await axios.get<Product[]>(`/api/products?${params.toString()}`);
      return response.data;
    },
    select: (data: Product[]): Product[] => {
      return data.map(product => ({
        ...product,
        price: parseFloat(String(product.price)),
        cost: parseFloat(String(product.cost)),
        stock: parseInt(String(product.stock), 10),
      }));
    }
  });

  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: async (productId: number) => {
      await axios.delete(`/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleActiveMutation = useMutation<Product, Error, { productId: number }>({
    mutationFn: async ({ productId }) => {
      const response = await axios.patch(`/api/products/${productId}/toggle-active`);
      return response.data;
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value as ProductCategory | 'ALL');
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const categoriesForFilter: (ProductCategory | 'ALL')[] = ['ALL'];
  if (products) {
    const productCategories = Array.from(new Set(products.map(p => p.category))) as ProductCategory[];
    categoriesForFilter.push(...productCategories.sort());
  }

  const filteredProductsClientSide = products?.filter(product => {
    if (selectedCategory !== 'ALL' && product.category !== selectedCategory) return false;
    return true;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Gestión de Productos</h1>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar por nombre</label>
              <input
                id="searchTerm"
                type="text"
                placeholder="Ej: Hamburguesa"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por Categoría</label>
              <select 
                id="categoryFilter" 
                value={selectedCategory} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleCategoryChange(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                  {categoriesForFilter.map((category) => (
                    <option key={category} value={category}>
                      {category === 'ALL' ? 'Todas las categorías' : category}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por Estado</label>
              <select 
                id="statusFilter" 
                value={filterIsActive} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterIsActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="INACTIVE">Inactivos</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-md shadow-sm"
            >
              Nuevo Producto
            </button>
          </div>
          
          {isFormOpen && (
            <ProductForm 
              product={editingProduct} 
              onClose={() => {
                handleCloseForm();
                queryClient.invalidateQueries({ queryKey: ['products'] });
              }}
            />
          )}

          {isLoading && (
               <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
          )}
          {error && (
              <div className="text-red-500 text-center py-8">Error al cargar productos: {error.message}</div>
          )}

          {!isLoading && !error && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProductsClientSide && filteredProductsClientSide.length > 0 ? (
                filteredProductsClientSide.map((product) => (
                <div key={product.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col justify-between">
                  <div>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-md mb-2"
                      />
                    ) : (
                        <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-md mb-2 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">Sin imagen</span>
                        </div>
                    )}
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1 truncate" title={product.name}>{product.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 text-ellipsis overflow-hidden h-10">{product.description || 'Sin descripción'}</p>
                    <p className="font-bold text-primary mb-1">${product.price.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Stock: {product.stock}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Costo: ${product.cost.toFixed(2)}</p>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${product.isActive ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
                        {product.isActive ? 'Activo' : 'Inactivo'} 
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActiveMutation.mutate({ productId: product.id })}
                      disabled={toggleActiveMutation.isPending}
                      className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md shadow-sm disabled:opacity-50"
                    >
                      {toggleActiveMutation.isPending ? 'Cambiando...' : (product.isActive ? 'Desactivar' : 'Activar')}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que quieres eliminar este producto permanentemente?')) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md shadow-sm disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              )))
              : (
                <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12 text-gray-500 dark:text-gray-400">
                  No se encontraron productos con los filtros seleccionados.
                </div>
              )
            }
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 