import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '../ui/dialog'; // Asumiendo que tienes dialog.tsx
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label'; // Asumiendo que tienes label.tsx
import { PaymentMethod, CreateOrderPOSDto } from '../../types/order';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onSubmit: (paymentDetails: { paymentMethod: PaymentMethod; notes?: string; amountReceived?: number }) => void;
  isSubmitting: boolean;
}

const paymentMethodOptions = [
  { value: PaymentMethod.CASH, label: 'Efectivo' },
  { value: PaymentMethod.CREDIT_CARD, label: 'Tarjeta de Crédito' },
  { value: PaymentMethod.DEBIT_CARD, label: 'Tarjeta de Débito' },
  { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
  { value: PaymentMethod.OTHER, label: 'Otro' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, onSubmit, isSubmitting }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    if (selectedPaymentMethod === PaymentMethod.CASH) {
      const received = parseFloat(amountReceived);
      if (!isNaN(received) && received >= totalAmount) {
        setChange(received - totalAmount);
      } else {
        setChange(0);
      }
    } else {
      setChange(0);
      // setAmountReceived(''); // Opcional: limpiar monto recibido si no es efectivo
    }
  }, [amountReceived, totalAmount, selectedPaymentMethod]);

  useEffect(() => {
    // Resetear estado cuando se abre el modal, especialmente monto recibido
    if (isOpen) {
      setSelectedPaymentMethod(PaymentMethod.CASH);
      setAmountReceived(totalAmount.toFixed(2)); // Pre-llenar con el total para agilizar
      setNotes('');
    }
  }, [isOpen, totalAmount]);

  const handleSubmit = () => {
    if (selectedPaymentMethod === PaymentMethod.CASH && (parseFloat(amountReceived) < totalAmount || isNaN(parseFloat(amountReceived)))) {
        toast.error('El monto recibido en efectivo es menor al total o inválido.');
        return;
    }
    onSubmit({
      paymentMethod: selectedPaymentMethod,
      notes,
      amountReceived: selectedPaymentMethod === PaymentMethod.CASH ? parseFloat(amountReceived) : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
          <DialogDescription>
            Total a Pagar: <span className="font-bold text-lg">${totalAmount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="paymentMethod">Método de Pago</Label>
            <Select
              value={selectedPaymentMethod}
              onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPaymentMethod === PaymentMethod.CASH && (
            <div>
              <Label htmlFor="amountReceived">Monto Recibido (Efectivo)</Label>
              <Input 
                id="amountReceived"
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder={totalAmount.toFixed(2)}
                min={totalAmount.toString()} // Ayuda pero la validación es necesaria
              />
              {parseFloat(amountReceived) >= totalAmount && change > 0 && (
                <p className="mt-2 text-sm text-green-600">Cambio a entregar: ${change.toFixed(2)}</p>
              )}
              {parseFloat(amountReceived) < totalAmount && amountReceived !== '' && (
                <p className="mt-1 text-xs text-red-500">El monto recibido es menor al total.</p>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
            <Input 
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Cliente pide factura, envolver para regalo..."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 