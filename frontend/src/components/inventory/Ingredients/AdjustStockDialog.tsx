import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Ingredient } from "@/types/ingredient";
import { UnitOfMeasure } from "@/types/unitOfMeasure";

const adjustStockSchema = z.object({
  quantity: z.coerce.number().min(0.001, "La cantidad debe ser positiva"),
  adjustmentType: z.enum(["add", "subtract", "set"]), // Añadido 'set' para establecer un valor absoluto
});

export type AdjustStockFormData = z.infer<typeof adjustStockSchema>;

interface AdjustStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, isAddition: boolean, isSettingNewTotal?: boolean, newTotal?: number) => void; // Modificado para el servicio
  ingredient: Ingredient | null;
  unitOfMeasure?: UnitOfMeasure | null; // Hacerla opcional por si no se encuentra
  isAdjusting?: boolean;
}

const AdjustStockDialog: React.FC<AdjustStockDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ingredient,
  unitOfMeasure,
  isAdjusting,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdjustStockFormData>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { quantity: 0, adjustmentType: "add" },
  });

  const adjustmentType = watch("adjustmentType");

  useEffect(() => {
    if (isOpen) {
      reset({ quantity: 0, adjustmentType: "add" });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = (data: AdjustStockFormData) => {
    if (!ingredient) return;

    let quantityForApi = data.quantity;
    let isAdditionForApi = true;
    let isSettingNewTotalForApi = false;
    let newTotalForApi = undefined;

    if (data.adjustmentType === "subtract") {
      isAdditionForApi = false;
    } else if (data.adjustmentType === "set") {
      isSettingNewTotalForApi = true;
      newTotalForApi = data.quantity; 
      // Para el servicio actual de adjustStock, necesitamos calcular la diferencia.
      // El backend espera una cantidad a sumar o restar.
      quantityForApi = data.quantity - ingredient.stock;
      if (quantityForApi < 0) {
        isAdditionForApi = false;
        quantityForApi = Math.abs(quantityForApi);
      } else {
        isAdditionForApi = true;
      }
    }
    // Si es "add", quantityForApi y isAdditionForApi ya están correctos.

    onConfirm(quantityForApi, isAdditionForApi, isSettingNewTotalForApi, newTotalForApi);
  };

  if (!isOpen || !ingredient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Stock de {ingredient.name}</DialogTitle>
          <DialogDescription>
            Stock actual: {ingredient.stock} {unitOfMeasure?.abbreviation || ''}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <RadioGroup
            defaultValue="add"
            onValueChange={(value: "add" | "subtract" | "set") => reset({ ...watch(), adjustmentType: value })}
            className="mb-4 grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="add" id="add" className="peer sr-only" />
              <Label
                htmlFor="add"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Añadir
              </Label>
            </div>
            <div>
              <RadioGroupItem value="subtract" id="subtract" className="peer sr-only" />
              <Label
                htmlFor="subtract"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Restar
              </Label>
            </div>
            <div>
              <RadioGroupItem value="set" id="set" className="peer sr-only" />
              <Label
                htmlFor="set"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Establecer Total
              </Label>
            </div>
          </RadioGroup>

          <div>
            <Label htmlFor="quantity">
              {adjustmentType === 'set' ? 'Nuevo Stock Total' : 'Cantidad a ' + (adjustmentType === 'add' ? 'Añadir' : 'Restar')}
            </Label>
            <Input id="quantity" type="number" step="any" {...register("quantity")} />
            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isAdjusting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isAdjusting}>
              {isAdjusting ? "Ajustando..." : "Confirmar Ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustStockDialog; 