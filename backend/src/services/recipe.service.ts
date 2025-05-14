import { AppDataSource } from '../data-source';
import { Recipe } from '../entities/Recipe';
import { RecipeItem } from '../entities/RecipeItem';
import { Product } from '../entities/Product';
import { Ingredient } from '../entities/Ingredient';
// import { UnitOfMeasure } from '../entities/UnitOfMeasure'; // No se necesita si RecipeItem no la usa directamente
import { CreateRecipeDto, UpdateRecipeDto, RecipeItemDto } from '../dtos/recipe.dto';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { HttpException, HttpStatus } from '../utils/HttpException'; 
import { EntityManager } from 'typeorm';

export class RecipeService {
  private recipeRepository: Repository<Recipe>;
  private productRepository: Repository<Product>;
  private ingredientRepository: Repository<Ingredient>;
  // private unitOfMeasureRepository: Repository<UnitOfMeasure>; // No se necesita
  private recipeItemRepository: Repository<RecipeItem>; 

  constructor() {
    this.recipeRepository = AppDataSource.getRepository(Recipe);
    this.productRepository = AppDataSource.getRepository(Product);
    this.ingredientRepository = AppDataSource.getRepository(Ingredient);
    // this.unitOfMeasureRepository = AppDataSource.getRepository(UnitOfMeasure); // No se necesita
    this.recipeItemRepository = AppDataSource.getRepository(RecipeItem); 
  }

  private async calculateEstimatedCost(items: RecipeItemDto[] | RecipeItem[], manager: EntityManager): Promise<number> {
    let totalCost = 0;
    for (const item of items) {
      let ingredientEntity: Ingredient | null = null;
      let itemQuantity: number = 0;

      if ('ingredientId' in item && typeof item.ingredientId === 'number') { // Es RecipeItemDto
        ingredientEntity = await manager.findOneBy(Ingredient, { id: item.ingredientId });
        itemQuantity = item.quantity;
      } else if ('ingredient' in item && item.ingredient instanceof Ingredient) { // Es RecipeItem con ingrediente cargado
        ingredientEntity = item.ingredient as Ingredient;
        itemQuantity = (item as RecipeItem).quantity;
      } else if ('ingredientId' in item && typeof (item as any).ingredientId === 'number' && 'quantity' in item) { // Caso para RecipeItem de la BD que no tenga `ingredient` precargado.
        ingredientEntity = await manager.findOneBy(Ingredient, { id: (item as any).ingredientId });
        itemQuantity = (item as any).quantity;
      }

      if (!ingredientEntity) {
        throw new HttpException(`Ingredient not found for cost calculation. Item: ${JSON.stringify(item)}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      if (typeof ingredientEntity.costPrice !== 'number') { // Usar costPrice de Ingredient
        throw new HttpException(`Cost not defined for ingredient: ${ingredientEntity.name} (ID: ${ingredientEntity.id}). Cannot calculate recipe cost.`, HttpStatus.BAD_REQUEST);
      }
      // Se asume que itemQuantity está en la unidad base del ingrediente
      totalCost += Number(ingredientEntity.costPrice) * Number(itemQuantity);
    }
    return parseFloat(totalCost.toFixed(2)); // Asegurar 2 decimales para costos
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

    return AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      const recipeItems: RecipeItem[] = [];
      for (const itemDto of createDto.items) {
        const ingredient = await transactionalEntityManager.findOneBy(Ingredient, { id: itemDto.ingredientId });
        if (!ingredient) {
          throw new HttpException(`Ingredient with ID ${itemDto.ingredientId} not found in recipe item.`, HttpStatus.NOT_FOUND);
        }
        // Ya no se valida ni asigna unitOfMeasure aquí, se asume que itemDto.quantity está en la unidad base del ingrediente

        const recipeItem = transactionalEntityManager.create(RecipeItem, {
          ingredient: ingredient,
          ingredientId: ingredient.id,
          quantity: itemDto.quantity,
          notes: itemDto.notes,
          // recipe: se asignará cuando se guarde la receta padre con cascade
        });
        recipeItems.push(recipeItem);
      }

      const estimatedCost = await this.calculateEstimatedCost(createDto.items, transactionalEntityManager);

      const recipe = transactionalEntityManager.create(Recipe, {
        product: product,
        productId: product.id,
        name: createDto.name || `Receta para ${product.name}`,
        description: createDto.description,
        notes: createDto.notes,
        items: recipeItems, // TypeORM manejará el guardado de estos items anidados
        estimatedCost: estimatedCost,
      });
      
      return transactionalEntityManager.save(Recipe, recipe);
    });
  }

  async findAll(options?: FindManyOptions<Recipe>): Promise<Recipe[]> {
    return this.recipeRepository.find({
      relations: ['product', 'items', 'items.ingredient'], // Simplificado: no necesitamos 'items.unitOfMeasure' ni 'items.ingredient.unitOfMeasure'
      ...options,
    });
  }

  async findOne(id: number, options?: FindOneOptions<Recipe>): Promise<Recipe | null> {
    return this.recipeRepository.findOne({
      where: { id },
      relations: ['product', 'items', 'items.ingredient'], // Simplificado
      ...options,
    });
  }

  async findOneByProductId(productId: number, manager?: EntityManager): Promise<Recipe | null> {
    const repository = manager ? manager.getRepository(Recipe) : this.recipeRepository;
    return repository.findOne({
      where: { productId },
      relations: ['product', 'items', 'items.ingredient'], // Simplificado
    });
  }

  async update(id: number, updateDto: UpdateRecipeDto): Promise<Recipe | null> {
    return AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      const recipe = await transactionalEntityManager.findOne(Recipe, {
        where: { id },
        relations: ['items', 'product', 'items.ingredient'], // Cargar items e ingredientes para el cálculo de costo
      });
      
      if (!recipe) {
        return null; 
      }

      if (updateDto.name !== undefined) recipe.name = updateDto.name;
      if (updateDto.description !== undefined) recipe.description = updateDto.description;
      if (updateDto.notes !== undefined) recipe.notes = updateDto.notes;

      let itemsForCostCalculation: RecipeItemDto[] | RecipeItem[] = recipe.items;

      if (updateDto.items) {
        if (recipe.items && recipe.items.length > 0) {
          await transactionalEntityManager.remove(RecipeItem, recipe.items); // Eliminar items antiguos
        }

        const newRecipeItems: RecipeItem[] = [];
        for (const itemDto of updateDto.items) {
          const ingredient = await transactionalEntityManager.findOneBy(Ingredient, { id: itemDto.ingredientId });
          if (!ingredient) throw new HttpException(`Ingredient with ID ${itemDto.ingredientId} not found.`, HttpStatus.NOT_FOUND);
          
          // Ya no se valida ni asigna unitOfMeasure
          const newItem = transactionalEntityManager.create(RecipeItem, {
            // recipe: recipe, // Se vincula automáticamente al guardar la receta con cascade
            ingredient: ingredient,
            ingredientId: ingredient.id,
            quantity: itemDto.quantity,
            notes: itemDto.notes,
          });
          newRecipeItems.push(newItem);
        }
        recipe.items = newRecipeItems;
        itemsForCostCalculation = newRecipeItems; // Usar los nuevos items (con `ingredient` cargado) para el cálculo
      }
      
      // Recalcular costo estimado. Para que funcione, los items en itemsForCostCalculation deben tener `ingredient.costPrice`.
      // Si `itemsForCostCalculation` son los `newRecipeItems`, ya tienen `ingredient` cargado.
      // Si son `recipe.items` (porque no se actualizaron los items), también tienen `ingredient` cargado por la relación.
      const estimatedCost = await this.calculateEstimatedCost(itemsForCostCalculation, transactionalEntityManager);
      recipe.estimatedCost = estimatedCost;

      return transactionalEntityManager.save(Recipe, recipe);
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.recipeRepository.delete(id);
    if (result.affected === 0) {
      throw new HttpException(`Recipe with ID ${id} not found`, HttpStatus.NOT_FOUND);
    }
  }
}

export const recipeService = new RecipeService(); 