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

export class OrderController {
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private productRepository = AppDataSource.getRepository(Product);
  // Considerar inyectar repositorios en el constructor para mejor testabilidad

  /**
   * Obtiene todos los pedidos con sus items y productos relacionados
   * @param req - Request de Express
   * @param res - Response de Express
   * @returns Lista de pedidos
   */
  async getAll(req: Request, res: Response) {
    try {
      const orders = await this.orderRepository.find({
        relations: ['items', 'items.product', 'createdBy'],
        order: { createdAt: 'DESC' }
      });
      // Log para depuración
      console.log(`[${new Date().toISOString()}] GET /api/orders - Enviando ${orders.length} órdenes. Primera orden ID (si existe): ${orders[0]?.id}`);
      // console.log('Detalle de órdenes enviadas:', JSON.stringify(orders, null, 2)); // Descomentar para ver todo el detalle si es necesario
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
  async create(req: Request, res: Response) {
    const createOrderDto = req.body as CreateOrderDto;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(403).json({ message: 'User ID not found in token. Unauthorized.' });
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userRepository = queryRunner.manager.getRepository(User);
      const createdByUser = await userRepository.findOneBy({ id: userId });

      if (!createdByUser) {
        await queryRunner.rollbackTransaction();
        return res.status(404).json({ message: 'User creating the order not found.' });
      }

      const newOrder = new Order();
      newOrder.type = createOrderDto.type;
      newOrder.customerName = createOrderDto.customerName;
      newOrder.customerPhone = createOrderDto.customerPhone ?? null;
      newOrder.address = createOrderDto.address ?? null;
      newOrder.notes = createOrderDto.notes ?? null;
      newOrder.paymentMethod = createOrderDto.paymentMethod;
      newOrder.status = OrderStatus.PENDING;
      newOrder.createdBy = createdByUser;
      newOrder.createdById = createdByUser.id;
      newOrder.items = [];
      newOrder.total = 0;

      let calculatedTotal = 0;

      for (const itemDto of createOrderDto.items) {
        const product = await queryRunner.manager.getRepository(Product).findOne({
          where: { id: itemDto.productId }
          // No necesitamos relaciones de receta aquí ya que el stock no se descuenta en la creación
        });

        if (!product) {
          await queryRunner.rollbackTransaction();
          return res.status(400).json({ message: `Product with ID ${itemDto.productId} not found.` });
        }
        if (!product.isActive) {
          await queryRunner.rollbackTransaction();
          return res.status(400).json({ message: `Product ${product.name} is not active.` });
        }
        
        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.productId = product.id;
        orderItem.quantity = itemDto.quantity;
        orderItem.price = parseFloat(product.price.toString());
        newOrder.items.push(orderItem);
        calculatedTotal += orderItem.price * orderItem.quantity;
      }

      newOrder.total = calculatedTotal;
      const savedOrder = await queryRunner.manager.save(Order, newOrder);

      await queryRunner.commitTransaction();

      // Recuperar la orden completa para la respuesta y la impresión
      const fullOrder = await AppDataSource.getRepository(Order).findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'createdBy'], 
      });

      if (fullOrder) {
        await printerService.printOrder(fullOrder);
        res.status(201).json(fullOrder);
      } else {
        // Esto es improbable si la transacción fue exitosa.
        res.status(500).json({ message: 'Order created but could not be retrieved for printing/response.'});
      }

    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      console.error('Error creating order:', error);
      let errorMessage = 'Error creating order';
      if (error instanceof HttpException) {
        return res.status(error.status || 500).json({ message: error.message, details: error.errors });
      }
      if (error instanceof QueryFailedError && (error as any).message.includes('UQ_ORDER_CUSTOMER_NAME_TYPE')) {
          return res.status(409).json({ message: 'Order with similar details already exists.', details: (error as any).message });
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
   * Actualiza el estado de un pedido
   * @param req - Request de Express con el ID y el nuevo estado (UpdateOrderStatusDto)
   * @param res - Response de Express
   * @returns Pedido actualizado
   */
  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const updateOrderStatusDto = req.body as UpdateOrderStatusDto;

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.getRepository(Order).findOne({
        where: { id: parseInt(id) },
        relations: ['items'] 
      });

      if (!order) {
        await queryRunner.rollbackTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }

      const previousStatus = order.status;
      order.status = updateOrderStatusDto.status;
      
      // Guardar el cambio de estado primero
      const savedOrder = await queryRunner.manager.save(Order, order);

      // Lógica de descuento de Stock si el pedido se marca como COMPLETADO y no lo estaba antes
      if (previousStatus !== OrderStatus.COMPLETED && savedOrder.status === OrderStatus.COMPLETED) {
        // Volver a cargar la orden con todas las relaciones necesarias DENTRO de la transacción
        const orderForStockDeduction = await queryRunner.manager.getRepository(Order).findOne({
            where: { id: savedOrder.id },
            relations: [
                'items', 
                'items.product', 
                'items.product.recipe', 
                'items.product.recipe.items', 
                'items.product.recipe.items.ingredient'
            ]
        });

        if (!orderForStockDeduction) {
            // Esto sería muy inusual si savedOrder existe.
            throw new HttpException('Order disappeared during status update for stock deduction.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        await this._handleStockDeduction(orderForStockDeduction, queryRunner.manager);
      }

      await queryRunner.commitTransaction();
      
      // Devolver la orden con el estado actualizado y potencialmente items/productos
      const finalOrder = await AppDataSource.getRepository(Order).findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'createdBy'] 
      });

      res.json(finalOrder);

    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      console.error('Error updating order status:', error);
      let errorMessage = 'Error updating order status';
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
} 