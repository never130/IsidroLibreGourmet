import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './OrderItem';
import { User } from './User';

/**
 * Representa los posibles estados de un pedido en el sistema.
 */
export enum OrderStatus {
  PENDING = 'pending',          // El pedido ha sido creado pero aún no se ha procesado.
  IN_PROGRESS = 'in_progress',  // El pedido está siendo preparado o atendido.
  COMPLETED = 'completed',      // El pedido ha sido finalizado y entregado/pagado.
  CANCELLED = 'cancelled',      // El pedido ha sido cancelado.
}

/**
 * Representa los tipos de pedido que se pueden realizar.
 */
export enum OrderType {
  DINE_IN = 'dine_in',      // Pedido para consumir en el local.
  TAKEAWAY = 'takeaway',    // Pedido para llevar.
  DELIVERY = 'delivery',    // Pedido para entrega a domicilio.
}

/**
 * Representa los métodos de pago aceptados.
 */
export enum PaymentMethod {
  CASH = 'cash',                        // Pago en efectivo.
  CREDIT_CARD = 'credit_card',          // Pago con tarjeta de crédito.
  DEBIT_CARD = 'debit_card',            // Pago con tarjeta de débito.
  TRANSFER = 'transfer',                // Pago por transferencia bancaria.
  OTHER = 'other',                      // Otro método de pago.
}

/**
 * Entidad que representa un pedido (orden) en el sistema.
 */
@Entity('orders') // Especifica el nombre de la tabla en la base de datos.
export class Order {
  /**
   * Identificador único del pedido, generado automáticamente.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Tipo de pedido (ej. para comer en local, para llevar).
   */
  @Column({
    type: 'enum',
    enum: OrderType,
    default: OrderType.DINE_IN,
  })
  type: OrderType;

  /**
   * Nombre del cliente que realiza el pedido.
   * Requerido para todos los tipos de pedido.
   */
  @Column()
  customerName: string;

  /**
   * Número de teléfono del cliente (opcional).
   * Útil para pedidos de delivery o para contactar al cliente.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  customerPhone: string | null;

  /**
   * Dirección de entrega para pedidos de tipo DELIVERY (opcional para otros tipos).
   */
  @Column({ type: 'text', nullable: true })
  address: string | null;

  /**
   * Notas o instrucciones adicionales para el pedido (opcional).
   */
  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  /**
   * Estado actual del pedido (ej. pendiente, en progreso, completado).
   */
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  /**
   * Método de pago utilizado para el pedido.
   */
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  /**
   * Monto total del pedido, calculado a partir de sus ítems.
   */
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  /**
   * Lista de ítems (productos y cantidades) que componen el pedido.
   * La relación se configura para que al guardar/actualizar un pedido, sus ítems también se guarden/actualicen (cascada).
   */
  @OneToMany(() => OrderItem, item => item.order, { cascade: ['insert', 'update'], eager: false })
  items: OrderItem[];

  /**
   * Usuario del sistema (empleado) que creó el pedido.
   * Relación Many-to-One con la entidad User.
   */
  @ManyToOne(() => User, user => user.orders, { nullable: false, eager: false })
  @JoinColumn({ name: 'createdById' }) // Define la columna de clave foránea.
  createdBy: User;

  /**
   * ID del usuario que creó el pedido. Esta es la columna de clave foránea real en la tabla 'orders'.
   */
  @Column()
  createdById: number;

  /**
   * Fecha y hora en que se creó el pedido, gestionada automáticamente por TypeORM.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Fecha y hora de la última actualización del pedido, gestionada automáticamente por TypeORM.
   */
  @UpdateDateColumn()
  updatedAt: Date;
} 