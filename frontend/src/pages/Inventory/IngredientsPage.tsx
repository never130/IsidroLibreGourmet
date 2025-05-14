import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ingredientService } from '../../services/ingredientService';
import type { Ingredient } from '../../types/ingredient';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, AlertTriangle, Loader2, PackageSearch } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { IngredientFormModal } from '../../components/inventory/Ingredients/IngredientFormModal';

export function IngredientsPage() {
  const queryClient = useQueryClient();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const { data: ingredients, isLoading, error, refetch } = useQuery<Ingredient[], Error>({
    queryKey: ['ingredients'],
    queryFn: ingredientService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: ingredientService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      // Aquí podrías añadir una notificación de éxito (toast)
    },
    onError: (err: Error) => {
      // Aquí podrías añadir una notificación de error (toast)
      console.error("Error deleting ingredient:", err);
      alert(`Error al eliminar el ingrediente: ${err.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este ingrediente?')) {
      deleteMutation.mutate(id);
    }
  };

  const openFormModal = (ingredient: Ingredient | null = null) => {
    setSelectedIngredient(ingredient);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setSelectedIngredient(null);
    setIsFormModalOpen(false);
    refetch(); // Vuelve a cargar los datos por si hubo cambios
  };

  if (isLoading) {
    return (
      <MainLayout title="Cargando Ingredientes...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Error">
        <div className="container mx-auto p-4 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-500">Error al cargar los ingredientes</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">Reintentar</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Gestión de Ingredientes">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Gestión de Ingredientes</h1>
          <Button onClick={() => openFormModal()} >
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Ingrediente
          </Button>
        </div>

        {ingredients && ingredients.length > 0 ? (
          <Table className="bg-card shadow rounded-lg">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell>{ingredient.id}</TableCell>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>{ingredient.stockQuantity}</TableCell>
                  <TableCell>{ingredient.unitOfMeasure}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openFormModal(ingredient)} className="mr-2">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ingredient.id)} disabled={deleteMutation.isPending}>
                      {deleteMutation.isPending && deleteMutation.variables === ingredient.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10 bg-card shadow rounded-lg">
            <PackageSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay ingredientes registrados.</p>
            <p className="text-sm text-muted-foreground mb-4">Comienza agregando uno nuevo.</p>
             <Button onClick={() => openFormModal()} >
                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Ingrediente
            </Button>
          </div>
        )}
      </div>
      {isFormModalOpen && (
        <IngredientFormModal
          isOpen={isFormModalOpen}
          onClose={closeFormModal}
          ingredientToEdit={selectedIngredient}
        />
      )}
    </MainLayout>
  );
} 