import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { UnitOfMeasure } from './UnitOfMeasure';
import { RecipeItem } from './RecipeItem';

@Entity('ingredients') // Nombre de la tabla
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true }) // Para asegurar que el nombre del ingrediente sea único
  @Column({ type: 'varchar', length: 255 })
  name: string; // Ej: "Harina de Trigo", "Tomate Entero", "Queso Mozzarella"

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 }) // Permite decimales para stock (ej. 0.5 kg)
  stock: number; // Cantidad actual en inventario, ej: 5000 para 5000 gramos

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice?: number | null; // NUEVA PROPIEDAD

  // Relación con UnitOfMeasure
  @ManyToOne(() => UnitOfMeasure, { eager: true, nullable: false }) // eager: true para cargar siempre la unidad, nullable: false para que sea obligatoria
  @JoinColumn({ name: 'unitOfMeasureId' })
  unitOfMeasure: UnitOfMeasure;

  @Column()
  unitOfMeasureId: number; // Foreign key

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  lowStockThreshold?: number; // Opcional, umbral para alertas de stock bajo

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true }) // Mayor precisión para costo unitario
  cost?: number; // Opcional, costo promedio por unidad de medida base (la definida en unitOfMeasure)

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier?: string; // Opcional, información del proveedor

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