import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Asume que shadcn/ui AlertDialog está instalado
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface DeleteUnitOfMeasureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unitName: string;
  isLoading?: boolean;
}

export function DeleteUnitOfMeasureDialog({
  isOpen,
  onClose,
  onConfirm,
  unitName,
  isLoading,
}: DeleteUnitOfMeasureDialogProps) {
  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de eliminar "{unitName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente la unidad de medida.
            Asegúrate de que no esté siendo utilizada por ningún ingrediente antes de continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button onClick={onConfirm} variant="destructive" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 