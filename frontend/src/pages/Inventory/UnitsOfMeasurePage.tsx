import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { UnitOfMeasureList } from '@/components/inventory/units/UnitOfMeasureList';
import { UnitOfMeasureForm } from '@/components/inventory/units/UnitOfMeasureForm';
import { DeleteUnitOfMeasureDialog } from '@/components/inventory/units/DeleteUnitOfMeasureDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { unitOfMeasureService } from '@/services/unitOfMeasureService';
import type { UnitOfMeasure, CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto } from '@/types/unitOfMeasure';
import { useToast } from '@/components/ui/use-toast';

export function UnitsOfMeasurePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitOfMeasure | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<UnitOfMeasure | null>(null);

  const { mutate: createUnit, isPending: isCreating } = useMutation<UnitOfMeasure, Error, CreateUnitOfMeasureDto>({
    mutationFn: unitOfMeasureService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unitsOfMeasure'] });
      toast({ title: 'Éxito', description: 'Unidad de medida creada correctamente.' });
      setIsFormModalOpen(false);
      setSelectedUnit(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'No se pudo crear la unidad.', variant: 'destructive' });
    },
  });

  const { mutate: updateUnit, isPending: isUpdating } = useMutation<UnitOfMeasure, Error, { id: number; data: UpdateUnitOfMeasureDto }>({
    mutationFn: (params) => unitOfMeasureService.update(params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unitsOfMeasure'] });
      toast({ title: 'Éxito', description: 'Unidad de medida actualizada correctamente.' });
      setIsFormModalOpen(false);
      setSelectedUnit(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'No se pudo actualizar la unidad.', variant: 'destructive' });
    },
  });

  const { mutate: deleteUnit, isPending: isDeleting } = useMutation<void, Error, number>({
    mutationFn: unitOfMeasureService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unitsOfMeasure'] });
      toast({ title: 'Éxito', description: 'Unidad de medida eliminada correctamente.' });
      setIsDeleteDialogOpen(false);
      setUnitToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'No se pudo eliminar la unidad.', variant: 'destructive' });
    },
  });

  const handleCreateNew = () => {
    setSelectedUnit(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (unit: UnitOfMeasure) => {
    setSelectedUnit(unit);
    setIsFormModalOpen(true);
  };

  const handleDeleteRequest = (unit: UnitOfMeasure) => {
    setUnitToDelete(unit);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (unitToDelete) {
      deleteUnit(unitToDelete.id);
    }
  };

  const handleSubmitForm = (data: CreateUnitOfMeasureDto | UpdateUnitOfMeasureDto) => {
    if (selectedUnit) {
      updateUnit({ id: selectedUnit.id, data: data as UpdateUnitOfMeasureDto });
    } else {
      createUnit(data as CreateUnitOfMeasureDto);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unidades de Medida</CardTitle>
          <Button onClick={handleCreateNew} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nueva Unidad
          </Button>
        </CardHeader>
        <CardContent>
          <UnitOfMeasureList onEdit={handleEdit} onDelete={handleDeleteRequest} />
        </CardContent>
      </Card>

      {isFormModalOpen && (
        <UnitOfMeasureForm
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedUnit(null);
          }}
          onSubmit={handleSubmitForm}
          initialData={selectedUnit}
          isLoading={isCreating || isUpdating}
        />
      )}

      {isDeleteDialogOpen && unitToDelete && (
        <DeleteUnitOfMeasureDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          unitName={unitToDelete.name}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
} 