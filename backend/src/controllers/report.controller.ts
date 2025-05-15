/**
 * Controlador de reportes
 * Maneja la generación de reportes y estadísticas del negocio
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Order, OrderStatus, OrderType, PaymentMethod } from '../entities/Order';
import { Expense, ExpenseCategory } from '../entities/Expense';
import { Product, ProductCategory } from '../entities/Product';
import { OrderItem } from '../entities/OrderItem';
import { Between, LessThanOrEqual, MoreThanOrEqual, FindOptionsWhere } from 'typeorm';
import { ReportParamsDto } from '../dtos/report.dto';
import { Ingredient } from '../entities/Ingredient';

export class ReportController {
  // Definir repositorios como propiedades de instancia
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private productRepository = AppDataSource.getRepository(Product);
  private expenseRepository = AppDataSource.getRepository(Expense);
  private ingredientRepository = AppDataSource.getRepository(Ingredient);

  private getOrderQueryBase(startDate?: string, endDate?: string) {
    const where: FindOptionsWhere<Order> = {};
    if (startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = Between(new Date(startDate), endOfDay);
    }
    return where;
  }

  /**
   * Obtiene un resumen de las ventas (totalRevenue, totalOrders, averageOrderValue)
   * Endpoint: /api/reports/summary
   */
  async getSalesSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query as ReportParamsDto;
      const queryBase = this.getOrderQueryBase(startDate, endDate);
      const orders = await this.orderRepository.find({
        where: { ...queryBase, status: OrderStatus.COMPLETED } // Considerar solo pedidos completados para ingresos
      });

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      res.json({
        totalRevenue,
        totalOrders,
        averageOrderValue,
      });
    } catch (error) {
      console.error('Error getting sales summary:', error);
      res.status(500).json({ message: 'Error getting sales summary' });
    }
  }

  /**
   * Obtiene estadísticas de pedidos por estado y tipo (count, totalValue)
   * Endpoint: /api/reports/order-stats
   */
  async getOrderStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query as ReportParamsDto;
      const queryBase = this.getOrderQueryBase(startDate, endDate);
      const orders = await this.orderRepository.find({ where: queryBase });

      const countByStatus = orders.reduce((acc, order) => {
        const statusKey = order.status as OrderStatus;
        if (!acc[statusKey]) {
          acc[statusKey] = { count: 0, totalValue: 0 };
        }
        acc[statusKey].count += 1;
        acc[statusKey].totalValue += order.total;
        return acc;
      }, {} as Record<OrderStatus, { count: number; totalValue: number }>);

      const countByType = orders.reduce((acc, order) => {
        const typeKey = order.type as OrderType;
        if (!acc[typeKey]) {
          acc[typeKey] = { count: 0, totalValue: 0 };
        }
        acc[typeKey].count += 1;
        acc[typeKey].totalValue += order.total;
        return acc;
      }, {} as Record<OrderType, { count: number; totalValue: number }>);
      
      // Asegurar que todos los estados y tipos tengan una entrada, incluso si es 0
      Object.values(OrderStatus).forEach(status => {
        if (!countByStatus[status]) {
          countByStatus[status] = { count: 0, totalValue: 0 };
        }
      });
      Object.values(OrderType).forEach(type => {
        if (!countByType[type]) {
          countByType[type] = { count: 0, totalValue: 0 };
        }
      });


      res.json({
        countByStatus,
        countByType,
      });
    } catch (error) {
      console.error('Error getting order stats:', error);
      res.status(500).json({ message: 'Error getting order stats' });
    }
  }

  /**
   * Obtiene las ventas agrupadas por método de pago
   * Endpoint: /api/reports/payment-methods
   */
  async getSalesByPaymentMethod(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query as ReportParamsDto;
      const queryBase = this.getOrderQueryBase(startDate, endDate);

      const sales = await this.orderRepository.find({ 
        where: { ...queryBase, status: OrderStatus.COMPLETED }
      });

      const salesByPaymentMethod = sales.reduce((acc, order) => {
        const paymentMethodKey = order.paymentMethod || PaymentMethod.CASH; // Default si no está definido
        if (!acc[paymentMethodKey]) {
          acc[paymentMethodKey] = { paymentMethod: paymentMethodKey, totalAmount: 0, count: 0 };
        }
        acc[paymentMethodKey].totalAmount += order.total;
        acc[paymentMethodKey].count += 1;
        return acc;
      }, {} as Record<PaymentMethod, { paymentMethod: PaymentMethod; totalAmount: number; count: number }>);
      
      // Asegurar que todos los métodos de pago tengan una entrada
      Object.values(PaymentMethod).forEach(pm => {
        const methodKey = pm as PaymentMethod;
        if (!salesByPaymentMethod[methodKey]) {
          salesByPaymentMethod[methodKey] = { paymentMethod: methodKey, totalAmount: 0, count: 0 };
        }
      });

      res.json(Object.values(salesByPaymentMethod));
    } catch (error) {
      console.error('Error getting sales by payment method:', error);
      res.status(500).json({ message: 'Error getting sales by payment method' });
    }
  }

  /**
   * Obtiene los ingresos a lo largo del tiempo (diario)
   * Endpoint: /api/reports/revenue-over-time
   */
  async getRevenueOverTime(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query as ReportParamsDto;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'startDate and endDate are required' });
      }

      const queryBase = this.getOrderQueryBase(startDate, endDate);
      const orders = await this.orderRepository.find({
        where: { ...queryBase, status: OrderStatus.COMPLETED },
        order: { createdAt: 'ASC' } // Importante para procesar en orden cronológico
      });

      const revenueByDate: Record<string, number> = {};

      orders.forEach(order => {
        const date = order.createdAt.toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + order.total;
      });
      
      const revenueOverTimeData = Object.keys(revenueByDate).map(date => ({
        date,
        revenue: revenueByDate[date]
      }));

      res.json(revenueOverTimeData);
    } catch (error) {
      console.error('Error getting revenue over time:', error);
      res.status(500).json({ message: 'Error getting revenue over time' });
    }
  }

  /**
   * Obtiene los productos más vendidos
   * @param req - Request de Express con fechas opcionales y límite
   * @param res - Response de Express
   * @returns Lista de productos más vendidos con sus cantidades y ventas
   */
  async getTopProducts(req: Request, res: Response) {
    try {
      const { startDate, endDate, limit = 10 } = req.query as unknown as ReportParamsDto;

      let query = this.orderItemRepository.createQueryBuilder("orderItem")
        .select("orderItem.productId", "productId")
        .addSelect("product.name", "name")
        .addSelect("SUM(orderItem.quantity)", "totalQuantitySold")
        .addSelect("SUM(orderItem.price * orderItem.quantity)", "totalRevenueGenerated")
        .innerJoin("orderItem.product", "product")
        .innerJoin("orderItem.order", "orderAlias")
        .groupBy("orderItem.productId")
        .addGroupBy("product.name")
        .orderBy("totalQuantitySold", "DESC")
        .limit(Number(limit));

      if (startDate) {
        query = query.andWhere("orderAlias.createdAt >= :startDate", { startDate: new Date(startDate) });
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.andWhere("orderAlias.createdAt <= :endDate", { endDate: endOfDay });
      }

      const rawTopProducts = await query.getRawMany();

      const topProducts = rawTopProducts.map(p => ({
        productId: p.productId,
        name: p.name,
        totalQuantitySold: parseInt(p.totalQuantitySold, 10),
        totalRevenueGenerated: parseFloat(p.totalRevenueGenerated)
      }));

      res.json(topProducts);
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
      res.status(500).json({ message: 'Error al obtener productos más vendidos' });
    }
  }

  /**
   * Obtiene productos con stock bajo
   * @param req - Request de Express con umbral opcional
   * @param res - Response de Express
   * @returns Lista de productos con stock bajo el umbral
   */
  async getLowStockProducts(req: Request, res: Response) {
    try {
      const { threshold = 10 } = req.query;
      const products = await this.productRepository.find({
        where: {
          stock: LessThanOrEqual(Number(threshold)),
          isActive: true,
          manageStock: true // Asegurar que solo productos con gestión de stock directa
        },
        select: ['id', 'name', 'stock', 'category', 'price', 'cost', 'imageUrl', 'isActive', 'manageStock'] // Incluir manageStock en select
      });
      
      res.json(products);
    } catch (error) {
      console.error('Error al obtener productos con bajo stock:', error);
      res.status(500).json({ message: 'Error al obtener productos con bajo stock' });
    }
  }

  /**
   * Obtiene las ventas diarias (DEPRECADO, usar getRevenueOverTime)
   * @param req - Request de Express con número de días opcional
   * @param res - Response de Express
   * @returns Ventas agrupadas por día
   */
  async getDailySales(req: Request, res: Response) {
    try {
      const { days = 7 } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const orders = await this.orderRepository.find({
        where: {
          status: OrderStatus.COMPLETED,
          createdAt: Between(startDate, endDate)
        }
      });

      const dailySales = orders.reduce((acc: Record<string, number>, order: Order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + order.total;
        return acc;
      }, {} as Record<string, number>);

      res.json(dailySales);
    } catch (error) {
      console.error('Error al obtener ventas diarias:', error);
      res.status(500).json({ message: 'Error al obtener ventas diarias' });
    }
  }

  /**
   * Obtiene el rendimiento detallado de cada producto
   * @param req - Request de Express con fechas opcionales
   * @param res - Response de Express
   * @returns Rendimiento detallado de cada producto
   */
  async getProductPerformance(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query as unknown as ReportParamsDto;

      let query = this.orderItemRepository.createQueryBuilder("orderItem")
        .select("product.id", "productId")
        .addSelect("product.name", "name")
        .addSelect("product.description", "description")
        .addSelect("product.price", "currentPrice")
        .addSelect("product.category", "category")
        .addSelect("SUM(orderItem.quantity)", "totalQuantitySold")
        .addSelect("SUM(orderItem.price * orderItem.quantity)", "totalRevenueGenerated")
        .addSelect("AVG(orderItem.price)", "averageSellingPrice")
        .innerJoin("orderItem.product", "product")
        .innerJoin("orderItem.order", "orderAlias")
        .groupBy("orderItem.productId")
        .addGroupBy("product.id")
        .addGroupBy("product.name")
        .addGroupBy("product.description")
        .addGroupBy("product.price")
        .addGroupBy("product.category");

      if (startDate) {
        query = query.andWhere("orderAlias.createdAt >= :startDate", { startDate: new Date(startDate) });
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.andWhere("orderAlias.createdAt <= :endDate", { endDate: endOfDay });
      }

      const rawProductPerformance = await query.getRawMany();

      const productPerformance = rawProductPerformance.map(p => ({
        product: {
            id: p.productId,
            name: p.name,
            description: p.description,
            price: parseFloat(p.currentPrice),
            category: p.category as ProductCategory,
        },
        totalQuantity: parseInt(p.totalQuantitySold, 10),
        totalSales: parseFloat(p.totalRevenueGenerated),
        averagePrice: parseFloat(p.averageSellingPrice)
      }));

      res.json(productPerformance);
    } catch (error) {
      console.error('Error al obtener rendimiento de productos:', error);
      res.status(500).json({ message: 'Error al obtener rendimiento de productos' });
    }
  }

  async getExpensesStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query as ReportParamsDto;

      const where: FindOptionsWhere<Expense> = {};
      if (startDate && endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.date = Between(new Date(startDate), endOfDay);
      }

      const expenses = await this.expenseRepository.find({ where });

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const count = expenses.length;

      const expensesByCategory = expenses.reduce((acc, expense) => {
        const categoryKey = (expense.category || ExpenseCategory.OTHER) as ExpenseCategory;
        acc[categoryKey] = (acc[categoryKey] || 0) + expense.amount;
        return acc;
      }, {} as Record<ExpenseCategory, number>);

      Object.values(ExpenseCategory).forEach(cat => {
        const categoryKey = cat as ExpenseCategory;
        if (!expensesByCategory[categoryKey]) {
          expensesByCategory[categoryKey] = 0;
        }
      });

      res.json({
        totalExpenses,
        count,
        expensesByCategory
      });
    } catch (error) {
      console.error('Error getting expenses stats:', error);
      res.status(500).json({ message: 'Error getting expenses stats' });
    }
  }

  async getProductsStats(req: Request, res: Response) {
    try {
      const totalProducts = await this.productRepository.count();
      const activeProducts = await this.productRepository.count({ where: { isActive: true } });
      const lowStockThreshold = 10; // O tomar de req.query si es configurable
      const lowStockProducts = await this.productRepository.count({
        where: {
          stock: LessThanOrEqual(lowStockThreshold),
          isActive: true // Asegurar que contamos solo los activos bajos de stock
        }
      });

      const categories = await this.productRepository
        .createQueryBuilder("product")
        .select("product.category", "category")
        .addSelect("COUNT(product.id)", "count")
        .groupBy("product.category")
        .getRawMany();

      const productCategories = categories.map(c => ({ 
        name: c.category, 
        count: parseInt(c.count, 10)
      }));

      res.json({
        totalProducts,
        activeProducts,
        lowStockProducts,
        productCategories
      });
    } catch (error) {
      console.error('Error getting product stats:', error);
      res.status(500).json({ message: 'Error getting product stats' });
    }
  }

  /**
   * Método principal para generar el reporte de ventas consolidado (DEPRECADO)
   * Ahora los reportes se obtienen de endpoints específicos.
   */
  async getSalesReport(req: Request, res: Response) {
    try {
      res.status(404).json({ message: "Este endpoint ha sido deprecado. Use los endpoints específicos para reportes de ventas." });
    } catch (error) {
      console.error('Error en getSalesReport (deprecado):', error);
      res.status(500).json({ message: 'Error generando el reporte de ventas' });
    }
  }

  // Nuevo método para obtener el stock de todos los ingredientes
  async getIngredientStock(req: Request, res: Response) {
    try {
      const ingredients = await this.ingredientRepository.find({
        select: [
          'id',
          'name',
          'description',
          'stockQuantity',
          'unitOfMeasure',
          'costPrice',
          'lowStockThreshold',
          'supplier',
          'updatedAt' // Para saber cuándo fue la última actualización
        ],
        order: {
          name: 'ASC' // Ordenar alfabéticamente por nombre
        }
      });
      res.json(ingredients);
    } catch (error) {
      console.error('Error al obtener stock de ingredientes:', error);
      res.status(500).json({ message: 'Error al obtener stock de ingredientes' });
    }
  }

  // Puedes agregar más métodos de reportes aquí si es necesario
  // Por ejemplo, reporte de gastos, reporte de performance de empleados, etc.
} 