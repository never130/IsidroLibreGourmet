import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse, AxiosError } from 'axios';
import type { Product } from '../../types/product';
import { ProductCategory } from '../../types/product';
import type { Recipe, RecipeItemDto as FrontendRecipeItemDto, CreateRecipeDto, UpdateRecipeDto } from '../../types/recipe';
import type { Ingredient } from '../../types/ingredient';
import { ingredientService } from '../../services/ingredientService';
import { recipeService } from '../../services/recipeService';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Search, Loader2 } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0').optional(),
  cost: z.number().min(0, 'El costo debe ser mayor o igual a 0'),
  category: z.nativeEnum(ProductCategory, { errorMap: () => ({ message: 'Categoría inválida' }) }),
  imageUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  isActive: z.boolean(),
  manageStock: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const queryClient = useQueryClient();
  const [recipeItems, setRecipeItems] = useState<FrontendRecipeItemDto[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [selectedIngredientQuantity, setSelectedIngredientQuantity] = useState<string>('1');
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);

  const { data: allIngredients, isLoading: isLoadingIngredients } = useQuery<Ingredient[], Error>({
    queryKey: ['ingredients'],
    queryFn: ingredientService.getAll,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (product && product.id) {
      setCurrentRecipe(null);
      setRecipeItems([]);
      recipeService.getByProductId(product.id).then(data => {
        if (data) {
          setCurrentRecipe(data);
          setRecipeItems(data.items.map(item => ({ 
            ingredientId: item.ingredientId, 
            quantity: item.quantity, 
            notes: item.notes 
          })));
        }
      }).catch(err => {
        console.error("Error fetching recipe by product ID:", err);
      });
    } else {
      setCurrentRecipe(null);
      setRecipeItems([]);
    }
  }, [product]);

  const { register, handleSubmit, formState: { errors }, control, reset, watch: formWatch, setValue } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      stock: product.manageStock ? Number(product.stock) : undefined,
      cost: Number(product.cost),
      category: product.category,
      imageUrl: product.imageUrl ?? '',
      isActive: product.isActive,
      manageStock: product.manageStock,
    } : {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      cost: 0,
      category: ProductCategory.PLATOS_FUERTES,
      imageUrl: '',
      isActive: true,
      manageStock: true,
    }
  });

  const manageStockValue = formWatch('manageStock');

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description ?? '',
        price: Number(product.price),
        stock: product.manageStock ? Number(product.stock) : undefined,
        cost: Number(product.cost),
        category: product.category,
        imageUrl: product.imageUrl ?? '',
        isActive: product.isActive,
        manageStock: product.manageStock,
      });
      if (!product.manageStock) {
        setRecipeItems([]);
        recipeService.getByProductId(product.id).then(data => {
          if (data) {
            setCurrentRecipe(data);
            setRecipeItems(data.items.map(item => ({ 
              ingredientId: item.ingredientId, 
              quantity: item.quantity, 
              notes: item.notes 
            })));
          }
        }).catch(err => {
          console.error("Error fetching recipe for existing product:", err);
          setCurrentRecipe(null);
          setRecipeItems([]);
        });
      } else {
        setCurrentRecipe(null);
        setRecipeItems([]);
      }
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        stock: manageStockValue ? 0 : undefined,
        cost: 0,
        category: ProductCategory.PLATOS_FUERTES,
        imageUrl: '',
        isActive: true,
        manageStock: true,
      });
      setCurrentRecipe(null);
      setRecipeItems([]);
      if (manageStockValue) {
        setValue('stock', 0);
      } else {
        setValue('stock', undefined);
      }
    }
  }, [product, reset]);

  useEffect(() => {
    if (manageStockValue) {
      setRecipeItems([]);
      setCurrentRecipe(null);
      if (product && product.manageStock) {
        setValue('stock', Number(product.stock));
      } else if (product && !product.manageStock) {
        setValue('stock', 0);
      } else if (!product) {
        setValue('stock', 0);
      }
    } else {
      setValue('stock', undefined);
      if (product && !product.manageStock) {
        if (recipeItems.length === 0) {
          recipeService.getByProductId(product.id).then(data => {
            if (data) {
              setCurrentRecipe(data);
              setRecipeItems(data.items.map(item => ({ 
                ingredientId: item.ingredientId, 
                quantity: item.quantity, 
                notes: item.notes 
              })));
            }
          }).catch(err => {
            console.error("Error refetching recipe on manageStock change:", err);
          });
        }
      } else if (product && product.manageStock) {
        setRecipeItems([]);
        setCurrentRecipe(null);
      }
    }
  }, [manageStockValue, product, setValue]);

  const productMutation = useMutation<AxiosResponse<Product>, AxiosError, ProductFormData>({
    mutationFn: async (data: ProductFormData): Promise<AxiosResponse<Product>> => {
      const payload = { ...data };
      if (payload.imageUrl === '') {
        delete payload.imageUrl;
      }
      
      if (payload.manageStock) {
        if (payload.stock === undefined || payload.stock === null || isNaN(payload.stock)) {
          payload.stock = 0;
        }
      } else {
        payload.stock = 0;
      }

      if (product && product.id) {
        return axios.put<Product>(`/api/products/${product.id}`, payload);
      } else {
        return axios.post<Product>('/api/products', payload);
      }
    },
    onSuccess: async (response: AxiosResponse<Product>) => {
      const savedProduct = response.data;
      queryClient.invalidateQueries({ queryKey: ['products'] });

      let recipeErrorOccurred = false;
      let recipeOperationAttempted = false; 

      setIsSavingRecipe(true);

      if (savedProduct && savedProduct.id) {
        if (savedProduct.manageStock) {
          if (currentRecipe && currentRecipe.id) {
            try {
              await recipeService.delete(currentRecipe.id);
              console.log(`Receta ${currentRecipe.id} eliminada para producto ${savedProduct.id} porque manageStock es true.`);
              setCurrentRecipe(null);
              setRecipeItems([]);
              queryClient.invalidateQueries({ queryKey: ['recipes', savedProduct.id] });
              queryClient.invalidateQueries({ queryKey: ['recipes'] });
            } catch (deleteError) {
              console.error("Error eliminando receta antigua:", deleteError);
              alert("El producto se guardó, pero hubo un error eliminando su receta anterior. Por favor, verifíquela manualmente.");
              recipeErrorOccurred = true;
            }
          }
          recipeOperationAttempted = true;
        } else {
          recipeOperationAttempted = true;
          try {
            if (recipeItems.length > 0) {
              const recipePayload: CreateRecipeDto | UpdateRecipeDto = {
                items: recipeItems,
                name: `Receta para ${savedProduct.name}`,
                description: currentRecipe?.description,
                notes: currentRecipe?.notes
              };
              if (currentRecipe && currentRecipe.id) {
                await recipeService.update(currentRecipe.id, recipePayload as UpdateRecipeDto);
              } else {
                await recipeService.create({ ...recipePayload, productId: savedProduct.id } as CreateRecipeDto);
              }
            } else if (currentRecipe && currentRecipe.id) {
              await recipeService.delete(currentRecipe.id);
              setCurrentRecipe(null);
            }
            queryClient.invalidateQueries({ queryKey: ['recipes', savedProduct.id] });
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
          } catch (recipeError) {
            console.error("Error al guardar la receta:", recipeError);
            alert("El producto se guardó, pero hubo un error con su receta. Por favor, verifique los detalles de la receta.");
            recipeErrorOccurred = true;
          }
        }
      } else {
        recipeOperationAttempted = true;
      }
      
      setIsSavingRecipe(false);

      if ((recipeOperationAttempted && !recipeErrorOccurred) || !savedProduct || !savedProduct.id ) {
        onClose();
      }
    },
    onError: (error: AxiosError) => {
      let errorMessage = "Error desconocido al guardar el producto";
      if (error.response && error.response.data && typeof (error.response.data as any).message === 'string') {
        errorMessage = (error.response.data as any).message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error("Error al guardar el producto:", error.response?.data || error.message);
      alert(`Error al guardar el producto: ${errorMessage}`);
      setIsSavingRecipe(false);
    }
  });

  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    productMutation.mutate(data);
  };

  const handleAddRecipeItem = () => {
    if (!selectedIngredientId || !selectedIngredientQuantity) {
      alert("Seleccione un ingrediente y especifique una cantidad.");
      return;
    }
    const ingredientIdNum = parseInt(selectedIngredientId, 10);
    const quantityNum = parseFloat(selectedIngredientQuantity);

    if (isNaN(ingredientIdNum) || isNaN(quantityNum) || quantityNum <= 0) {
      alert("ID de ingrediente o cantidad inválida.");
      return;
    }

    const existingItem = recipeItems.find(item => item.ingredientId === ingredientIdNum);
    if (existingItem) {
        alert("Este ingrediente ya está en la receta. Edite la cantidad o elimínelo y vuelva a agregarlo.");
        return;
    }

    setRecipeItems([...recipeItems, { ingredientId: ingredientIdNum, quantity: quantityNum, notes: '' }]);
    setSelectedIngredientId('');
    setSelectedIngredientQuantity('1');
  };

  const handleRemoveRecipeItem = (ingredientIdToRemove: number) => {
    setRecipeItems(recipeItems.filter(item => item.ingredientId !== ingredientIdToRemove));
  };

  const isCurrentlySaving = productMutation.isPending || isSavingRecipe;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{product ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isCurrentlySaving}>&times;</button>
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
            {manageStockValue && (
              <div>
                <label htmlFor="stock" className="block text-sm font-medium mb-1">Stock</label>
                <input id="stock" {...register('stock', { valueAsNumber: true })} type="number" step="1" className="w-full p-2 border rounded-md bg-input" />
                {errors.stock && <p className="text-sm text-red-600 mt-1">{errors.stock.message}</p>}
              </div>
            )}
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
            <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">URL de Imagen (Opcional)</label>
            <input id="imageUrl" {...register('imageUrl')} type="text" className="w-full p-2 border rounded-md bg-input" />
            {errors.imageUrl && <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                    <input 
                        type="checkbox" 
                        id="isActive" 
                        checked={field.value} 
                        onChange={(e) => field.onChange(e.target.checked)} 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                )}
            />
            <label htmlFor="isActive" className="text-sm font-medium">Activo</label>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
                name="manageStock"
                control={control}
                render={({ field }) => (
                    <input 
                        type="checkbox" 
                        id="manageStock" 
                        checked={field.value} 
                        onChange={(e) => field.onChange(e.target.checked)} 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                )}
            />
            <label htmlFor="manageStock" className="text-sm font-medium">Gestionar Stock Directamente</label>
          </div>
          <p className="text-xs text-muted-foreground">
            Si está marcado, el stock de este producto se maneja directamente (ej: Gaseosas). Si no, el stock se descontará de los ingredientes de su receta (ej: Platos preparados).
          </p>

          {!manageStockValue && (
            <div className="space-y-3 pt-3 border-t">
              <h3 className="text-lg font-medium">Receta (Para productos que no gestionan stock directamente)</h3>
              {isLoadingIngredients && <p>Cargando ingredientes...</p>}
              {allIngredients && (
                <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <Label htmlFor="ingredient-select">Ingrediente</Label>
                    <ShadcnSelect value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                      <SelectTrigger id="ingredient-select"><SelectValue placeholder="Seleccionar ingrediente" /></SelectTrigger>
                      <SelectContent>
                        {allIngredients.map(ing => (
                          <SelectItem key={ing.id} value={ing.id.toString()}>{ing.name} ({ing.unitOfMeasure})</SelectItem>
                        ))}
                      </SelectContent>
                    </ShadcnSelect>
                  </div>
                  <div className="w-24">
                    <Label htmlFor="ingredient-quantity">Cantidad</Label>
                    <Input 
                      id="ingredient-quantity" 
                      type="number" 
                      value={selectedIngredientQuantity} 
                      onChange={(e) => setSelectedIngredientQuantity(e.target.value)} 
                      placeholder="Ej: 100"
                      min="0.01" 
                      step="0.01"
                    />
                  </div>
                  <Button type="button" onClick={handleAddRecipeItem} variant="outline" size="icon" disabled={isCurrentlySaving || !selectedIngredientId}><PlusCircle className="h-5 w-5"/></Button>
                </div>
              )}
              {recipeItems.length > 0 && (
                <div className="space-y-2 mt-2">
                  <p className="text-sm font-medium">Ingredientes en la receta:</p>
                  <ul className="list-disc list-inside pl-1 space-y-1">
                    {recipeItems.map(item => {
                      const ingredientDetails = allIngredients?.find(ing => ing.id === item.ingredientId);
                      return (
                        <li key={item.ingredientId} className="text-sm flex justify-between items-center">
                          <span>
                            {ingredientDetails ? `${ingredientDetails.name}: ${item.quantity} ${ingredientDetails.unitOfMeasure}` : `Ingrediente ID ${item.ingredientId}: ${item.quantity}`}
                            {item.notes && <span className="text-xs text-gray-500 italic ml-1">({item.notes})</span>}
                          </span>
                          <Button type="button" onClick={() => handleRemoveRecipeItem(item.ingredientId)} variant="ghost" size="icon" className="h-6 w-6 text-destructive" disabled={isCurrentlySaving}><Trash2 className="h-4 w-4"/></Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCurrentlySaving}>Cancelar</Button>
            <Button type="submit" disabled={isCurrentlySaving}>
              {isCurrentlySaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : (product ? 'Actualizar Producto' : 'Crear Producto')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 