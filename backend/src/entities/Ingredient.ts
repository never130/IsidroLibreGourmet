import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RecipeItem } from './RecipeItem';
import { IngredientUnit } from '../enums/ingredient-unit.enum';

@Entity('ingredients') // Nombre de la tabla
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true }) // Para asegurar que el nombre del ingrediente sea único
  @Column({ type: 'varchar', length: 255 })
  name: string; // Ej: "Harina de Trigo", "Tomate Entero", "Queso Mozzarella"

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: IngredientUnit,
    default: IngredientUnit.GRAMS,
  })
  unitOfMeasure: IngredientUnit;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 }) // Permite decimales para stock, ej. 0.5g
  stockQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  lowStockThreshold: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RecipeItem, (recipeItem) => recipeItem.ingredient)
  recipeItems: RecipeItem[];

  // Campo calculado para saber si el stock está bajo (opcional, podría calcularse en el servicio)
  isLowStock?: boolean;

  // Podríamos añadir más campos después, como:
  // lastPurchaseDate?: Date;
  // lastPurchasePrice?: number;
  // sku?: string;
} 