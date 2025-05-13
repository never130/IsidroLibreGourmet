import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { UnitOfMeasure, UnitOfMeasureFormData } from '@/types/unitOfMeasure';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  ControllerRenderProps,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido.").max(100, "El nombre no debe exceder los 100 caracteres."),
  abbreviation: z.string().min(1, "La abreviatura es requerida.").max(10, "La abreviatura no debe exceder los 10 caracteres."),
});

interface UnitOfMeasureFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UnitOfMeasureFormData) => void;
  initialData?: UnitOfMeasure | null;
  isLoading?: boolean;
}

export function UnitOfMeasureForm({ isOpen, onClose, onSubmit, initialData, isLoading }: UnitOfMeasureFormProps) {
  const form = useForm<UnitOfMeasureFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? 
      { name: initialData.name, abbreviation: initialData.abbreviation } : 
      { name: '', abbreviation: '' },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({ name: initialData.name, abbreviation: initialData.abbreviation });
      } else {
        form.reset({ name: '', abbreviation: '' });
      }
    }
  }, [initialData, form.reset, isOpen]);

  const handleFormSubmit = (data: UnitOfMeasureFormData) => {
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar' : 'Crear'} Unidad de Medida</DialogTitle>
          <DialogDescription>
            {initialData ? 'Modifica los detalles' : 'Añade una nueva'} unidad de medida para tus ingredientes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2 pb-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: ControllerRenderProps<UnitOfMeasureFormData, 'name'> }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Kilogramo, Litro, Unidad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }: { field: ControllerRenderProps<UnitOfMeasureFormData, 'abbreviation'> }) => (
                <FormItem>
                  <FormLabel>Abreviatura</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: kg, L, und" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {initialData ? 'Guardar Cambios' : 'Crear Unidad'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 