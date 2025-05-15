import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './OrderItem';
import { Recipe } from './Recipe';

/**
 * Categorías predefinidas para los productos.
 */
export enum ProductCategory {
  BEBIDAS = 'Bebidas',
  PLATOS_FUERTES = 'Platos Fuertes',
  ENTRADAS = 'Entradas',
  POSTRES = 'Postres',
  SNACKS = 'Snacks',
  OTROS = 'Otros',
}

/**
 * Entidad que representa un producto ofrecido por el negocio.
 * Puede ser un producto comprado y revendido, o un producto elaborado a partir de una receta.
 */
@Entity('products')
export class Product {
  /**
   * Identificador único del producto, generado automáticamente.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Nombre del producto.
   */
  @Column({ unique: true })
  name: string;

  /**
   * Descripción detallada del producto (opcional).
   */
  @Column('text', { nullable: true })
  description: string | null;

  /**
   * Precio de venta del producto.
   */
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  /**
   * Cantidad de stock disponible para este producto.
   * Aplicable si `manageStock` es true y el producto no se gestiona por receta.
   * Si se gestiona por receta, el stock se infiere de los ingredientes.
   */
  @Column({ type: 'integer', default: 0 })
  stock: number;

  /**
   * Indica si el producto está actualmente activo y disponible para la venta/uso.
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Indica si el stock de este producto se gestiona directamente (true)
   * o si se deriva del stock de ingredientes a través de una receta (false).
   */
  @Column({ default: true })
  manageStock: boolean;

  /**
   * Categoría a la que pertenece el producto.
   */
  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.OTROS,
  })
  category: ProductCategory;

  /**
   * Costo de adquisición o producción del producto (opcional).
   * Útil para calcular márgenes de ganancia.
   */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  cost: number | null;

  /**
   * URL de una imagen representativa del producto (opcional).
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;
  
  /**
   * Relación uno a uno con la receta asociada a este producto (si es un producto elaborado).
   * Un producto puede tener una receta, y una receta pertenece a un solo producto.
   * `cascade: true` para que las operaciones en Product (ej. save) se propaguen a Recipe.
   * `nullable: true` porque no todos los productos tienen una receta (ej. bebidas embotelladas).
   */
  @OneToOne(() => Recipe, recipe => recipe.product, { cascade: true, nullable: true, eager: false })
  recipe: Recipe | null; 

  // Relación con OrderItem (un producto puede estar en muchos ítems de pedido)
  // No se añade aquí explícitamente si no se necesita navegar de Product a OrderItems directamente muy a menudo.
  // La relación principal está en OrderItem.product.
  // @OneToMany(() => OrderItem, orderItem => orderItem.product)
  // orderItems: OrderItem[];

  /**
   * Fecha y hora en que se creó el registro del producto.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Fecha y hora de la última actualización del registro del producto.
   */
  @UpdateDateColumn()
  updatedAt: Date;
} 