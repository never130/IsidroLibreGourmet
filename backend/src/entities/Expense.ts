import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

/**
 * Define las categorías de gastos para clasificar los egresos del negocio.
 */
export enum ExpenseCategory {
  RENT = 'Alquiler',
  UTILITIES = 'Servicios Públicos', // Luz, agua, gas, internet
  SUPPLIES = 'Insumos y Proveedores',  // Materia prima, productos de limpieza, etc.
  SALARY = 'Salarios y Personal',
  MAINTENANCE = 'Mantenimiento y Reparaciones',
  MARKETING = 'Marketing y Publicidad',
  ADMINISTRATIVE = 'Gastos Administrativos', // Papelería, contaduría, etc.
  TAXES = 'Impuestos y Licencias',
  FINANCIAL = 'Gastos Financieros', // Comisiones bancarias, intereses
  TRANSPORT = 'Transporte y Delivery', // Gastos de envío propios, combustible
  OTHER = 'Otros Gastos',
}

/**
 * Define los métodos de pago utilizados para los gastos.
 */
export enum PaymentMethodExpense {
  CASH = 'Efectivo',
  CARD = 'Tarjeta (Débito/Crédito)',
  TRANSFER = 'Transferencia Bancaria',
  CHEQUE = 'Cheque',
  OTHER = 'Otro',
}

/**
 * Entidad que representa un gasto o egreso del negocio.
 */
@Entity('expenses')
export class Expense {
  /**
   * Identificador único del gasto, generado automáticamente.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Descripción breve y clara del gasto.
   */
  @Column()
  description!: string;

  /**
   * Monto del gasto.
   */
  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  /**
   * Categoría a la que pertenece el gasto.
   */
  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.OTHER,
  })
  category!: ExpenseCategory;

  /**
   * Método de pago utilizado para el gasto.
   */
  @Column({
    type: 'enum',
    enum: PaymentMethodExpense, // Usar el enum específico para gastos
    default: PaymentMethodExpense.CASH,
  })
  paymentMethod!: PaymentMethodExpense;

  /**
   * Fecha en que se realizó o se registró el gasto.
   * Se almacena solo la fecha, sin la hora.
   */
  @Column('date') // Almacena solo la fecha (YYYY-MM-DD)
  date!: Date;

  /**
   * Número de recibo, factura o comprobante asociado al gasto (opcional).
   */
  @Column({ nullable: true })
  receiptNumber?: string;

  /**
   * Notas adicionales o detalles sobre el gasto (opcional).
   */
  @Column('text', { nullable: true })
  notes?: string;

  /**
   * Usuario que registró el gasto en el sistema.
   * Relación Many-to-One con la entidad User.
   */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) // Si el usuario se borra, el gasto permanece pero createdBy queda nulo.
  @JoinColumn({ name: 'createdById' })
  createdBy?: User | null; // Puede ser opcional si no siempre se registra quién lo creó o si el usuario puede ser eliminado.

  /**
   * ID del usuario que registró el gasto. Puede ser nulo.
   */
  @Column({ nullable: true })
  createdById?: number | null;

  /**
   * Fecha y hora en que se creó el registro del gasto en el sistema.
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización del registro del gasto.
   */
  @UpdateDateColumn()
  updatedAt!: Date;
} 