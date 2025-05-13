import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Recipe } from './Recipe';

export enum ProductCategory {
  FOOD = 'FOOD',
  DRINK = 'DRINK',
  SNACK = 'SNACK',
  OTHER = 'OTHER'
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  manageStock: boolean;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.FOOD
  })
  category: ProductCategory;

  @Column('decimal', { precision: 10, scale: 2 })
  cost!: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Recipe, (recipe) => recipe.product, { nullable: true, cascade: true, eager: false })
  recipe?: Recipe;
} 