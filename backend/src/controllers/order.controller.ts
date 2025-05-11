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
import { QueryFailedError } from 'typeorm'; // Para tipar errores específicos de TypeORM

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
        const product = await queryRunner.manager.getRepository(Product).findOneBy({ id: itemDto.productId });

        if (!product) {
          await queryRunner.rollbackTransaction();
          return res.status(400).json({ message: `Product with ID ${itemDto.productId} not found.` });
        }
        if (!product.isActive) {
          await queryRunner.rollbackTransaction();
          return res.status(400).json({ message: `Product ${product.name} is not active.` });
        }
        if (product.stock < itemDto.quantity) {
          await queryRunner.rollbackTransaction();
          return res.status(400).json({ message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${itemDto.quantity}` });
        }

        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = itemDto.quantity;
        orderItem.price = parseFloat(product.price.toString());
        
        newOrder.items.push(orderItem);
        calculatedTotal += orderItem.price * orderItem.quantity;

        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(Product, product);
      }

      newOrder.total = calculatedTotal;
      const savedOrder = await queryRunner.manager.save(Order, newOrder);

      await queryRunner.commitTransaction();

      const fullOrder = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'createdBy']
      });

      if (fullOrder) {
        await printerService.printOrder(fullOrder);
        res.status(201).json(fullOrder);
      } else {
        res.status(500).json({ message: 'Order created but could not be retrieved for printing.'});
      }

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating order:', error);
      let errorMessage = 'Error creating order';
      let errorDetails;
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message;
        if (error instanceof QueryFailedError && (error as any).message.includes('UQ_ORDER_CUSTOMER_NAME_TYPE')) {
            return res.status(409).json({ message: 'Order with similar details already exists.', details: (error as any).message });
        }
      }
      if (error instanceof Error) {
          errorDetails = { name: error.name, message: error.message, stack: error.stack };
      }
      res.status(500).json({ message: errorMessage, details: errorDetails || error });
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
    try {
      const { id } = req.params;
      const updateOrderStatusDto = req.body as UpdateOrderStatusDto;

      const order = await this.orderRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['items', 'items.product', 'createdBy']
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      order.status = updateOrderStatusDto.status;
      const updatedOrder = await this.orderRepository.save(order);
      res.json(updatedOrder);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Error updating order status' });
    }
  }

  /**
   * Cancela un pedido
   * @param req - Request de Express con el ID del pedido
   * @param res - Response de Express
   * @returns Pedido cancelado
   */
  async cancel(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      const order = await queryRunner.manager.getRepository(Order).findOne({
        where: { id: orderId },
        relations: ['items', 'items.product']
      });

      if (!order) {
        await queryRunner.rollbackTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }
      if (order.status === OrderStatus.CANCELLED) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({ message: 'Order is already cancelled.' });
      }
      if (order.status === OrderStatus.COMPLETED) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({ message: 'Cannot cancel a completed order.' });
      }

      for (const item of order.items) {
        if (item.product) {
          const product = await queryRunner.manager.getRepository(Product).findOneBy({ id: item.product.id });
          if (product) {
            product.stock += item.quantity;
            await queryRunner.manager.save(Product, product);
          } else {
            console.warn(`Product with ID ${item.product.id} for order item ${item.id} not found during cancellation stock refund.`);
          }
        } else {
           console.warn(`Product data missing for order item ${item.id} during cancellation stock refund.`);
        }
      }

      order.status = OrderStatus.CANCELLED;
      const cancelledOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
      res.json(cancelledOrder);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error cancelling order:', error);
      let errorMessage = 'Error cancelling order';
      if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message;
      }
      res.status(500).json({ message: errorMessage, details: error });
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
      const orders = await this.orderRepository.find({
        where: [
          { status: OrderStatus.PENDING },
          { status: OrderStatus.IN_PROGRESS }
        ],
        relations: ['items', 'items.product', 'createdBy'],
        order: { createdAt: 'ASC' }
      });
      res.json(orders);
    } catch (error: any) {
      console.error('Error getting active orders:', error);
      res.status(500).json({ message: 'Error getting active orders' });
    }
  }
} 