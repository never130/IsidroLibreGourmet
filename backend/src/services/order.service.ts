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

/**
 * Estructura de datos esperada por el método `createOrder` del servicio,
 * combinando el DTO del backend con el ID del usuario creador.
 */
export interface CreateOrderServiceData extends Omit<BackendCreateOrderDto, 'items'> {
  items: BackendOrderItemDto[];
  createdById: number;
}

/**
 * Servicio para manejar la lógica de negocio relacionada con los pedidos (Orders).
 * Encapsula operaciones como creación, búsqueda, y actualización de estado de pedidos,
 * incluyendo el manejo de stock de ingredientes a través de recetas.
 */
export class OrderService {
  private orderRepository: Repository<Order>;
  private productRepository: Repository<Product>;
  private userRepository: Repository<User>;
  // private ingredientRepository: Repository<Ingredient>; // No usado directamente aquí, sino a través de IngredientService
  private recipeService: RecipeService;
  private ingredientService: IngredientService;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.productRepository = AppDataSource.getRepository(Product);
    this.userRepository = AppDataSource.getRepository(User);
    // this.ingredientRepository = AppDataSource.getRepository(Ingredient);
    this.recipeService = new RecipeService(); // Instancia del servicio de recetas
    this.ingredientService = new IngredientService(); // Instancia del servicio de ingredientes
  }

  /**
   * Crea un nuevo pedido en el sistema.
   * Esta operación se ejecuta dentro de una transacción para asegurar la atomicidad.
   * @param orderData - Datos para crear el pedido, incluyendo ítems y ID del usuario creador.
   * @returns La entidad Order creada y guardada, con sus relaciones cargadas.
   * @throws HttpException si el usuario creador o algún producto no se encuentra, o si un producto no está activo.
   */
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
        status: OrderStatus.PENDING,
        createdById: createdByUser.id,
        createdBy: createdByUser, // Asegura que la instancia también tenga el objeto User
        items: [], // Inicializar como array vacío para los items
        total: 0, 
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

        const orderItem = orderItemRepo.create({
          product: product,
          productId: product.id,
          quantity: itemDto.quantity,
          price: parseFloat(product.price.toString()),
        });
        newOrder.items.push(orderItem); // Añadir el ítem creado al array de la orden
        calculatedTotal += orderItem.price * orderItem.quantity;
      }

      newOrder.total = parseFloat(calculatedTotal.toFixed(2));
      
      console.log('Objeto newOrder ANTES de guardar:', JSON.stringify(newOrder, null, 2));
      const savedOrder = await orderRepo.save(newOrder); // Guardar la Order con sus items en cascada
      
      // --- INICIO MARCADOR DE COMANDERA ---
      console.log(`[COMANDERA SIMULADA] Pedido ID: ${savedOrder.id} creado.`);
      console.log(`[COMANDERA SIMULADA] Cliente: ${savedOrder.customerName}, Tipo: ${savedOrder.type}`);
      if(savedOrder.items && savedOrder.items.length > 0) {
        savedOrder.items.forEach(item => {
          // Para obtener el nombre del producto, necesitaríamos cargarlo o ya tenerlo.
          // Asumiendo que item.product está disponible si la relación se carga después o se pasa.
          // Por simplicidad, aquí solo mostraremos productId y quantity.
          // En una implementación real, cargaríamos los nombres de producto para la comandera.
          console.log(`[COMANDERA SIMULADA] Item: ProductID ${item.productId}, Cantidad: ${item.quantity}, Precio: ${item.price}`);
        });
      } else {
        console.log('[COMANDERA SIMULADA] El pedido no tiene items.');
      }
      if (savedOrder.notes) {
        console.log(`[COMANDERA SIMULADA] Notas: ${savedOrder.notes}`);
      }
      // --- FIN MARCADOR DE COMANDERA ---

      // Recargar la orden con todas las relaciones necesarias para la respuesta
      return orderRepo.findOneOrFail({
          where: { id: savedOrder.id },
          relations: ['items', 'items.product', 'createdBy']
      });
    });
  }

  /**
   * Busca un pedido por su ID, incluyendo sus ítems, productos de los ítems y el usuario creador.
   * @param orderId - El ID del pedido a buscar.
   * @returns La entidad Order si se encuentra, o null si no.
   */
  async findOrderById(orderId: number): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'items',
        'items.product',
        'createdBy'
      ],
    });
  }
  
  /**
   * Busca todos los pedidos, opcionalmente filtrados por estado.
   * @param statuses - Un array opcional de estados por los cuales filtrar los pedidos.
   * @returns Una promesa que resuelve a un array de entidades Order.
   */
  async findAll(statuses?: OrderStatus[]): Promise<Order[]> {
    const findOptions: import('typeorm').FindManyOptions<Order> = {
      relations: ['items', 'items.product', 'createdBy'],
      order: { createdAt: 'DESC' }, // O el orden que prefieras
    };

    if (statuses && statuses.length > 0) {
      // Asegurarse de que los estados son válidos si es necesario
      const validStatuses = statuses.filter(s => Object.values(OrderStatus).includes(s));
      if (validStatuses.length > 0) {
        findOptions.where = validStatuses.map(status => ({ status })); 
        // Esto crea una condición OR para los estados: [{ status: 'pending' }, { status: 'in_progress' }]
      }
    }
    return this.orderRepository.find(findOptions);
  }

  /**
   * Actualiza el estado de un pedido existente.
   * @param orderId - El ID del pedido a actualizar.
   * @param status - El nuevo estado para el pedido.
   * @param manager - Opcional: EntityManager para ejecutar la operación dentro de una transacción existente.
   * @returns La entidad Order actualizada.
   * @throws HttpException si el pedido no se encuentra.
   */
  async updateOrderStatus(orderId: number, status: OrderStatus, manager?: EntityManager): Promise<Order> {
    const orderRepo = manager ? manager.getRepository(Order) : this.orderRepository;
    const order = await orderRepo.findOneBy({ id: orderId });
    if (!order) {
      throw new HttpException(`Pedido con ID ${orderId} no encontrado.`, HttpStatus.NOT_FOUND);
    }
    order.status = status;
    return orderRepo.save(order);
  }

  /**
   * Marca un pedido como completado. Implica cambiar su estado a COMPLETED
   * y deducir el stock de los ingredientes utilizados según las recetas de los productos vendidos.
   * @param orderId - El ID del pedido a completar.
   * @param manager - Opcional: EntityManager para ejecutar la operación dentro de una transacción existente.
   * @returns La entidad Order actualizada y marcada como completada.
   * @throws HttpException si el pedido no se encuentra, ya está cancelado, o si hay errores en la deducción de stock.
   */
  async completeOrder(orderId: number, manager?: EntityManager): Promise<Order> {
    const entityManager = manager || this.orderRepository.manager; // Usar el manager provisto o el del repositorio principal.
    
    // Cargar el pedido con sus ítems y los productos de los ítems para la deducción de stock.
    const order = await entityManager.getRepository(Order).findOne({
        where: { id: orderId },
        relations: ['items', 'items.product'], // items.product es crucial para deductStockForOrder
    });

    if (!order) {
      throw new HttpException(`Pedido con ID ${orderId} no encontrado.`, HttpStatus.NOT_FOUND);
    }

    if (order.status === OrderStatus.COMPLETED) {
      console.warn(`El pedido ${orderId} ya está completado.`);
      return order; // No hacer nada si ya está completado.
    }
    
    if (order.status === OrderStatus.CANCELLED) {
        throw new HttpException(`El pedido ${orderId} está cancelado y no se puede completar.`, HttpStatus.BAD_REQUEST);
    }

    // Deducción de stock. Se pasa el entityManager para que las operaciones de stock sean parte de la misma transacción si manager es provisto.
    await this.deductStockForOrder(order, entityManager);

    order.status = OrderStatus.COMPLETED;
    const updatedOrder = await entityManager.getRepository(Order).save(order);
    
    console.log(`Pedido ${orderId} completado y stock deducido.`);
    // Aquí se podría llamar a la impresión del recibo del cliente
    // await this.printerService.printCustomerReceipt(updatedOrder); // Ejemplo conceptual
    return updatedOrder;
  }

  /**
   * Deduce el stock de los ingredientes para cada producto en un pedido, basado en sus recetas.
   * Este método es privado y se utiliza internamente por `completeOrder`.
   * @param order - La entidad Order (con sus items y productos cargados) para la cual se deducirá el stock.
   * @param manager - El EntityManager para asegurar que las operaciones de base de datos se ejecuten en la misma transacción.
   * @throws HttpException si un ingrediente no tiene suficiente stock o si hay datos corruptos en la receta.
   */
  private async deductStockForOrder(order: Order, manager: EntityManager): Promise<void> {
    if (!order.items || order.items.length === 0) {
      console.log(`El pedido ${order.id} no tiene ítems, no se deduce stock.`);
      return;
    }

    for (const orderItem of order.items) {
      if (!orderItem.product) {
        // Esto no debería pasar si las relaciones se cargaron correctamente en completeOrder.
        console.warn(`OrderItem ${orderItem.id} en el pedido ${order.id} no tiene producto asociado cargado. Omitiendo deducción de stock para este ítem.`);
        continue;
      }
      const product = orderItem.product;
      
      // Buscar la receta del producto usando el RecipeService.
      // Se pasa el EntityManager para que la búsqueda sea parte de la transacción.
      const recipe = await this.recipeService.findOneByProductId(product.id, manager);

      // Si el producto no tiene receta o la receta no tiene ítems, no se puede deducir stock de ingredientes.
      if (!recipe || !recipe.items || recipe.items.length === 0) {
        console.log(`Producto ${product.name} (ID: ${product.id}) en el pedido ${order.id} no tiene receta o la receta no tiene ítems. No se deduce stock de ingredientes para este producto.`);
        continue;
      }
      console.log(`Procesando receta para producto ${product.name} (ID: ${product.id}) en pedido ${order.id}`);

      for (const recipeItem of recipe.items) {
        if (!recipeItem.ingredient) {
            // Esto no debería pasar si la receta y sus ítems se cargan con sus ingredientes.
            console.warn(`RecipeItem (ID: ${recipeItem.id}) para producto ${product.name} no tiene la entidad Ingredient cargada. Omitiendo.`);
            continue;
        }
        const ingredient = recipeItem.ingredient;
        const quantityToDeduct = recipeItem.quantity * orderItem.quantity;

        console.log(`Intentando deducir ${quantityToDeduct} de ${ingredient.unitOfMeasure} del ingrediente ${ingredient.name} (ID: ${ingredient.id}). Stock actual: ${ingredient.stockQuantity}`);
        
        // El IngredientService se encargará de la lógica de actualización de stock y de lanzar error si no hay suficiente.
        // Se pasa el EntityManager para que la actualización de stock sea parte de la transacción.
        await this.ingredientService.adjustStock(ingredient.id, -quantityToDeduct, manager); // Restar del stock
        
        console.log(`Stock del ingrediente ${ingredient.name} (ID: ${ingredient.id}) actualizado después de la deducción.`);
      }
    }
  }
} 