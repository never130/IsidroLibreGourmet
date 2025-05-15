import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

/**
 * Entidad que representa un ítem individual dentro de un pedido (Order).
 * Cada ítem de pedido está asociado a un producto específico y una cantidad.
 */
@Entity('order_items') // Especifica el nombre de la tabla en la base de datos.
export class OrderItem {
  /**
   * Identificador único del ítem de pedido, generado automáticamente.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Pedido (Order) al que pertenece este ítem.
   * Relación Many-to-One con la entidad Order.
   */
  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' }) // onDelete: 'CASCADE' asegura que si se borra un pedido, sus ítems también.
  @JoinColumn({ name: 'orderId' }) // Define la columna de clave foránea `orderId`.
  order: Order;

  // No es necesario un @Column() para orderId si ya se define con @JoinColumn en la relación.
  // TypeORM maneja la columna FK a través de la relación.
  // Si necesitaras acceder a orderId directamente sin cargar el objeto order, podrías añadir:
  // @Column({ nullable: false })
  // orderId: number;

  /**
   * Producto asociado a este ítem de pedido.
   * Relación Many-to-One con la entidad Product.
   */
  @ManyToOne(() => Product, { eager: false, onDelete: 'RESTRICT' }) // eager: false para no cargar siempre, onDelete: 'RESTRICT' para prevenir borrar productos si están en pedidos.
  @JoinColumn({ name: 'productId' }) // Define la columna de clave foránea `productId`.
  product: Product;

  /**
   * ID del producto asociado. Esta es la columna de clave foránea real en la tabla 'order_items'.
   */
  @Column()
  productId: number;

  /**
   * Cantidad del producto solicitada en este ítem de pedido.
   */
  @Column()
  quantity: number;

  /**
   * Precio unitario del producto al momento en que se realizó el pedido.
   * Se almacena aquí para mantener un registro histórico del precio, incluso si el precio del producto cambia después.
   */
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;
} 