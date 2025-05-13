import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ingredient, CreateIngredientDto, UpdateIngredientDto } from "@/types/ingredient";
import { UnitOfMeasure } from "@/types/unitOfMeasure";
import { useEffect } from "react";

// Ajustado para reflejar los campos actuales de Ingredient y Create/Update DTOs
// Se omite costPrice por ahora, se añadirá cuando esté en el tipo.
const ingredientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable().optional(),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
  unitOfMeasureId: z.string().min(1, "La unidad de medida es requerida"), // El select devuelve string
  lowStockThreshold: z.coerce.number().min(0, "El umbral de stock bajo no puede ser negativo"),
  costPrice: z.coerce.number().min(0, "El costo no puede ser negativo").nullable().optional(),
});

export type IngredientFormData = z.infer<typeof ingredientSchema>;

interface IngredientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIngredientDto | UpdateIngredientDto) => void;
  initialData?: Ingredient | null;
  unitsOfMeasure: UnitOfMeasure[];
  isSaving?: boolean;
}

const IngredientForm: React.FC<IngredientFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  unitsOfMeasure,
  isSaving,
}) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: "",
      description: "",
      stock: 0,
      unitOfMeasureId: "",
      lowStockThreshold: 0,
      costPrice: null,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || "",
        stock: initialData.stock,
        unitOfMeasureId: String(initialData.unitOfMeasureId),
        lowStockThreshold: initialData.lowStockThreshold,
        costPrice: initialData.costPrice === undefined || initialData.costPrice === null ? null : initialData.costPrice,
      });
    } else {
      reset({
        name: "",
        description: "",
        stock: 0,
        unitOfMeasureId: "",
        lowStockThreshold: 0,
        costPrice: null,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: IngredientFormData) => {
    const dtoData = {
      ...data,
      unitOfMeasureId: parseInt(data.unitOfMeasureId, 10),
      costPrice: data.costPrice === undefined || data.costPrice === null ? null : Number(data.costPrice),
    };
    onSubmit(dtoData as CreateIngredientDto | UpdateIngredientDto);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar" : "Crear"} Ingrediente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2 pb-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea id="description" {...register("description")} />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Stock Actual</Label>
              <Input id="stock" type="number" step="any" {...register("stock")} />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
            </div>
            <div>
              <Label htmlFor="unitOfMeasureId">Unidad de Medida</Label>
              <Controller
                name="unitOfMeasureId"
                control={control}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    defaultValue={initialData ? String(initialData.unitOfMeasureId) : undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitsOfMeasure.map((uom) => (
                        <SelectItem key={uom.id} value={String(uom.id)}>
                          {uom.name} ({uom.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.unitOfMeasureId && <p className="text-red-500 text-sm mt-1">{errors.unitOfMeasureId.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lowStockThreshold">Umbral Stock Bajo</Label>
              <Input id="lowStockThreshold" type="number" step="any" {...register("lowStockThreshold")} />
              {errors.lowStockThreshold && <p className="text-red-500 text-sm mt-1">{errors.lowStockThreshold.message}</p>}
            </div>
            <div>
              <Label htmlFor="costPrice">Costo Unitario (Opcional)</Label>
              <Input id="costPrice" type="number" step="0.01" {...register("costPrice")} placeholder="Ej: 15.50"/>
              {errors.costPrice && <p className="text-red-500 text-sm mt-1">{errors.costPrice.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (initialData ? "Guardando..." : "Creando...") : (initialData ? "Guardar Cambios" : "Crear Ingrediente")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IngredientForm; 