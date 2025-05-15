/**
 * Controlador de pedidos
 * Maneja todas las operaciones relacionadas con pedidos, incluyendo su creación,
 * actualización, cancelación e impresión
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Order, OrderStatus, OrderType, PaymentMethod } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product } from '../entities/Product';
import { printerService } from '../services/printer.service';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/order.dto'; // Importar DTOs
import { User } from '../entities/User'; // Para asignar el usuario que crea la orden
import { QueryFailedError, EntityManager } from 'typeorm'; // Para tipar errores específicos de TypeORM y EntityManager
import { ingredientService } from '../services/ingredient.service'; // Importar IngredientService
import { Recipe } from '../entities/Recipe'; // Importar Recipe para verificación
import { HttpException, HttpStatus } from '../utils/HttpException'; // Asumiendo que existe
import { OrderService } from '../services/order.service';

export class OrderController {
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private productRepository = AppDataSource.getRepository(Product);
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Obtiene todos los pedidos con sus items y productos relacionados
   * @param req - Request de Express
   * @param res - Response de Express
   * @returns Lista de pedidos
   */
  async getAll(req: Request, res: Response) {
    try {
      // Extraer el parámetro de consulta 'statuses'
      // req.query.statuses puede ser undefined, string, o string[]
      let statusesFilter: OrderStatus[] | undefined = undefined;
      const statusesQuery = req.query.statuses;

      if (typeof statusesQuery === 'string') {
        statusesFilter = [statusesQuery as OrderStatus];
      } else if (Array.isArray(statusesQuery) && statusesQuery.every(s => typeof s === 'string')) {
        statusesFilter = statusesQuery as OrderStatus[];
      }
      
      // Validar que los estados sean conocidos por el enum OrderStatus (opcional pero recomendado)
      if (statusesFilter) {
        statusesFilter = statusesFilter.filter(s => Object.values(OrderStatus).includes(s));
        if (statusesFilter.length === 0) statusesFilter = undefined; // Si ninguno es válido, no filtrar
      }

      const orders = await this.orderService.findAll(statusesFilter);
      
      console.log(`[${new Date().toISOString()}] GET /api/orders${statusesFilter ? `?statuses=${statusesFilter.join(',')}` : ''} - Enviando ${orders.length} órdenes.`);
      res.json(orders);
    } catch (error: any) {
      console.error('Error getting orders:', error);
      res.status(500).json({ message: 'Error getting orders' });
    }
  }

  /**
   * Obtiene un pedido por su ID
   * @param req - Request de Express con el ID del pedido
   * @param res - Response de Express
   * @returns Datos del pedido
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await this.orderRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['items', 'items.product', 'createdBy']
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (error: any) {
      console.error('Error getting order:', error);
      res.status(500).json({ message: 'Error getting order' });
    }
  }

  /**
   * Método privado para manejar la deducción de stock.
   * Se asume que la orden ya tiene items y productos relacionados cargados.
   */
  private async _handleStockDeduction(order: Order, manager: EntityManager): Promise<void> {
    for (const item of order.items) {
      // Recargar el producto dentro de la transacción para asegurar datos frescos y bloqueo
      const product = await manager.getRepository(Product).findOne({
        where: { id: item.productId },
        relations: ['recipe', 'recipe.items', 'recipe.items.ingredient'], // Asegurar que las relaciones necesarias están aquí
      });

      if (!product) {
        // Esto no debería ocurrir si el producto se validó al crear el item del pedido,
        // pero es una verificación de seguridad.
        throw new HttpException(`Product with ID ${item.productId} not found during stock deduction.`, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (product.manageStock) {
        if (product.stock < item.quantity) {
          throw new HttpException(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`, HttpStatus.CONFLICT);
        }
        product.stock -= item.quantity;
        await manager.save(Product, product);
      } else if (product.recipe && product.recipe.items && product.recipe.items.length > 0) {
        for (const recipeItem of product.recipe.items) {
          if (!recipeItem.ingredient) {
            throw new HttpException(`Corrupted recipe data: Ingredient missing for recipe item ID ${recipeItem.id} in product ${product.name}.`, HttpStatus.INTERNAL_SERVER_ERROR);
          }
          const quantityToDecrement = Number(recipeItem.quantity) * item.quantity;
          // ingredientService.adjustStock ya maneja la lógica de stock < 0 y lanza error
          await ingredientService.adjustStock(recipeItem.ingredient.id, -quantityToDecrement, manager);
        }
      } else {
        console.warn(`Product ${product.name} (ID: ${product.id}) does not manage stock and has no (or empty) recipe. No stock deducted.`);
      }
    }
  }

  /**
   * Crea un nuevo pedido y lo imprime
   * @param req - Request de Express con los datos del pedido (CreateOrderDto)
   * @param res - Response de Express
   * @returns Pedido creado
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const createOrderDto = req.body as CreateOrderDto; // req.body ya validado por validateDto middleware
      const userId = req.user?.id;

      if (!userId) {
        throw new HttpException('Usuario no autenticado o ID no encontrado en token.', HttpStatus.UNAUTHORIZED);
      }

      // Combinar DTO con userId para el servicio
      const orderDataForService = { ...createOrderDto, createdById: userId };
      
      const order = await this.orderService.createOrder(orderDataForService);
      res.status(HttpStatus.CREATED).json(order);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).json({ message: error.message });
      } else {
        console.error('Error creating order:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error interno al crear el pedido';
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: errorMessage });
      }
    }
  }

  /**
   * Actualiza el estado de un pedido
   * @param req - Request de Express con el ID y el nuevo estado (UpdateOrderStatusDto)
   * @param res - Response de Express
   * @returns Pedido actualizado
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { status } = req.body; // Esperamos un campo 'status' en el body

      if (isNaN(orderId)) {
        throw new HttpException('ID de pedido inválido', HttpStatus.BAD_REQUEST);
      }
      if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
        throw new HttpException('Estado de pedido inválido o no proporcionado', HttpStatus.BAD_REQUEST);
      }

      const updatedOrder = await this.orderService.updateOrderStatus(orderId, status as OrderStatus);
      res.status(HttpStatus.OK).json(updatedOrder);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).json({ message: error.message });
      } else {
        console.error('Error updating order status:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error interno al actualizar estado del pedido' });
      }
    }
  }

  /**
   * Cancela un pedido
   * @param req - Request de Express con el ID del pedido
   * @param res - Response de Express
   * @returns Pedido cancelado
   */
  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, { 
        where: { id: parseInt(id) },
        relations: ['items', 'items.product', 'items.product.recipe', 'items.product.recipe.items', 'items.product.recipe.items.ingredient'] 
      });

      if (!order) {
        await queryRunner.rollbackTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.status === OrderStatus.CANCELLED) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({ message: 'Order is already cancelled' });
      }
      
      const wasCompleted = order.status === OrderStatus.COMPLETED;
      order.status = OrderStatus.CANCELLED;
      const updatedOrder = await queryRunner.manager.save(order);

      // Si el pedido estaba COMPLETADO, revertir el stock
      if (wasCompleted) {
        for (const item of order.items) {
          const product = item.product; // Ya cargado con las relaciones
          if (!product) {
            // Esta verificación ya debería estar cubierta por las relaciones cargadas.
            // Considerar si es necesario lanzar un error más específico si product no está aquí.
            throw new HttpException(`Product details missing for item ID ${item.id} during stock reversion.`, HttpStatus.INTERNAL_SERVER_ERROR);
          }

          if (product.manageStock) {
            product.stock += item.quantity;
            await queryRunner.manager.save(Product, product);
          } else if (product.recipe && product.recipe.items && product.recipe.items.length > 0) {
            for (const recipeItem of product.recipe.items) {
              if (!recipeItem.ingredient) {
                 throw new HttpException(`Corrupted recipe data: Ingredient missing for recipe item ID ${recipeItem.id} in product ${product.name} during stock reversion.`, HttpStatus.INTERNAL_SERVER_ERROR);
              }
              const quantityToIncrement = Number(recipeItem.quantity) * item.quantity;
              await ingredientService.adjustStock(recipeItem.ingredient.id, quantityToIncrement, queryRunner.manager); // Sumar de nuevo al stock
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      res.json(updatedOrder);
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      console.error('Error cancelling order:', error);
      let errorMessage = 'Error cancelling order';
      if (error instanceof HttpException) {
        return res.status(error.status || 500).json({ message: error.message, details: error.errors });
      }
      if (error instanceof Error) {
          errorMessage = error.message;
      }
      res.status(500).json({ message: errorMessage, details: error.constructor?.name });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reimprime un pedido existente
   * @param req - Request de Express con el ID del pedido
   * @param res - Response de Express
   * @returns Mensaje de éxito
   */
  async reprint(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await this.orderRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['items', 'items.product', 'createdBy']
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      await printerService.printOrder(order);
      res.json({ message: 'Order reprinted successfully' });
    } catch (error: any) {
      console.error('Error reprinting order:', error);
      res.status(500).json({ message: 'Error reprinting order' });
    }
  }

  /**
   * Obtiene los pedidos activos (pendientes o en progreso)
   * @param req - Request de Express
   * @param res - Response de Express
   * @returns Lista de pedidos activos
   */
  async getActiveOrders(req: Request, res: Response) {
    try {
      const activeOrders = await this.orderRepository.find({
        where: [
          { status: OrderStatus.PENDING },
          { status: OrderStatus.IN_PROGRESS },
          // Podríamos incluir otros estados si se consideran "activos" para la vista de cocina/POS
        ],
        relations: ['items', 'items.product', 'createdBy'],
        order: { createdAt: 'ASC' } 
      });
      res.json(activeOrders);
    } catch (error: any) {
      console.error('Error getting active orders:', error);
      res.status(500).json({ message: 'Error getting active orders' });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        throw new HttpException('ID de pedido inválido', HttpStatus.BAD_REQUEST);
      }
      const order = await this.orderService.findOrderById(orderId);
      if (!order) {
        throw new HttpException(`Pedido con ID ${orderId} no encontrado`, HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(order);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).json({ message: error.message });
      } else {
        console.error('Error fetching order:', error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error interno al obtener el pedido' });
      }
    }
  }

  async complete(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        throw new HttpException('ID de pedido inválido', HttpStatus.BAD_REQUEST);
      }

      const completedOrder = await this.orderService.completeOrder(orderId);
      res.status(HttpStatus.OK).json(completedOrder);
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).json({ message: error.message });
      } else {
        console.error('Error completing order:', error);
        // Verificar si el error es una instancia de Error para acceder a .message de forma segura
        const errorMessage = error instanceof Error ? error.message : 'Error interno al completar el pedido';
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: errorMessage });
      }
    }
  }
} 