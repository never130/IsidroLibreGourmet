import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ingredientService } from '../../../services/ingredientService';
import type { Ingredient, CreateIngredientDto, UpdateIngredientDto } from '../../../types/ingredient';
import { IngredientUnit } from '../../../types/ingredient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from 'lucide-react';

const ingredientFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  stockQuantity: z.coerce.number().min(0, 'El stock no puede ser negativo'),
  unitOfMeasure: z.nativeEnum(IngredientUnit, { required_error: 'La unidad es requerida' }),
  // Campos opcionales que podrías añadir aquí si los manejas en el formulario:
  // description: z.string().optional(),
  // costPrice: z.coerce.number().optional(),
  // lowStockThreshold: z.coerce.number().optional(),
  // supplier: z.string().optional(),
});

type IngredientFormData = z.infer<typeof ingredientFormSchema>;

interface IngredientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredientToEdit?: Ingredient | null;
}

export function IngredientFormModal({ isOpen, onClose, ingredientToEdit }: IngredientFormModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!ingredientToEdit;

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting }, setValue } = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: '',
      stockQuantity: 0,
      // unitOfMeasure: undefined, // Se establece en useEffect
    },
  });

  useEffect(() => {
    if (ingredientToEdit) {
      reset({
        name: ingredientToEdit.name,
        stockQuantity: ingredientToEdit.stockQuantity,
        unitOfMeasure: ingredientToEdit.unitOfMeasure,
      });
    } else {
      reset({
        name: '',
        stockQuantity: 0,
        unitOfMeasure: IngredientUnit.GRAMS, // Valor por defecto para nuevos ingredientes
      });
    }
  }, [ingredientToEdit, reset]);

  const mutation = useMutation({
    mutationFn: (data: CreateIngredientDto | UpdateIngredientDto) => {
      if (isEditMode && ingredientToEdit) {
        return ingredientService.update(ingredientToEdit.id, data as UpdateIngredientDto);
      }
      return ingredientService.create(data as CreateIngredientDto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      onClose(); // Cierra el modal
      // Aquí se podría añadir una notificación de éxito (toast)
    },
    onError: (error: Error) => {
      // Aquí se podría añadir una notificación de error (toast)
      console.error("Error saving ingredient:", error);
      alert(`Error al guardar el ingrediente: ${error.message}`);
    },
  });

  const onSubmit = (data: IngredientFormData) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Ingrediente' : 'Agregar Nuevo Ingrediente'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica los detalles de este ingrediente.' : 'Completa los campos para agregar un nuevo ingrediente al inventario.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del Ingrediente</Label>
            <Input id="name" {...register('name')} placeholder="Ej: Harina de trigo" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stockQuantity">Cantidad en Stock</Label>
              <Input id="stockQuantity" type="number" step="any" {...register('stockQuantity')} placeholder="Ej: 1000" />
              {errors.stockQuantity && <p className="text-xs text-red-500 mt-1">{errors.stockQuantity.message}</p>}
            </div>
            <div>
              <Label htmlFor="unitOfMeasure">Unidad de Medida</Label>
              <Controller
                name="unitOfMeasure"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={IngredientUnit.GRAMS}
                  >
                    <SelectTrigger id="unitOfMeasure">
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={IngredientUnit.GRAMS}>Gramos (g)</SelectItem>
                      <SelectItem value={IngredientUnit.CUBIC_CENTIMETERS}>Centímetros cúbicos (cm³)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.unitOfMeasure && <p className="text-xs text-red-500 mt-1">{errors.unitOfMeasure.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {(isSubmitting || mutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Guardar Cambios' : 'Agregar Ingrediente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 