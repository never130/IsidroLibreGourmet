import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Expense, ExpenseCategory } from '../entities/Expense';
import { Between } from 'typeorm';
import { User } from '../entities/User';

export class ExpenseController {
  private expenseRepository = AppDataSource.getRepository(Expense);

  async getAll(req: Request, res: Response) {
    try {
      const expenses = await this.expenseRepository.find({
        order: { date: 'DESC' }
      });
      res.json(expenses);
    } catch (error) {
      console.error('Error al obtener gastos:', error);
      res.status(500).json({ message: 'Error al obtener gastos' });
    }
  }

  async getByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const expenses = await this.expenseRepository.find({
        where: {
          date: Between(new Date(startDate as string), new Date(endDate as string))
        },
        order: { date: 'DESC' }
      });
      res.json(expenses);
    } catch (error) {
      console.error('Error al obtener gastos por rango de fechas:', error);
      res.status(500).json({ message: 'Error al obtener gastos por rango de fechas' });
    }
  }

  async getByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const expenses = await this.expenseRepository.find({
        where: { category: category as ExpenseCategory },
        order: { date: 'DESC' }
      });
      res.json(expenses);
    } catch (error) {
      console.error('Error al obtener gastos por categoría:', error);
      res.status(500).json({ message: 'Error al obtener gastos por categoría' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const expense = await this.expenseRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!expense) {
        return res.status(404).json({ message: 'Gasto no encontrado' });
      }

      res.json(expense);
    } catch (error) {
      console.error('Error al obtener gasto:', error);
      res.status(500).json({ message: 'Error al obtener gasto' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const currentUser = (req as any).user as User;

      if (!currentUser) {
        return res.status(401).json({ message: 'Usuario no autenticado correctamente para esta acción' });
      }
      
      const newExpenseData = { 
        ...req.body,
        createdBy: currentUser
      };
      const expense = this.expenseRepository.create(newExpenseData);
      await this.expenseRepository.save(expense);
      res.status(201).json(expense);
    } catch (error) {
      console.error('Error al crear gasto:', error);
      res.status(500).json({ message: 'Error al crear gasto' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const expense = await this.expenseRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!expense) {
        return res.status(404).json({ message: 'Gasto no encontrado' });
      }

      this.expenseRepository.merge(expense, req.body);
      await this.expenseRepository.save(expense);
      res.json(expense);
    } catch (error) {
      console.error('Error al actualizar gasto:', error);
      res.status(500).json({ message: 'Error al actualizar gasto' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const expense = await this.expenseRepository.findOne({
        where: { id: parseInt(id) }
      });

      if (!expense) {
        return res.status(404).json({ message: 'Gasto no encontrado' });
      }

      await this.expenseRepository.remove(expense);
      res.json({ message: 'Gasto eliminado' });
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      res.status(500).json({ message: 'Error al eliminar gasto' });
    }
  }
} 