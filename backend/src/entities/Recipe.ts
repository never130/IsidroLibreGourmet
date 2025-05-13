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

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Product, (product) => product.recipe, { nullable: false })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Index({ unique: true })
  @Column()
  productId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'Receta Estándar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => RecipeItem, (item) => item.recipe, { cascade: true, eager: true })
  items: RecipeItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 