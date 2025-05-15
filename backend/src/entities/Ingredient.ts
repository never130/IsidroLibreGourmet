import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  Unique,
} from 'typeorm';
import { RecipeItem } from './RecipeItem';

/**
 * Define las unidades de medida estándar para los ingredientes.
 * Estos son ejemplos, pueden expandirse según las necesidades del negocio.
 */
export enum UnitOfMeasure {
  GRAM = 'Gramos (gr)',
  KILOGRAM = 'Kilogramos (kg)',
  MILLILITER = 'Mililitros (ml)',
  LITER = 'Litros (L)',
  UNIT = 'Unidad(es)',
  TEASPOON = 'Cucharadita(s)',
  TABLESPOON = 'Cucharada(s)',
  CUP = 'Taza(s)',
  PINCH = 'Pizca(s)',
  OTHER = 'Otro', // Para unidades no estándar
}

/**
 * Entidad que representa un ingrediente o materia prima utilizada en las recetas.
 */
@Entity('ingredients')
@Unique(['name', 'unitOfMeasure']) // Un ingrediente es único por su nombre y unidad de medida. Ej: "Harina (Gramos)" vs "Harina (Kilogramos)"
export class Ingredient {
  /**
   * Identificador único del ingrediente, generado automáticamente.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Nombre del ingrediente (ej. "Harina de Trigo", "Tomate Fresco").
   */
  @Index({ unique: true }) // Para asegurar que el nombre del ingrediente sea único
  @Column({ type: 'varchar', length: 255 })
  name: string; // Ej: "Harina de Trigo", "Tomate Entero", "Queso Mozzarella"

  /**
   * Descripción adicional del ingrediente (opcional).
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Unidad de medida en la que se gestiona el stock de este ingrediente.
   */
  @Column({
    type: 'enum',
    enum: UnitOfMeasure,
    default: UnitOfMeasure.UNIT,
  })
  unitOfMeasure: UnitOfMeasure;

  /**
   * Cantidad actual de stock del ingrediente, en la `unitOfMeasure` especificada.
   */
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 }) // Permite decimales para stock, ej. 0.5g
  stockQuantity: number;

  /**
   * Umbral mínimo de stock. Si el `stockQuantity` cae por debajo de este valor,
   * se podría generar una alerta o indicación de necesidad de reposición (opcional).
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number | null;

  /**
   * Costo promedio o último costo de compra del ingrediente por `unitOfMeasure` (opcional).
   * Útil para calcular el costo de las recetas.
   */
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  lowStockThreshold: number | null;

  /**
   * Proveedor preferido o último proveedor del ingrediente (opcional).
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier: string | null;

  /**
   * Fecha y hora en que se creó el registro del ingrediente.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Fecha y hora de la última actualización del registro del ingrediente.
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Relación uno a muchos con RecipeItem.
   * Un ingrediente puede estar en muchos ítems de receta.
   * No se suele navegar desde Ingrediente a Recetas directamente, así que puede ser no `eager`.
   */
  @OneToMany(() => RecipeItem, (recipeItem) => recipeItem.ingredient)
  recipeItems: RecipeItem[];

  // Campo calculado para saber si el stock está bajo (opcional, podría calcularse en el servicio)
  isLowStock?: boolean;

  // Podríamos añadir más campos después, como:
  // lastPurchaseDate?: Date;
  // lastPurchasePrice?: number;
  // sku?: string;
} 