import { AppDataSource } from '../data-source';
import { Order, OrderStatus, OrderType, PaymentMethod } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import { Ingredient } from '../entities/Ingredient';
import { Repository, EntityManager } from 'typeorm';
import { RecipeService } from './recipe.service';
import { IngredientService } from './ingredient.service';
import { HttpException, HttpStatus } from '../utils/HttpException';
import type { CreateOrderDto as BackendCreateOrderDto, OrderItemDto as BackendOrderItemDto } from '../dtos/order.dto';

// Tipo para los datos de entrada de createOrder
export interface CreateOrderServiceData extends Omit<BackendCreateOrderDto, 'items'> {
  items: BackendOrderItemDto[];
  createdById: number;
}

export class OrderService {
  private orderRepository: Repository<Order>;
  private productRepository: Repository<Product>;
  private userRepository: Repository<User>;
  private ingredientRepository: Repository<Ingredient>;
  private recipeService: RecipeService;
  private ingredientService: IngredientService;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.productRepository = AppDataSource.getRepository(Product);
    this.userRepository = AppDataSource.getRepository(User);
    this.ingredientRepository = AppDataSource.getRepository(Ingredient);
    this.recipeService = new RecipeService();
    this.ingredientService = new IngredientService();
  }

  async createOrder(orderData: CreateOrderServiceData): Promise<Order> {
    return AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      const orderRepo = transactionalEntityManager.getRepository(Order);
      const orderItemRepo = transactionalEntityManager.getRepository(OrderItem);
      const productRepo = transactionalEntityManager.getRepository(Product);
      const userRepo = transactionalEntityManager.getRepository(User);

      const createdByUser = await userRepo.findOneBy({ id: orderData.createdById });
      if (!createdByUser) {
        throw new HttpException('Usuario creador no encontrado', HttpStatus.NOT_FOUND);
      }

      const newOrder = orderRepo.create({
        type: orderData.type,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        address: orderData.address,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        status: OrderStatus.PENDING, // Estado inicial
        createdById: createdByUser.id,
        createdBy: createdByUser,
        items: [], // Se llenarán a continuación
        total: 0, // Se calculará
      });

      let calculatedTotal = 0;

      for (const itemDto of orderData.items) {
        const product = await productRepo.findOneBy({ id: itemDto.productId });
        if (!product) {
          throw new HttpException(`Producto con ID ${itemDto.productId} no encontrado.`, HttpStatus.BAD_REQUEST);
        }
        if (!product.isActive) {
          throw new HttpException(`Producto ${product.name} (ID: ${itemDto.productId}) no está activo.`, HttpStatus.BAD_REQUEST);
        }
        // Aquí podrías añadir una validación de stock si el producto maneja stock directamente y no por receta,
        // y si quieres prevenir la creación de pedidos con productos sin stock en este punto.
        // if (product.manageStock && product.stock < itemDto.quantity) {
        //   throw new HttpException(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${itemDto.quantity}`, HttpStatus.CONFLICT);
        // }

        const orderItem = orderItemRepo.create({
          order: newOrder, // Se vincula al guardar el pedido principal si hay cascade
          product: product,
          productId: product.id,
          quantity: itemDto.quantity,
          price: parseFloat(product.price.toString()), // Tomar precio actual del producto
        });
        newOrder.items.push(orderItem); // TypeORM manejará el guardado de estos items anidados si cascade está bien configurado en la entidad Order
        calculatedTotal += orderItem.price * orderItem.quantity;
      }

      newOrder.total = parseFloat(calculatedTotal.toFixed(2));
      
      // Guardar el pedido principal. Si Order.items tiene cascade: ['insert'], los items se guardarán también.
      // Si no, necesitaríamos guardar los items explícitamente: await transactionalEntityManager.save(OrderItem, newOrder.items);
      const savedOrder = await orderRepo.save(newOrder);
      
      // Recargar para devolver con todas las relaciones (opcional, pero bueno para la respuesta)
      return orderRepo.findOneOrFail({
          where: { id: savedOrder.id },
          relations: ['items', 'items.product', 'createdBy']
      });
    });
  }

  async findOrderById(orderId: number): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'items',
        'items.product',
        'createdBy' // Añadir createdBy para consistencia
      ],
    });
  }
  
  async updateOrderStatus(orderId: number, status: OrderStatus, manager?: EntityManager): Promise<Order> {
    const orderRepo = manager ? manager.getRepository(Order) : this.orderRepository;
    const order = await orderRepo.findOneBy({ id: orderId });
    if (!order) {
      throw new HttpException(`Pedido con ID ${orderId} no encontrado.`, HttpStatus.NOT_FOUND);
    }
    order.status = status;
    return orderRepo.save(order);
  }

  async completeOrder(orderId: number, manager?: EntityManager): Promise<Order> {
    const orderRepo = manager ? manager.getRepository(Order) : this.orderRepository;
    
    const order = await orderRepo.findOne({
        where: { id: orderId },
        relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new HttpException(`Pedido con ID ${orderId} no encontrado.`, HttpStatus.NOT_FOUND);
    }

    if (order.status === OrderStatus.COMPLETED) {
      console.warn(`El pedido ${orderId} ya está completado.`);
      return order;
    }
    
    if (order.status === OrderStatus.CANCELLED) {
        throw new HttpException(`El pedido ${orderId} está cancelado y no se puede completar.`, HttpStatus.BAD_REQUEST);
    }

    await this.deductStockForOrder(order, manager);

    order.status = OrderStatus.COMPLETED;
    const updatedOrder = await orderRepo.save(order);
    
    console.log(`Pedido ${orderId} completado y stock deducido.`);
    return updatedOrder;
  }

  private async deductStockForOrder(order: Order, manager?: EntityManager): Promise<void> {
    if (!order.items || order.items.length === 0) {
      console.log(`El pedido ${order.id} no tiene ítems, no se deduce stock.`);
      return;
    }

    for (const orderItem of order.items) {
      if (!orderItem.product) {
        console.warn(`OrderItem ${orderItem.id} en el pedido ${order.id} no tiene producto asociado cargado. Omitiendo deducción de stock para este ítem.`);
        continue;
      }
      const product = orderItem.product;
      
      const recipe = await this.recipeService.findOneByProductId(product.id, manager);

      if (!recipe || !recipe.items || recipe.items.length === 0) {
        console.log(`Producto ${product.name} (ID: ${product.id}) en el pedido ${order.id} no tiene receta o la receta no tiene ítems. No se deduce stock para este producto.`);
        continue;
      }
      console.log(`Procesando receta para producto ${product.name} (ID: ${product.id}) en pedido ${order.id}`);

      for (const recipeItem of recipe.items) {
        if (!recipeItem.ingredient) {
            console.warn(`RecipeItem (ID: ${recipeItem.id}) para producto ${product.name} no tiene la entidad Ingredient cargada. Omitiendo.`);
            continue;
        }
        const ingredient = recipeItem.ingredient;
        const quantityToDeduct = recipeItem.quantity * orderItem.quantity;

        console.log(`Intentando deducir ${quantityToDeduct} de ${ingredient.unitOfMeasure} del ingrediente ${ingredient.name} (ID: ${ingredient.id}). Stock actual: ${ingredient.stockQuantity}`);

        if (ingredient.stockQuantity < quantityToDeduct) {
          console.warn(`¡Stock insuficiente para el ingrediente ${ingredient.name} (ID: ${ingredient.id})! Stock actual: ${ingredient.stockQuantity}, se necesitan: ${quantityToDeduct}. El stock podría quedar negativo.`);
        }
        
        const newStock = ingredient.stockQuantity - quantityToDeduct;
        await this.ingredientService.updateStock(ingredient.id, newStock, manager);
        
        console.log(`Stock del ingrediente ${ingredient.name} (ID: ${ingredient.id}) actualizado a ${newStock}.`);
      }
    }
  }
} 