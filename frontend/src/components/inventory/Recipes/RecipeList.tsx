import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"; // Eye para ver detalle si se implementa
import { Recipe, RecipeItem } from "@/types/recipe"; // RecipeItem importado
import { Product } from "@/types/product"; // Para mostrar el nombre del producto asociado

interface RecipeListProps {
  recipes: Recipe[];
  products: Product[]; // Para buscar el nombre del producto asociado
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  // onView?: (recipe: Recipe) => void; // Opcional para una vista de detalle
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, products, onEdit, onDelete }) => {

  const getProductName = (productId?: number | null) => { // productId es number
    if (productId === null || productId === undefined) return 'N/A (No asociado)';
    const product = products.find(p => p.id === productId); // number === number
    return product ? product.name : 'Producto no encontrado';
  };

  const getRecipeDisplayCost = (recipe: Recipe): string => {
    if (typeof recipe.estimatedCost === 'number') {
      return recipe.estimatedCost.toFixed(2);
    }
    // Fallback: Calcular manualmente si estimatedCost no está o no es un número
    if (!recipe.items || recipe.items.length === 0) {
      return '0.00';
    }
    const calculatedCost = recipe.items.reduce((totalCost: number, item: RecipeItem) => {
      const ingredientCost = item.ingredient?.costPrice ?? 0;
      const itemQuantity = item.quantity ?? 0;
      return totalCost + (itemQuantity * ingredientCost);
    }, 0);
    return calculatedCost.toFixed(2);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre de la Receta</TableHead>
            <TableHead>Producto Asociado</TableHead>
            <TableHead className="w-[180px]">Costo Estimado</TableHead>
            <TableHead className="w-[100px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No hay recetas registradas.
              </TableCell>
            </TableRow>
          ) : (
            recipes.map((recipe) => (
              <TableRow key={recipe.id}> {/* recipe.id es string (UUID) */}
                <TableCell className="font-medium">{recipe.name}</TableCell>
                <TableCell>{getProductName(recipe.productId)}</TableCell>
                <TableCell>
                  ${getRecipeDisplayCost(recipe)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* <DropdownMenuItem onClick={() => onView?.(recipe)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalle
                      </DropdownMenuItem> */}
                      <DropdownMenuItem onClick={() => onEdit(recipe)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(recipe)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecipeList; 