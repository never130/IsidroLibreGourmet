import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse, AxiosError } from 'axios';
import type { Product } from '../../types/product';
import { ProductCategory } from '../../types/product';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  cost: z.number().min(0, 'El costo debe ser mayor o igual a 0'),
  category: z.nativeEnum(ProductCategory, { errorMap: () => ({ message: 'Categoría inválida' }) }),
  imageUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      stock: Number(product.stock),
      cost: Number(product.cost),
      category: product.category,
      imageUrl: product.imageUrl ?? '',
      isActive: product.isActive,
    } : {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      cost: 0,
      category: ProductCategory.FOOD,
      imageUrl: '',
      isActive: true,
    }
  });

  const mutation = useMutation<AxiosResponse<Product>, AxiosError, ProductFormData>({
    mutationFn: async (data: ProductFormData): Promise<AxiosResponse<Product>> => {
      const payload = { ...data };

      if (payload.imageUrl === '') {
        delete payload.imageUrl;
      }

      if (product && product.id) {
        return axios.put<Product>(`/api/products/${product.id}`, payload);
      } else {
        return axios.post<Product>('/api/products', payload);
      }
    },
    onSuccess: (response: AxiosResponse<Product>) => {
      console.log("Producto guardado:", response.data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
      reset();
    },
    onError: (error: AxiosError) => {
      let errorMessage = "Error desconocido";
      if (error.response && error.response.data && typeof (error.response.data as any).message === 'string') {
        errorMessage = (error.response.data as any).message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error("Error al guardar el producto:", error.response?.data || error.message);
      alert(`Error al guardar: ${errorMessage}`);
    }
  });

  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{product ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Nombre</label>
            <input id="name" {...register('name')} type="text" className="w-full p-2 border rounded-md bg-input" />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Descripción</label>
            <textarea id="description" {...register('description')} className="w-full p-2 border rounded-md bg-input" rows={3} />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">Precio</label>
              <input id="price" {...register('price', { valueAsNumber: true })} type="number" step="0.01" className="w-full p-2 border rounded-md bg-input" />
              {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium mb-1">Stock</label>
              <input id="stock" {...register('stock', { valueAsNumber: true })} type="number" step="1" className="w-full p-2 border rounded-md bg-input" />
              {errors.stock && <p className="text-sm text-red-600 mt-1">{errors.stock.message}</p>}
            </div>
            <div>
              <label htmlFor="cost" className="block text-sm font-medium mb-1">Costo</label>
              <input id="cost" {...register('cost', { valueAsNumber: true })} type="number" step="0.01" className="w-full p-2 border rounded-md bg-input" />
              {errors.cost && <p className="text-sm text-red-600 mt-1">{errors.cost.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">Categoría</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select {...field} id="category" className="w-full p-2 border rounded-md bg-input">
                  {Object.values(ProductCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            />
            {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">URL de la Imagen</label>
            <input id="imageUrl" {...register('imageUrl')} type="text" className="w-full p-2 border rounded-md bg-input" />
            {errors.imageUrl && <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input id="isActive" {...register('isActive')} type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium">Activo</label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Guardando...' : (product ? 'Actualizar Producto' : 'Crear Producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 