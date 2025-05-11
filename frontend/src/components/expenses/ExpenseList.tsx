import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Expense } from '../../types/expense';
import { ExpenseCategory, PaymentMethod } from '../../types/expense';

const categoryLabels: Record<ExpenseCategory, string> = {
  [ExpenseCategory.RENT]: 'Alquiler',
  [ExpenseCategory.UTILITIES]: 'Servicios',
  [ExpenseCategory.SUPPLIES]: 'Insumos',
  [ExpenseCategory.SALARY]: 'Salarios',
  [ExpenseCategory.MAINTENANCE]: 'Mantenimiento',
  [ExpenseCategory.MARKETING]: 'Marketing',
  [ExpenseCategory.OTHER]: 'Otros'
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.CARD]: 'Tarjeta',
  [PaymentMethod.TRANSFER]: 'Transferencia'
};

export function ExpenseList() {
  const { data: expenses, isLoading, error } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/expenses');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        Error al cargar los gastos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses?.map((expense) => (
        <div
          key={expense.id}
          className="bg-white shadow rounded-lg overflow-hidden"
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {expense.description}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-red-600">
                  ${expense.amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {categoryLabels[expense.category]}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Método de Pago</p>
                <p>{paymentMethodLabels[expense.paymentMethod]}</p>
              </div>
              {expense.receiptNumber && (
                <div>
                  <p className="text-gray-500">Número de Recibo</p>
                  <p>{expense.receiptNumber}</p>
                </div>
              )}
            </div>

            {expense.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Notas</p>
                <p className="text-sm">{expense.notes}</p>
              </div>
            )}

            <div className="mt-4 flex justify-end space-x-2">
              <button
                className="text-blue-600 hover:text-blue-800"
                onClick={() => {/* TODO: Implementar edición */}}
              >
                Editar
              </button>
              <button
                className="text-red-600 hover:text-red-800"
                onClick={() => {/* TODO: Implementar eliminación */}}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 