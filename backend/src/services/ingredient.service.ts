import { AppDataSource } from '../data-source';
import { Ingredient } from '../entities/Ingredient';
// import { UnitOfMeasure } from '../entities/UnitOfMeasure'; // Ya no es necesario
import { CreateIngredientDto, UpdateIngredientDto } from '../dtos/ingredient.dto';
import { FindManyOptions, FindOneOptions, LessThanOrEqual, Repository, EntityManager } from 'typeorm';
import { HttpException, HttpStatus } from '../utils/HttpException';
import { IngredientUnit } from '../enums/ingredient-unit.enum'; // Asegurarse que está importado

// Necesitaremos una clase HttpException. Si no la tienes, deberás crearla.
// Ejemplo básico:
// src/utils/HttpException.ts
// export class HttpException extends Error {
//   public status: number;
//   public message: string;
//   constructor(message: string, status: number) {
//     super(message);
//     this.message = message;
//     this.status = status;
//   }
// }
// Deberás importarla: import { HttpException } from '../utils/HttpException'; HttpStatus podría ser un enum.
// Por ahora, usaré errores genéricos o necesitarás implementar HttpException.

export class IngredientService {
  private ingredientRepository: Repository<Ingredient>;
  // private unitOfMeasureRepository: Repository<UnitOfMeasure>; // Ya no es necesario

  constructor() {
    this.ingredientRepository = AppDataSource.getRepository(Ingredient);
    // this.unitOfMeasureRepository = AppDataSource.getRepository(UnitOfMeasure); // Ya no es necesario
  }

  async create(createDto: CreateIngredientDto): Promise<Ingredient> {
    if (!Object.values(IngredientUnit).includes(createDto.unitOfMeasure)) {
      throw new HttpException(`Invalid unitOfMeasure: ${createDto.unitOfMeasure}`, HttpStatus.BAD_REQUEST);
    }

    const existingIngredient = await this.ingredientRepository.findOneBy({ name: createDto.name });
    if (existingIngredient) {
      throw new HttpException(`Ingredient with name "${createDto.name}" already exists`, HttpStatus.CONFLICT);
    }

    const ingredient = new Ingredient();
    ingredient.name = createDto.name;
    ingredient.description = createDto.description || null;
    ingredient.unitOfMeasure = createDto.unitOfMeasure;
    ingredient.stockQuantity = createDto.stockQuantity;
    ingredient.lowStockThreshold = createDto.lowStockThreshold === undefined ? null : createDto.lowStockThreshold;
    ingredient.costPrice = createDto.costPrice === undefined ? null : createDto.costPrice;
    ingredient.supplier = createDto.supplier || null;

    return this.ingredientRepository.save(ingredient);
  }

  async findAll(options?: FindManyOptions<Ingredient>): Promise<Ingredient[]> {
    return this.ingredientRepository.find(options);
  }

  async findOne(id: number, options?: FindOneOptions<Ingredient>): Promise<Ingredient | null> {
    return this.ingredientRepository.findOne({ where: { id }, ...options });
  }

  async update(id: number, updateDto: UpdateIngredientDto): Promise<Ingredient | null> {
    const ingredient = await this.ingredientRepository.findOneBy({ id });
    if (!ingredient) {
      return null;
    }

    if (updateDto.name && updateDto.name !== ingredient.name) {
      const existingIngredient = await this.ingredientRepository.findOneBy({ name: updateDto.name });
      if (existingIngredient && existingIngredient.id !== id) {
        throw new HttpException(`Another ingredient with name "${updateDto.name}" already exists`, HttpStatus.CONFLICT);
      }
      ingredient.name = updateDto.name;
    }
    
    if (updateDto.description !== undefined) {
      ingredient.description = updateDto.description || null;
    }
    if (updateDto.unitOfMeasure !== undefined) {
      if (!Object.values(IngredientUnit).includes(updateDto.unitOfMeasure)) {
        throw new HttpException(`Invalid unitOfMeasure: ${updateDto.unitOfMeasure}`, HttpStatus.BAD_REQUEST);
      }
      ingredient.unitOfMeasure = updateDto.unitOfMeasure;
    }
    if (updateDto.stockQuantity !== undefined) {
      ingredient.stockQuantity = updateDto.stockQuantity;
    }
    if (updateDto.lowStockThreshold !== undefined) {
      ingredient.lowStockThreshold = updateDto.lowStockThreshold === null ? null : Number(updateDto.lowStockThreshold);
    }
    if (updateDto.costPrice !== undefined) {
      ingredient.costPrice = updateDto.costPrice === null ? null : Number(updateDto.costPrice);
    }
    if (updateDto.supplier !== undefined) {
      ingredient.supplier = updateDto.supplier || null;
    }

    return this.ingredientRepository.save(ingredient);
  }

  async remove(id: number): Promise<void> {
    // TODO: Verificar si el ingrediente está en uso en alguna RecipeItem antes de eliminar.
    // Si lo está, se podría lanzar un error o marcar el ingrediente como inactivo.
    // Por ahora, si está en uso, la BD debería prevenir la eliminación debido a restricciones FK.
    const result = await this.ingredientRepository.delete(id);
    if (result.affected === 0) {
        throw new HttpException(`Ingredient with ID ${id} not found`, HttpStatus.NOT_FOUND);
    }
  }

  async updateStock(id: number, newStockQuantity: number, manager?: EntityManager): Promise<Ingredient | null> {
    const repository = manager ? manager.getRepository(Ingredient) : this.ingredientRepository;
    const ingredient = await repository.findOneBy({ id });
    if (!ingredient) {
      // Devuelve null para que el controlador maneje el 404
      return null; 
    }
    // TODO: Considerar si la política de stock negativo se maneja aquí o en deductStockForOrder
    // if (newStockQuantity < 0) {
    //     throw new HttpException('Stock cannot be negative', HttpStatus.BAD_REQUEST);
    // }
    ingredient.stockQuantity = newStockQuantity; // Corregido
    return repository.save(ingredient);
  }
  
  async adjustStock(id: number, quantityChange: number, manager?: EntityManager): Promise<Ingredient | null> {
    const repository = manager ? manager.getRepository(Ingredient) : this.ingredientRepository;
    
    const ingredient = await repository.findOneBy({ id });
    if (!ingredient) {
      throw new HttpException(`Ingredient with ID ${id} not found for stock adjustment.`, HttpStatus.NOT_FOUND);
    }
    
    const currentStock = Number(ingredient.stockQuantity); // Corregido
    const change = Number(quantityChange);
    
    const newStockValue = currentStock + change;

    // TODO: La política de stock insuficiente se maneja de forma más granular en OrderService por ahora.
    // Esta validación podría ser más genérica o eliminarse si OrderService ya lo cubre.
    // if (newStockValue < 0) {
    //   throw new HttpException(
    //     `Insufficient stock for ingredient ${ingredient.name}. Current: ${currentStock}, Required change: ${change}. Stock would be ${newStockValue}`,
    //     HttpStatus.CONFLICT 
    //   );
    // }
    ingredient.stockQuantity = newStockValue; // Corregido
    return repository.save(ingredient);
  }

  async findLowStock(threshold?: number): Promise<Ingredient[]> {
    const defaultThreshold = 10; 
    const stockThreshold = threshold === undefined ? defaultThreshold : threshold;
    
    return this.ingredientRepository.find({
      where: {
        stockQuantity: LessThanOrEqual(stockThreshold), // Corregido
      },
      // 'unitOfMeasure' ya no es una relación a cargar
      order: { stockQuantity: 'ASC' }, // Corregido
    });
  }
}

export const ingredientService = new IngredientService(); 