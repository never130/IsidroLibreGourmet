import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { MainLayout } from '../components/layout/MainLayout';
import type { Expense } from '../types/expense';
import { ExpenseForm } from '../components/expenses/ExpenseForm';

export function Expenses() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await axios.get('/api/expenses');
      return response.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      await axios.delete(`/api/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleCreate = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  const categories = ['ALL', ...new Set(expenses?.map(e => e.category) || [])];

  const filteredExpenses = expenses?.filter(expense => {
    if (selectedCategory !== 'ALL' && expense.category !== selectedCategory) return false;
    return true;
  });

  const totalExpenses = filteredExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  if (isLoading) {
    return (
      <MainLayout title="Gestión de Gastos">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Gestión de Gastos">
      <div className="space-y-6">
        {/* Resumen */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Resumen de Gastos</h2>
          <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">
            {filteredExpenses?.length || 0} gastos registrados
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="p-2 border rounded-md"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'ALL' ? 'Todas' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Gastos */}
        <div className="bg-card rounded-lg shadow">
          {filteredExpenses?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No hay gastos para mostrar
            </div>
          ) : (
            <div className="divide-y">
              {filteredExpenses?.map((expense) => (
                <div key={expense.id} className="p-4 hover:bg-accent/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{expense.description}</h3>
                      <p className="text-sm text-muted-foreground">
                        {expense.category} - {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">${expense.amount.toFixed(2)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(expense.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón de Nuevo Gasto */}
        <div className="flex justify-end">
          <button
            onClick={handleCreate}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Formulario de Gasto Modal o similar */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <ExpenseForm expense={editingExpense} onSuccess={handleClose} />
          </div>
        </div>
      )}
    </MainLayout>
  );
} 