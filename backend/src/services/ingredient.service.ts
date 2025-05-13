import { AppDataSource } from '../data-source';
import { Ingredient } from '../entities/Ingredient';
import { UnitOfMeasure } from '../entities/UnitOfMeasure';
import { CreateIngredientDto, UpdateIngredientDto } from '../dtos/ingredient.dto';
import { FindManyOptions, FindOneOptions, LessThanOrEqual, Repository, EntityManager } from 'typeorm';
import { HttpException, HttpStatus } from '../utils/HttpException';

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
  private unitOfMeasureRepository: Repository<UnitOfMeasure>;

  constructor() {
    this.ingredientRepository = AppDataSource.getRepository(Ingredient);
    this.unitOfMeasureRepository = AppDataSource.getRepository(UnitOfMeasure);
  }

  async create(createDto: CreateIngredientDto): Promise<Ingredient> {
    const unitOfMeasure = await this.unitOfMeasureRepository.findOneBy({ id: createDto.unitOfMeasureId });
    if (!unitOfMeasure) {
      throw new HttpException(`UnitOfMeasure with ID ${createDto.unitOfMeasureId} not found`, HttpStatus.NOT_FOUND);
    }

    const existingIngredient = await this.ingredientRepository.findOneBy({ name: createDto.name });
    if (existingIngredient) {
      throw new HttpException(`Ingredient with name "${createDto.name}" already exists`, HttpStatus.CONFLICT);
    }

    const ingredient = this.ingredientRepository.create({
      ...createDto,
      unitOfMeasure, // Asigna la entidad completa
    });
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
      // Devuelve null si no se encuentra para que el controlador decida si es 404
      return null; 
    }

    let unitOfMeasure = ingredient.unitOfMeasure;
    if (updateDto.unitOfMeasureId && updateDto.unitOfMeasureId !== ingredient.unitOfMeasureId) {
      const newUnitOfMeasure = await this.unitOfMeasureRepository.findOneBy({ id: updateDto.unitOfMeasureId });
      if (!newUnitOfMeasure) {
        throw new HttpException(`New UnitOfMeasure with ID ${updateDto.unitOfMeasureId} not found`, HttpStatus.NOT_FOUND);
      }
      unitOfMeasure = newUnitOfMeasure;
    }
    
    if (updateDto.name && updateDto.name !== ingredient.name) {
        const existingIngredient = await this.ingredientRepository.findOneBy({ name: updateDto.name });
        if (existingIngredient && existingIngredient.id !== id) {
            throw new HttpException(`Another ingredient with name "${updateDto.name}" already exists`, HttpStatus.CONFLICT);
        }
    }
    
    // Crear un objeto para merge excluyendo 'unitOfMeasureId' si está presente, ya que manejamos 'unitOfMeasure'
    const { unitOfMeasureId, ...restOfUpdateDto } = updateDto;

    this.ingredientRepository.merge(ingredient, {
        ...restOfUpdateDto,
        unitOfMeasure, 
    });
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

  async updateStock(id: number, newStock: number): Promise<Ingredient | null> {
    const ingredient = await this.ingredientRepository.findOneBy({ id });
    if (!ingredient) {
      // Devuelve null para que el controlador maneje el 404
      return null; 
    }
    if (newStock < 0) {
        throw new HttpException('Stock cannot be negative', HttpStatus.BAD_REQUEST);
    }
    ingredient.stock = newStock;
    return this.ingredientRepository.save(ingredient);
  }
  
  async adjustStock(id: number, quantityChange: number, manager?: EntityManager): Promise<Ingredient | null> {
    const repository = manager ? manager.getRepository(Ingredient) : this.ingredientRepository;
    
    const ingredient = await repository.findOneBy({ id });
    if (!ingredient) {
      // Lanzar excepción aquí es crucial para que la transacción que llama (si existe) haga rollback.
      throw new HttpException(`Ingredient with ID ${id} not found for stock adjustment.`, HttpStatus.NOT_FOUND);
    }
    
    const currentStock = Number(ingredient.stock);
    const change = Number(quantityChange);
    
    const newStockValue = currentStock + change;

    if (newStockValue < 0) {
      throw new HttpException(
        `Insufficient stock for ingredient ${ingredient.name}. Current: ${currentStock}, Required change: ${change}. Stock would be ${newStockValue}`,
        HttpStatus.CONFLICT // Usar CONFLICT (409) para indicar que la acción no se puede completar por el estado actual del recurso
      );
    }
    ingredient.stock = newStockValue;
    return repository.save(ingredient);
  }

  async findLowStock(threshold?: number): Promise<Ingredient[]> {
    const defaultThreshold = 10; 
    const stockThreshold = threshold === undefined ? defaultThreshold : threshold;
    
    return this.ingredientRepository.find({
      where: {
        stock: LessThanOrEqual(stockThreshold),
      },
      relations: ['unitOfMeasure'], 
      order: { stock: 'ASC' },
    });
  }
}

export const ingredientService = new IngredientService(); 