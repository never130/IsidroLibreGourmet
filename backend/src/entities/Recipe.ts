import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Product } from './Product';
import { RecipeItem } from './RecipeItem';

/**
 * Entidad que representa una receta para elaborar un producto.
 * Una receta define los ingredientes y cantidades necesarias para un producto específico.
 */
@Entity('recipes')
export class Recipe {
  /**
   * Identificador único de la receta, generado automáticamente.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Producto al cual pertenece esta receta.
   * Relación uno a uno con la entidad Product. Cada receta está asociada a un único producto.
   * `onDelete: 'CASCADE'` significa que si el Producto asociado se elimina, esta Receta también se eliminará.
   */
  @OneToOne(() => Product, product => product.recipe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  /**
   * ID del producto asociado. Esta es la columna de clave foránea real.
   * Se recomienda que sea única para asegurar que un producto no tenga múltiples recetas directamente (a menos que el modelo lo permita).
   */
  @Index({ unique: true })
  @Column({ unique: true })
  productId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'Receta Estándar' })
  name: string;

  /**
   * Descripción o notas adicionales sobre la receta o su preparación (opcional).
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  /**
   * Lista de ítems (ingredientes y cantidades) que componen esta receta.
   * La relación se configura para que al guardar/actualizar una receta, sus ítems también se guarden/actualicen (cascada).
   */
  @OneToMany(() => RecipeItem, item => item.recipe, { cascade: true, eager: true })
  items: RecipeItem[];

  /**
   * Fecha y hora en que se creó la receta.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Fecha y hora de la última actualización de la receta.
   */
  @UpdateDateColumn()
  updatedAt: Date;
} 