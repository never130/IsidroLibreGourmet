import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ingredientService } from "@/services/ingredientService";
import { unitOfMeasureService } from "@/services/unitOfMeasureService";
import { Ingredient, CreateIngredientDto, UpdateIngredientDto } from "@/types/ingredient";
import { UnitOfMeasure } from "@/types/unitOfMeasure";
import IngredientList from "@/components/Inventory/Ingredients/IngredientList";
import IngredientForm from "@/components/Inventory/Ingredients/IngredientForm";
import DeleteIngredientDialog from "@/components/Inventory/Ingredients/DeleteIngredientDialog";
import AdjustStockDialog from "@/components/Inventory/Ingredients/AdjustStockDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const IngredientsPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const { data: ingredients, isLoading: isLoadingIngredients, error: ingredientsError } = useQuery<Ingredient[], Error>({
    queryKey: ["ingredients"],
    queryFn: ingredientService.getAll,
  });

  const { data: unitsOfMeasure, isLoading: isLoadingUnits, error: unitsError } = useQuery<UnitOfMeasure[], Error>({
    queryKey: ["unitsOfMeasure"],
    queryFn: unitOfMeasureService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateIngredientDto) => ingredientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      setIsFormOpen(false);
      toast({ title: "Éxito", description: "Ingrediente creado con éxito." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Error al crear ingrediente: ${error.message}` });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateIngredientDto }) => ingredientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      setIsFormOpen(false);
      setSelectedIngredient(null);
      toast({ title: "Éxito", description: "Ingrediente actualizado con éxito." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Error al actualizar ingrediente: ${error.message}` });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ingredientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      setIsDeleteDialogOpen(false);
      setSelectedIngredient(null);
      toast({ title: "Éxito", description: "Ingrediente eliminado con éxito." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Error al eliminar ingrediente: ${error.message}` });
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, quantity, isAddition }: { id: number; quantity: number; isAddition: boolean }) =>
      ingredientService.adjustStock(id, quantity, isAddition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      setIsAdjustStockOpen(false);
      setSelectedIngredient(null);
      toast({ title: "Éxito", description: "Stock ajustado con éxito." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Error al ajustar stock: ${error.message}` });
    },
  });

  const handleOpenForm = (ingredient: Ingredient | null = null) => {
    setSelectedIngredient(ingredient);
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenAdjustStockDialog = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsAdjustStockOpen(true);
  };

  const handleSubmitForm = (data: CreateIngredientDto | UpdateIngredientDto) => {
    if (selectedIngredient) {
      updateMutation.mutate({ id: selectedIngredient.id, data });
    } else {
      createMutation.mutate(data as CreateIngredientDto);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedIngredient) {
      deleteMutation.mutate(selectedIngredient.id);
    }
  };

  const handleAdjustStockConfirm = (quantity: number, isAddition: boolean) => {
    if (selectedIngredient) {
      adjustStockMutation.mutate({ id: selectedIngredient.id, quantity, isAddition });
    }
  };

  if (ingredientsError) return <p>Error cargando ingredientes: {ingredientsError.message}</p>;
  if (unitsError) return <p>Error cargando unidades de medida: {unitsError.message}</p>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Ingredientes</h1>
        <Button onClick={() => handleOpenForm()} className="flex items-center">
          <PlusCircle className="mr-2 h-5 w-5" /> Crear Ingrediente
        </Button>
      </div>

      {isLoadingIngredients || isLoadingUnits ? (
        <p>Cargando datos...</p>
      ) : (
        <IngredientList
          ingredients={ingredients || []}
          unitsOfMeasure={unitsOfMeasure || []}
          onEdit={handleOpenForm}
          onDelete={handleOpenDeleteDialog}
          onAdjustStock={handleOpenAdjustStockDialog}
        />
      )}

      {isFormOpen && unitsOfMeasure && (
        <IngredientForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedIngredient(null);
          }}
          onSubmit={handleSubmitForm}
          initialData={selectedIngredient}
          unitsOfMeasure={unitsOfMeasure}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {isDeleteDialogOpen && selectedIngredient && (
        <DeleteIngredientDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          ingredientName={selectedIngredient.name}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {isAdjustStockOpen && selectedIngredient && unitsOfMeasure && (
        <AdjustStockDialog
          isOpen={isAdjustStockOpen}
          onClose={() => {
            setIsAdjustStockOpen(false);
            setSelectedIngredient(null);
          }}
          onConfirm={handleAdjustStockConfirm}
          ingredient={selectedIngredient}
          unitOfMeasure={unitsOfMeasure.find(uom => uom.id === selectedIngredient.unitOfMeasureId)}
          isAdjusting={adjustStockMutation.isPending}
        />
      )}
    </div>
  );
};

export default IngredientsPage; 