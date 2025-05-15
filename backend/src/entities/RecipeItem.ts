import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Recipe } from './Recipe';
import { Ingredient } from './Ingredient';
import { UnitOfMeasure } from './Ingredient';

/**
 * Entidad que representa un ítem individual dentro de una receta (Recipe).
 * Cada ítem de receta especifica un ingrediente, la cantidad necesaria y su unidad de medida.
 */
@Entity('recipe_items')
export class RecipeItem {
  /**
   * Identificador único del ítem de receta, generado automáticamente.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Receta a la que pertenece este ítem.
   * Relación Many-to-One con la entidad Recipe.
   * `onDelete: 'CASCADE'` para que si se borra la receta, sus ítems también se eliminen.
   */
  @ManyToOne(() => Recipe, recipe => recipe.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  /**
   * ID de la receta a la que pertenece este ítem.
   */
  @Column()
  recipeId: number;

  /**
   * Ingrediente utilizado en este ítem de la receta.
   * Relación Many-to-One con la entidad Ingredient.
   * `onDelete: 'RESTRICT'` para prevenir la eliminación de un ingrediente si está siendo usado en alguna receta.
   */
  @ManyToOne(() => Ingredient, ingredient => ingredient.recipeItems, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient;

  /**
   * ID del ingrediente utilizado.
   */
  @Column()
  ingredientId: number;

  /**
   * Cantidad del ingrediente requerida para la receta.
   * La unidad de esta cantidad corresponde a la `unitOfMeasure` definida en la entidad `Ingredient` asociada.
   */
  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 