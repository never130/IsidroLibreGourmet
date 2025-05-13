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
import { ingredientService } from '../services/ingredient.service'; // Importar IngredientService
import { Recipe } from '../entities/Recipe'; // Importar Recipe para verificación

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
        const product = await queryRunner.manager.getRepository(Product).findOne({
          where: { id: itemDto.productId },
          relations: ['recipe', 'recipe.items', 'recipe.items.ingredient', 'recipe.items.unitOfMeasure'],
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

        // Lógica de descuento de Stock
        if (product.manageStock) {
          // El producto gestiona su propio stock, descontar de product.stock
          if (product.stock < itemDto.quantity) {
            await queryRunner.rollbackTransaction();
            return res.status(400).json({ message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${itemDto.quantity}` });
          }
          product.stock -= itemDto.quantity;
          await queryRunner.manager.save(Product, product);
        } else if (product.recipe && product.recipe.items && product.recipe.items.length > 0) {
          // El producto NO gestiona su propio stock Y TIENE receta, descontar ingredientes
          for (const recipeItem of product.recipe.items) {
            if (!recipeItem.ingredient) {
                await queryRunner.rollbackTransaction();
                return res.status(500).json({ message: `Corrupted recipe data: Ingredient missing for recipe item ID ${recipeItem.id} in product ${product.name}.` });
            }
            const quantityToDecrement = Number(recipeItem.quantity) * itemDto.quantity;
            try {
                await ingredientService.adjustStock(recipeItem.ingredient.id, -quantityToDecrement, queryRunner.manager);
            } catch (error: any) {
                await queryRunner.rollbackTransaction();
                return res.status(error.status || 500).json({ 
                    message: error.message || 'Error adjusting ingredient stock.',
                    details: `Failed to adjust stock for ingredient: ${recipeItem.ingredient.name}`
                });
            }
          }
        } else {
          // El producto no gestiona stock propio y no tiene receta, o la receta está vacía.
          // Considerar si esto es un error o si simplemente no se descuenta nada.
          // Por ahora, no se descuenta nada. Podría loguearse una advertencia.
          console.warn(`Product ${product.name} (ID: ${product.id}) does not manage stock and has no (or empty) recipe. No stock deducted.`);
        }
      }

      newOrder.total = calculatedTotal;
      // Guardar primero los OrderItems si no se hace por cascada desde Order, o asegurar que la cascada los crea.
      // Si Order tiene cascade: true para items, esto es suficiente.
      // await queryRunner.manager.save(OrderItem, newOrder.items); // Esto puede ser necesario si la cascada no es completa
      const savedOrder = await queryRunner.manager.save(Order, newOrder);


      await queryRunner.commitTransaction();

      // Recuperar la orden completa para la respuesta y la impresión
      const fullOrder = await AppDataSource.getRepository(Order).findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'createdBy', 'items.product.recipe', 'items.product.recipe.items', 'items.product.recipe.items.ingredient'],
      });

      if (fullOrder) {
        await printerService.printOrder(fullOrder);
        res.status(201).json(fullOrder);
      } else {
        // Esto no debería ocurrir si la transacción fue exitosa y el ID es correcto.
        // Considerar loggear un error crítico aquí.
        res.status(500).json({ message: 'Order created but could not be retrieved for printing/response.'});
      }

    } catch (error: any) { // Asegurar que el tipo de error es any o Error
      if (queryRunner.isTransactionActive) { // Solo hacer rollback si la transacción está activa
        await queryRunner.rollbackTransaction();
      }
      console.error('Error creating order:', error);
      let errorMessage = 'Error creating order';
      // La HttpException de ingredientService ya debería tener un status
      if (error.status && error.message) {
          return res.status(error.status).json({ message: error.message, details: error.errors });
      }
      
      if (error instanceof QueryFailedError && (error as any).message.includes('UQ_ORDER_CUSTOMER_NAME_TYPE')) {
          return res.status(409).json({ message: 'Order with similar details already exists.', details: (error as any).message });
      }
      if (error instanceof Error) {
          errorMessage = error.message;
      }
      res.status(500).json({ message: errorMessage, details: error.constructor.name });
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
        // Cargar relaciones necesarias para reponer stock de ingredientes
        relations: ['items', 'items.product', 'items.product.recipe', 'items.product.recipe.items', 'items.product.recipe.items.ingredient']
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
          const product = item.product; // Ya está cargado con sus relaciones
          
          // Lógica de Reposición de Stock
          if (product.manageStock) {
            // El producto gestiona su propio stock, reponer en product.stock
            const productRepo = queryRunner.manager.getRepository(Product);
            const dbProduct = await productRepo.findOneBy({id: product.id});
            if(dbProduct){
                dbProduct.stock += item.quantity;
                await productRepo.save(dbProduct);
            } else {
                 console.warn(`Product with ID ${product.id} not found during stock refund for product itself.`);
            }
          } else if (product.recipe && product.recipe.items && product.recipe.items.length > 0) {
            // El producto NO gestiona su propio stock Y TIENE receta, reponer ingredientes
            for (const recipeItem of product.recipe.items) {
              if (recipeItem.ingredient) {
                const quantityToIncrement = Number(recipeItem.quantity) * item.quantity;
                try {
                  await ingredientService.adjustStock(recipeItem.ingredient.id, quantityToIncrement, queryRunner.manager);
                } catch (error: any) {
                  // Si falla la reposición de un ingrediente, hacer rollback y notificar.
                  console.error(`Critical: Failed to restock ingredient ${recipeItem.ingredient.name} (ID: ${recipeItem.ingredient.id}) during order cancellation. Rolling back. Error: ${error.message}`);
                  await queryRunner.rollbackTransaction();
                  // Usar el status del error si es HttpException, sino 500
                  const status = error.status || 500;
                  const message = error.message || 'Error restocking ingredient during order cancellation.';
                  return res.status(status).json({ 
                      message: `Order cancellation aborted: ${message}`,
                      details: `Failed to restock ingredient: ${recipeItem.ingredient.name}` 
                  });
                }
              } else {
                console.warn(`Ingredient data missing for recipe item ID ${recipeItem.id} in product ${product.name} during cancellation stock refund.`);
              }
            }
          } else {
            // El producto no gestiona stock propio y no tiene receta, o la receta está vacía.
            // No hay stock de ingredientes que reponer que fuera descontado por receta.
             console.warn(`Product ${product.name} (ID: ${product.id}) does not manage stock and has no (or empty) recipe. No ingredient stock to refund.`);
          }
        } else {
           console.warn(`Product data missing for order item ${item.id} during cancellation stock refund.`);
        }
      }

      order.status = OrderStatus.CANCELLED;
      const cancelledOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
      res.json(cancelledOrder);
    } catch (error: any) { // Asegurar tipo de error
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: 'Error cancelling order', details: error.message });
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