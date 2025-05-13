import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { unitOfMeasureService } from '@/services/unitOfMeasureService';
import type { UnitOfMeasure } from '@/types/unitOfMeasure';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UnitOfMeasureListProps {
  onEdit: (unit: UnitOfMeasure) => void;
  onDelete: (unit: UnitOfMeasure) => void;
}

export function UnitOfMeasureList({ onEdit, onDelete }: UnitOfMeasureListProps) {
  const { data: units, isLoading, error, refetch } = useQuery<UnitOfMeasure[], Error>({
    queryKey: ['unitsOfMeasure'],
    queryFn: unitOfMeasureService.getAll,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 flex flex-col items-center">
        <p>Error al cargar las unidades de medida: {error.message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  if (!units || units.length === 0) {
    return <p className="text-center text-gray-500 py-4">No se encontraron unidades de medida.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium">Nombre</TableHead>
            <TableHead className="font-medium">Abreviatura</TableHead>
            <TableHead className="text-right font-medium">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit: UnitOfMeasure) => (
            <TableRow key={unit.id}>
              <TableCell>{unit.name}</TableCell>
              <TableCell>{unit.abbreviation}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(unit)} title="Editar">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(unit)} title="Eliminar">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 