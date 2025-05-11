import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Order, OrderStatus } from '../entities/Order';
import { Expense } from '../entities/Expense';
import { Between, In } from 'typeorm';

export class DashboardController {
  private orderRepository = AppDataSource.getRepository(Order);
  private expenseRepository = AppDataSource.getRepository(Expense);

  async getSummary(req: Request, res: Response) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999); // Día 0 del siguiente mes es el último del actual

      // Ventas del Día
      const completedOrdersToday = await this.orderRepository.find({
        where: {
          createdAt: Between(startOfDay, endOfDay),
          status: OrderStatus.COMPLETED,
        },
      });
      const salesToday = {
        totalAmount: completedOrdersToday.reduce((sum, order) => sum + order.total, 0),
        orderCount: completedOrdersToday.length,
      };

      // Pedidos Pendientes
      const pendingOrders = await this.orderRepository.count({
        where: {
          status: In([OrderStatus.PENDING, OrderStatus.IN_PROGRESS]),
        },
      });
      const pendingOrdersCount = pendingOrders;

      // Gastos del Mes
      const expensesThisMonthResult = await this.expenseRepository.find({
        where: {
          date: Between(startOfMonth, endOfMonth),
        },
      });
      const expensesThisMonth = {
        totalAmount: expensesThisMonthResult.reduce((sum, expense) => sum + expense.amount, 0),
        expenseCount: expensesThisMonthResult.length,
      };
      
      res.json({
        salesToday,
        pendingOrdersCount,
        expensesThisMonth,
      });

    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({ message: 'Error getting dashboard summary' });
    }
  }
} 