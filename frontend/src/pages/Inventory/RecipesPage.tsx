import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recipeService } from "@/services/recipeService";
import { productService } from "@/services/productService"; // Para seleccionar producto asociado
import { ingredientService } from "@/services/ingredientService"; // Para seleccionar ingredientes en el form
import { unitOfMeasureService } from "@/services/unitOfMeasureService"; // Para RecipeForm
import { Recipe, CreateRecipeDto, UpdateRecipeDto } from "@/types/recipe";
import { Product } from "@/types/product";
import { Ingredient } from "@/types/ingredient";
import { UnitOfMeasure } from "@/types/unitOfMeasure"; // Para RecipeForm
import RecipeList from "@/components/inventory/Recipes/RecipeList";
import RecipeForm from "@/components/inventory/Recipes/RecipeForm";
import DeleteRecipeDialog from "@/components/inventory/Recipes/DeleteRecipeDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const RecipesPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Obtener todas las recetas
  const { data: recipes, isLoading: isLoadingRecipes, error: recipesError } = useQuery<Recipe[], Error>({
    queryKey: ["recipes"],
    queryFn: () => recipeService.getAll(),
  });

  // Obtener productos para el formulario de recetas (para asociar receta a producto)
  const { data: products, isLoading: isLoadingProducts, error: productsError } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: () => productService.getAll(),
  });

  // Obtener ingredientes para el formulario de recetas (para añadir a la receta)
  const { data: ingredients, isLoading: isLoadingIngredients, error: ingredientsError } = useQuery<Ingredient[], Error>({
    queryKey: ["ingredients"],
    queryFn: () => ingredientService.getAll(),
  });

  // Obtener unidades de medida para el formulario de recetas (para RecipeForm)
  const { data: unitsOfMeasure, isLoading: isLoadingUnits, error: unitsError } = useQuery<UnitOfMeasure[], Error>({
    queryKey: ["unitsOfMeasure"],
    queryFn: () => unitOfMeasureService.getAll(),
  });

  const createRecipeMutation = useMutation({
    mutationFn: (data: CreateRecipeDto) => recipeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Si la receta afecta a productos
      setIsFormOpen(false);
      toast({ title: "Éxito", description: "Receta creada con éxito." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Error al crear receta: ${error.message}` });
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecipeDto }) => recipeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsFormOpen(false);
      setSelectedRecipe(null);
      toast({ title: "Éxito", description: "Receta actualizada con éxito." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Error al actualizar receta: ${error.message}` });
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: (id: string) => recipeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDeleteDialogOpen(false);
      setSelectedRecipe(null);
      toast({ title: "Éxito", description: "Receta eliminada con éxito." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Error al eliminar receta: ${error.message}` });
    },
  });

  const handleOpenForm = (recipe: Recipe | null = null) => {
    setSelectedRecipe(recipe);
    setIsFormOpen(true);
  };

  const handleOpenDeleteDialog = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitForm = (data: CreateRecipeDto | UpdateRecipeDto) => {
    if (selectedRecipe) {
      updateRecipeMutation.mutate({ id: selectedRecipe.id, data });
    } else {
      createRecipeMutation.mutate(data as CreateRecipeDto);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedRecipe) {
      deleteRecipeMutation.mutate(selectedRecipe.id);
    }
  };
  
  if (recipesError) return <p>Error cargando recetas: {recipesError.message}</p>;
  if (productsError) return <p>Error cargando productos: {productsError.message}</p>;
  if (ingredientsError) return <p>Error cargando ingredientes: {ingredientsError.message}</p>;
  if (unitsError) return <p>Error cargando unidades de medida: {unitsError.message}</p>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Recetas</h1>
        <Button onClick={() => handleOpenForm()} className="flex items-center">
          <PlusCircle className="mr-2 h-5 w-5" /> Crear Receta
        </Button>
      </div>

      {isLoadingRecipes || isLoadingProducts || isLoadingIngredients || isLoadingUnits ? (
        <p>Cargando datos necesarios...</p>
      ) : (
        <RecipeList 
          recipes={recipes || []} 
          products={products || []} // Pasar productos a RecipeList
          onEdit={handleOpenForm} 
          onDelete={handleOpenDeleteDialog} 
        />
      )}

      {isFormOpen && products && ingredients && unitsOfMeasure && (
        <RecipeForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedRecipe(null);
          }}
          onSubmit={handleSubmitForm}
          initialData={selectedRecipe}
          products={products}
          ingredients={ingredients}
          unitsOfMeasure={unitsOfMeasure} // Pasar unitsOfMeasure a RecipeForm
          isSaving={createRecipeMutation.isPending || updateRecipeMutation.isPending}
        />
      )}

      {isDeleteDialogOpen && selectedRecipe && (
        <DeleteRecipeDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          recipeName={selectedRecipe.name}
          isDeleting={deleteRecipeMutation.isPending}
        />
      )}
    </div>
  );
};

export default RecipesPage;
