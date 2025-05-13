import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, PackagePlus } from "lucide-react";
import { Ingredient } from "@/types/ingredient";
import { UnitOfMeasure } from "@/types/unitOfMeasure";

interface IngredientListProps {
  ingredients: Ingredient[];
  unitsOfMeasure: UnitOfMeasure[];
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (ingredient: Ingredient) => void;
  onAdjustStock: (ingredient: Ingredient) => void;
}

const IngredientList: React.FC<IngredientListProps> = ({ ingredients, unitsOfMeasure, onEdit, onDelete, onAdjustStock }) => {

  const getUnitAbbreviation = (unitId: number) => {
    const unit = unitsOfMeasure.find(uom => uom.id === unitId);
    return unit ? unit.abbreviation : 'N/A';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="w-[150px]">Stock Actual</TableHead>
            <TableHead className="w-[150px]">Umbral Bajo Stock</TableHead>
            <TableHead className="w-[150px]">Costo Unitario</TableHead>
            <TableHead className="w-[100px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No hay ingredientes registrados.
              </TableCell>
            </TableRow>
          ) : (
            ingredients.map((ingredient) => (
              <TableRow key={ingredient.id}>
                <TableCell className="font-medium">{ingredient.name}</TableCell>
                <TableCell>
                  {ingredient.stock} {getUnitAbbreviation(ingredient.unitOfMeasureId)}
                </TableCell>
                <TableCell>
                  {ingredient.lowStockThreshold !== null && ingredient.lowStockThreshold !== undefined ? 
                    `${ingredient.lowStockThreshold} ${getUnitAbbreviation(ingredient.unitOfMeasureId)}` : 
                    'No establecido'}
                </TableCell>
                <TableCell>
                  {ingredient.costPrice !== null && ingredient.costPrice !== undefined ?
                    `$${ingredient.costPrice.toFixed(2)} / ${getUnitAbbreviation(ingredient.unitOfMeasureId)}` :
                    'No establecido'}
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
                      <DropdownMenuItem onClick={() => onEdit(ingredient)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAdjustStock(ingredient)}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Ajustar Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(ingredient)} className="text-red-600">
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

export default IngredientList; 