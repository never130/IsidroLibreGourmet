import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'; // Ruta corregida
import { OrderForm } from './OrderForm'; // Asumiendo que OrderForm está en el mismo directorio o ruta correcta
import type { CreateOrderItemDto, Order } from '../../types/order';
import { Button } from '@/components/ui/button'; // Ruta corregida

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void; // Callback cuando la orden se crea exitosamente
  initialItems?: CreateOrderItemDto[]; // Items pre-seleccionados del POS
  currentOrder?: Order | null; // Para edición, no se usará desde POSPage para creación
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  initialItems = [],
  currentOrder = null,
}) => {
  if (!isOpen) return null;

  // El OrderForm necesitará una forma de invocar onOrderCreated cuando tenga éxito.
  // Esto podría ser una prop adicional a OrderForm o OrderForm podría usar una mutación 
  // cuya callback onSuccess llame a onOrderCreated.

  // Por ahora, OrderForm se renderiza. La lógica de integración de onOrderCreated 
  // se refinará cuando se revise OrderForm.

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{currentOrder ? 'Editar Orden' : 'Crear Nueva Orden'}</DialogTitle>
        </DialogHeader>
        
        <OrderForm 
          orderToEdit={currentOrder} 
          // Pasamos los items iniciales. OrderForm necesitará manejar esta prop.
          initialOrderItems={initialItems} 
          // Necesitamos una forma para que OrderForm notifique la creación/actualización exitosa.
          // Esto podría ser una prop como `onSuccess`.
          onSuccess={(createdOrUpdatedOrder: Order) => {
            onOrderCreated(createdOrUpdatedOrder);
            // onClose(); // onOrderCreated en POSPage ya se encarga de cerrar.
          }}
          // Pasamos una función para cerrar el modal si OrderForm necesita hacerlo directamente (ej. botón Cancelar dentro de OrderForm)
          onCancel={onClose} 
        />
        
        {/* 
          Si OrderForm no tiene su propio botón de "Cancelar" que llame a `onClose`,
          se podría añadir un DialogFooter con un botón de cancelar aquí.
          Ejemplo:
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        */}
      </DialogContent>
    </Dialog>
  );
}; 