import { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, PlusCircle } from "lucide-react";
import { Recipe, RecipeItemFormData, CreateRecipeDto, UpdateRecipeDto, RecipeFormData } from "@/types/recipe";
import { Product } from "@/types/product";
import { Ingredient } from "@/types/ingredient";
import { UnitOfMeasure } from "@/types/unitOfMeasure"; // Necesario para mostrar la unidad del ingrediente

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1, "Debe seleccionar un ingrediente"),
  quantity: z.coerce.number().min(0.001, "La cantidad debe ser mayor a 0"),
  // unitOfMeasureId no es necesario aquí si se toma del ingrediente
  // cost se calculará, no se ingresa
});

const recipeFormSchema = z.object({
  name: z.string().min(1, "El nombre de la receta es requerido"),
  description: z.string().nullable().optional(),
  productId: z.string().nullable().optional(), // ID del producto asociado, opcional
  notes: z.string().nullable().optional(),
  items: z.array(recipeItemSchema).min(1, "La receta debe tener al menos un ingrediente"),
});

// El tipo FormData para el hook useForm
type FormValues = z.infer<typeof recipeFormSchema>;

interface RecipeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRecipeDto | UpdateRecipeDto) => void;
  initialData?: Recipe | null;
  products: Product[];       // Para seleccionar producto asociado
  ingredients: Ingredient[];  // Para seleccionar ingredientes para los items
  unitsOfMeasure: UnitOfMeasure[]; // Para obtener abreviaturas de unidades
  isSaving?: boolean;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  products,
  ingredients,
  unitsOfMeasure,
  isSaving,
}) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      productId: null,
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const currentItems = useWatch({ control, name: "items" });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        description: initialData.description || "",
        productId: initialData.productId ? String(initialData.productId) : null,
        notes: initialData.notes || "",
        items: initialData.items.map(item => ({
          ingredientId: String(item.ingredientId),
          quantity: item.quantity,
          // unitOfMeasureId ya no está en RecipeItemFormData
        })),
      });
    } else {
      reset({
        name: "",
        description: "",
        productId: null,
        notes: "",
        items: [],
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: FormValues) => {
    const dtoData: CreateRecipeDto | UpdateRecipeDto = {
      ...data,
      productId: data.productId ? Number(data.productId) : undefined, // Convertir a número o undefined
      items: data.items.map(item => ({
        ingredientId: Number(item.ingredientId),
        quantity: item.quantity,
      })),
    };
    onSubmit(dtoData);
  };

  const getIngredientDetails = (ingredientId: string | number) => {
    return ingredients.find(ing => ing.id === Number(ingredientId));
  };
  
  const getUnitAbbreviation = (unitId?: number) => {
    if (unitId === undefined) return '';
    const unit = unitsOfMeasure.find(uom => uom.id === unitId);
    return unit ? unit.abbreviation : '';
  };

  const estimatedTotalCost = useMemo(() => {
    return currentItems.reduce((acc, item) => {
      const ingredient = getIngredientDetails(item.ingredientId);
      const cost = ingredient?.costPrice ?? 0;
      return acc + (cost * item.quantity);
    }, 0);
  }, [currentItems, ingredients]);


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar" : "Crear"} Receta</DialogTitle>
          {initialData && <DialogDescription>ID: {initialData.id}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 py-2 pb-4 max-h-[80vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre de la Receta</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="productId">Producto Asociado (Opcional)</Label>
              <Controller
                name="productId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={initialData?.productId ? String(initialData.productId) : undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=""><em>Ninguno</em></SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.productId && <p className="text-red-500 text-sm mt-1">{errors.productId.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea id="description" {...register("description")} />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
            <Textarea id="notes" {...register("notes")} />
            {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ingredientes de la Receta</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ingredientId: "", quantity: 1 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ingrediente
                </Button>
            </div>
            {errors.items && typeof errors.items === 'object' && !Array.isArray(errors.items) && (errors.items as any).message && (
                <p className="text-red-500 text-sm mt-1">{(errors.items as any).message}</p>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-2/5">Ingrediente</TableHead>
                            <TableHead className="w-1/5">Cantidad</TableHead>
                            <TableHead className="w-1/5">Unidad</TableHead>
                            <TableHead className="w-1/5">Costo Item</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                            const selectedIngredientId = useWatch({ control, name: `items.${index}.ingredientId` });
                            const ingredientDetails = getIngredientDetails(selectedIngredientId);
                            const itemQuantity = useWatch({ control, name: `items.${index}.quantity` }) || 0;
                            const itemCost = (ingredientDetails?.costPrice ?? 0) * itemQuantity;

                            return (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <Controller
                                            name={`items.${index}.ingredientId`}
                                            control={control}
                                            render={({ field: controllerField }) => (
                                                <Select onValueChange={controllerField.onChange} value={controllerField.value || ""}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ingredients.map(ing => (
                                                            <SelectItem key={ing.id} value={String(ing.id)}>
                                                                {ing.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.items?.[index]?.ingredientId && <p className="text-red-500 text-xs mt-1">{errors.items?.[index]?.ingredientId?.message}</p>}
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="number" 
                                            step="any"
                                            {...register(`items.${index}.quantity`)} 
                                            className={errors.items?.[index]?.quantity ? "border-red-500" : ""}
                                        />
                                        {errors.items?.[index]?.quantity && <p className="text-red-500 text-xs mt-1">{errors.items?.[index]?.quantity?.message}</p>}
                                    </TableCell>
                                    <TableCell>
                                      {ingredientDetails ? getUnitAbbreviation(ingredientDetails.unitOfMeasureId) : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        ${itemCost.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Añada ingredientes a la receta.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <div className="text-right font-semibold text-lg pr-4">
                Costo Total Estimado: ${estimatedTotalCost.toFixed(2)}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (initialData ? "Guardando..." : "Creando...") : (initialData ? "Guardar Cambios" : "Crear Receta")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeForm; 