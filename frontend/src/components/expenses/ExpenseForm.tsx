import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Expense } from '../../types/expense';
import { ExpenseCategory, PaymentMethod } from '../../types/expense';
import { SubmitHandler } from 'react-hook-form';
import { AxiosError } from 'axios';

const expenseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  category: z.nativeEnum(ExpenseCategory, { errorMap: () => ({ message: 'Categoría inválida' }) }),
  paymentMethod: z.nativeEnum(PaymentMethod, { errorMap: () => ({ message: 'Método de pago inválido' }) }),
  date: z.string().min(1, 'La fecha es requerida'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  onSuccess: () => void;
}

export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const queryClient = useQueryClient();

  const handleError = (error: AxiosError, defaultMessage: string) => {
    let errorMessage = defaultMessage;
    if (error.response && error.response.data && typeof (error.response.data as any).message === 'string') {
      errorMessage = (error.response.data as any).message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error(`Error: ${defaultMessage}`, error.response?.data || error.message);
    alert(`Error: ${errorMessage}`);
  };

  const createMutation = useMutation<Expense, AxiosError, ExpenseFormData>({
    mutationFn: async (data: ExpenseFormData) => {
      const response = await axios.post<Expense>('/api/expenses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onSuccess();
    },
    onError: (error) => handleError(error, 'Error al crear el gasto')
  });

  const updateMutation = useMutation<Expense, AxiosError, ExpenseFormData>({
    mutationFn: async (data: ExpenseFormData) => {
      if (!expense || !expense.id) {
        throw new Error("ID de gasto no encontrado para la actualización.");
      }
      const response = await axios.patch<Expense>(`/api/expenses/${expense.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onSuccess();
    },
    onError: (error) => handleError(error, 'Error al actualizar el gasto')
  });

  const { register, handleSubmit, formState: { errors }, control } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ? {
      description: expense.description,
      amount: Number(expense.amount),
      category: expense.category,
      paymentMethod: expense.paymentMethod || PaymentMethod.CASH,
      date: expense.date.split('T')[0],
      receiptNumber: expense.receiptNumber || '',
      notes: expense.notes || ''
    } : {
      description: '',
      amount: 0,
      category: ExpenseCategory.OTHER,
      paymentMethod: PaymentMethod.CASH,
      date: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      notes: ''
    }
  });

  const onSubmit: SubmitHandler<ExpenseFormData> = (data) => {
    const dataToSend = {
      ...data,
      date: new Date(data.date).toISOString(),
    };

    if (expense) {
      updateMutation.mutate(dataToSend);
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Descripción</label>
        <input
          id="description"
          {...register('description')}
          type="text"
          className="w-full p-2 border rounded-md bg-input"
          placeholder="Descripción del gasto"
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">Monto</label>
        <input
          id="amount"
          {...register('amount', { valueAsNumber: true })}
          type="number"
          step="0.01"
          className="w-full p-2 border rounded-md bg-input"
          placeholder="0.00"
        />
        {errors.amount && (
          <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">Categoría</label>
        <select
          id="category"
          {...register('category')}
          className="w-full p-2 border rounded-md bg-input"
        >
          {Object.values(ExpenseCategory).map(cat => (
            <option key={cat} value={cat}>{cat.replace('_',' ')}</option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">Método de Pago</label>
        <select
          id="paymentMethod"
          {...register('paymentMethod')}
          className="w-full p-2 border rounded-md bg-input"
        >
          {Object.values(PaymentMethod).map(method => (
            <option key={method} value={method}>{method.replace('_',' ')}</option>
          ))}
        </select>
        {errors.paymentMethod && (
          <p className="text-sm text-red-600 mt-1">{errors.paymentMethod.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1">Fecha</label>
        <input
          id="date"
          {...register('date')}
          type="date"
          className="w-full p-2 border rounded-md bg-input"
        />
        {errors.date && (
          <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="receiptNumber" className="block text-sm font-medium mb-1">Número de Recibo (Opcional)</label>
        <input
          id="receiptNumber"
          {...register('receiptNumber')}
          type="text"
          className="w-full p-2 border rounded-md bg-input"
          placeholder="Ej: A-123"
        />
        {errors.receiptNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.receiptNumber.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">Notas (Opcional)</label>
        <textarea
          id="notes"
          {...register('notes')}
          className="w-full p-2 border rounded-md bg-input"
          placeholder="Notas adicionales"
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
        disabled={createMutation.isPending || updateMutation.isPending}
      >
        {expense ? 'Actualizar Gasto' : 'Crear Gasto'}
      </button>
    </form>
  );
} 