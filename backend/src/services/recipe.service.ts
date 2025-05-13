import { AppDataSource } from '../data-source';
import { Recipe } from '../entities/Recipe';
import { RecipeItem } from '../entities/RecipeItem';
import { Product } from '../entities/Product';
import { Ingredient } from '../entities/Ingredient';
import { UnitOfMeasure } from '../entities/UnitOfMeasure';
import { CreateRecipeDto, UpdateRecipeDto, RecipeItemDto } from '../dtos/recipe.dto';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { HttpException, HttpStatus } from '../utils/HttpException'; 
import { EntityManager } from 'typeorm';

export class RecipeService {
  private recipeRepository: Repository<Recipe>;
  private productRepository: Repository<Product>;
  private ingredientRepository: Repository<Ingredient>;
  private unitOfMeasureRepository: Repository<UnitOfMeasure>;
  private recipeItemRepository: Repository<RecipeItem>; // Para la actualización de items

  constructor() {
    this.recipeRepository = AppDataSource.getRepository(Recipe);
    this.productRepository = AppDataSource.getRepository(Product);
    this.ingredientRepository = AppDataSource.getRepository(Ingredient);
    this.unitOfMeasureRepository = AppDataSource.getRepository(UnitOfMeasure);
    this.recipeItemRepository = AppDataSource.getRepository(RecipeItem); 
  }

  private async calculateEstimatedCost(items: RecipeItemDto[] | RecipeItem[], manager: EntityManager): Promise<number> {
    let totalCost = 0;
    for (const item of items) {
      // Necesitamos el ingrediente completo para obtener su costo y su unitOfMeasure base
      // Si `item` es RecipeItemDto, ingredientId está directamente.
      // Si `item` es RecipeItem (entidad), item.ingredient ya debería estar cargado o necesitamos cargarlo.
      let ingredient: Ingredient | null = null;
      let itemQuantity: number = 0;

      if ('ingredientId' in item && typeof item.ingredientId === 'number') { // Es RecipeItemDto
        ingredient = await manager.findOne(Ingredient, { 
          where: { id: item.ingredientId }, 
          // relations: ['unitOfMeasure'] // No es estrictamente necesario para el costo si la validación de UoM ya se hizo
        });
        itemQuantity = item.quantity;
      } else if ('ingredient' in item && item.ingredient instanceof Ingredient) { // Es RecipeItem con ingrediente cargado
        ingredient = item.ingredient as Ingredient;
        itemQuantity = (item as RecipeItem).quantity;
      }

      if (!ingredient) {
        // Esto no debería ocurrir si la validación de existencia del ingrediente ya se hizo.
        throw new HttpException(`Ingredient not found for cost calculation for item: ${JSON.stringify(item)}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      if (typeof ingredient.cost !== 'number') {
        // Si el costo del ingrediente no está definido, no podemos calcular el costo de la receta.
        // Podríamos lanzar error o asumir costo 0 y loguear una advertencia.
        // Por ahora, lanzamos error para forzar que los costos de ingredientes estén definidos.
        throw new HttpException(`Cost not defined for ingredient: ${ingredient.name} (ID: ${ingredient.id}). Cannot calculate recipe cost.`, HttpStatus.BAD_REQUEST);
      }
      // Asumimos que item.quantity está en la unitOfMeasure base del ingrediente (validado previamente)
      totalCost += Number(ingredient.cost) * Number(itemQuantity);
    }
    return totalCost;
  }

  async create(createDto: CreateRecipeDto): Promise<Recipe> {
    const product = await this.productRepository.findOneBy({ id: createDto.productId });
    if (!product) {
      throw new HttpException(`Product with ID ${createDto.productId} not found`, HttpStatus.NOT_FOUND);
    }

    const existingRecipe = await this.recipeRepository.findOneBy({ productId: createDto.productId });
    if (existingRecipe) {
      throw new HttpException(`Product with ID ${createDto.productId} already has a recipe.`, HttpStatus.CONFLICT);
    }

    // Iniciar una transacción para asegurar la atomicidad
    return AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      const recipeItems: RecipeItem[] = [];
      for (const itemDto of createDto.items) {
        const ingredient = await transactionalEntityManager.findOne(Ingredient, { 
          where: { id: itemDto.ingredientId }, 
          relations: ['unitOfMeasure'] // Asegurar que se carga la unidad del ingrediente
        });
        if (!ingredient) {
          throw new HttpException(`Ingredient with ID ${itemDto.ingredientId} not found in recipe item.`, HttpStatus.NOT_FOUND);
        }
        // Validar que la unitOfMeasureId del DTO es la misma que la unitOfMeasureId base del ingrediente
        if (ingredient.unitOfMeasureId !== itemDto.unitOfMeasureId) {
          throw new HttpException(
            `Unit of measure mismatch for ingredient '${ingredient.name}'. Expected UoM ID ${ingredient.unitOfMeasureId} ( ${ingredient.unitOfMeasure.name} ) but got ${itemDto.unitOfMeasureId}.`,
            HttpStatus.BAD_REQUEST
          );
        }
        // No es necesario buscar unitOfMeasure por separado si ya validamos contra la del ingrediente
        // y la unidad del ingrediente ya está cargada.

        const recipeItem = transactionalEntityManager.create(RecipeItem, {
          ingredient: ingredient, // Ya tiene unitOfMeasure cargada
          ingredientId: ingredient.id,
          quantity: itemDto.quantity,
          unitOfMeasure: ingredient.unitOfMeasure, // Usar la UoM del ingrediente
          unitOfMeasureId: ingredient.unitOfMeasureId, // Usar el ID de la UoM del ingrediente
          notes: itemDto.notes,
        });
        recipeItems.push(recipeItem);
      }

      // Calcular costo estimado
      const estimatedCost = await this.calculateEstimatedCost(createDto.items, transactionalEntityManager);

      const recipe = transactionalEntityManager.create(Recipe, {
        product: product,
        productId: product.id,
        name: createDto.name || `Receta para ${product.name}`,
        description: createDto.description,
        notes: createDto.notes,
        items: recipeItems,
        estimatedCost: estimatedCost, // Añadir costo calculado
      });
      
      // Guardar la receta (y sus items anidados gracias a cascade:true)
      const savedRecipe = await transactionalEntityManager.save(Recipe, recipe);
      // No es necesario guardar recipeItems por separado si cascade es true en la relación Recipe -> RecipeItem
      return savedRecipe;
    });
  }

  async findAll(options?: FindManyOptions<Recipe>): Promise<Recipe[]> {
    return this.recipeRepository.find({
      relations: ['product', 'items', 'items.ingredient', 'items.unitOfMeasure', 'items.ingredient.unitOfMeasure'], // Cargar relaciones completas
      ...options,
    });
  }

  async findOne(id: number, options?: FindOneOptions<Recipe>): Promise<Recipe | null> {
    return this.recipeRepository.findOne({
      where: { id },
      relations: ['product', 'items', 'items.ingredient', 'items.unitOfMeasure', 'items.ingredient.unitOfMeasure'],
      ...options,
    });
  }

  async findOneByProductId(productId: number): Promise<Recipe | null> {
    return this.recipeRepository.findOne({
      where: { productId },
      relations: ['product', 'items', 'items.ingredient', 'items.unitOfMeasure', 'items.ingredient.unitOfMeasure'],
    });
  }

  async update(id: number, updateDto: UpdateRecipeDto): Promise<Recipe | null> {
    // Iniciar una transacción para asegurar la atomicidad
    return AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      const recipe = await transactionalEntityManager.findOne(Recipe, {
        where: { id },
        relations: ['items', 'product'], // Cargar items para posible reemplazo
      });
      
      if (!recipe) {
        // Devuelve null para que el controlador maneje el 404
        return null; 
      }

      // Actualizar campos simples de la receta
      if (updateDto.name !== undefined) recipe.name = updateDto.name;
      if (updateDto.description !== undefined) recipe.description = updateDto.description;
      if (updateDto.notes !== undefined) recipe.notes = updateDto.notes;

      let itemsForCostCalculation: RecipeItemDto[] | RecipeItem[] = recipe.items; // Por defecto, usa los items existentes

      // Si se proveen items, reemplazar los existentes
      if (updateDto.items) {
        // 1. Eliminar items antiguos de la receta
        if (recipe.items && recipe.items.length > 0) {
          await transactionalEntityManager.remove(RecipeItem, recipe.items);
        }

        // 2. Crear y añadir nuevos items
        const newRecipeItems: RecipeItem[] = [];
        for (const itemDto of updateDto.items) {
          const ingredient = await transactionalEntityManager.findOne(Ingredient, { 
            where: { id: itemDto.ingredientId },
            relations: ['unitOfMeasure']
          });
          if (!ingredient) throw new HttpException(`Ingredient with ID ${itemDto.ingredientId} not found.`, HttpStatus.NOT_FOUND);
          
          if (ingredient.unitOfMeasureId !== itemDto.unitOfMeasureId) {
            throw new HttpException(
              `Unit of measure mismatch for ingredient '${ingredient.name}'. Expected UoM ID ${ingredient.unitOfMeasureId} ( ${ingredient.unitOfMeasure.name} ) but got ${itemDto.unitOfMeasureId}.`,
              HttpStatus.BAD_REQUEST
            );
          }

          const newItem = transactionalEntityManager.create(RecipeItem, {
            recipe: recipe,
            ingredient: ingredient,
            ingredientId: ingredient.id,
            quantity: itemDto.quantity,
            unitOfMeasure: ingredient.unitOfMeasure,
            unitOfMeasureId: ingredient.unitOfMeasureId,
            notes: itemDto.notes,
          });
          newRecipeItems.push(newItem);
        }
        recipe.items = newRecipeItems; // Asignar los nuevos items a la receta
        itemsForCostCalculation = updateDto.items; // Usar los nuevos items para el cálculo
      }

      // Recalcular costo estimado
      // Asegurarse que itemsForCostCalculation tiene los datos necesarios (ingredient.cost)
      // Si se usaron los items existentes (recipe.items), sus ingredientes deben tener el costo.
      // Si se usaron updateDto.items, calculateEstimatedCost los cargará.
      const estimatedCost = await this.calculateEstimatedCost(itemsForCostCalculation, transactionalEntityManager);
      recipe.estimatedCost = estimatedCost;

      return transactionalEntityManager.save(Recipe, recipe);
    });
  }

  async remove(id: number): Promise<void> {
    // La eliminación de RecipeItems se maneja por cascade en la entidad Recipe
    // y por onDelete: 'CASCADE' en la entidad RecipeItem.
    const result = await this.recipeRepository.delete(id);
    if (result.affected === 0) {
      throw new HttpException(`Recipe with ID ${id} not found`, HttpStatus.NOT_FOUND);
    }
  }
  
  // TODO: Método para calcular estimatedCost si se desea.
}

export const recipeService = new RecipeService(); 