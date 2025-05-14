import { Request, Response, NextFunction } from 'express';
import { ingredientService } from '../services/ingredient.service';
import { CreateIngredientDto, UpdateIngredientDto } from '../dtos/ingredient.dto';
import { HttpException, HttpStatus } from '../utils/HttpException';
import { validate } from 'class-validator';
import { AppDataSource } from '../data-source';
import { Ingredient } from '../entities/Ingredient';
import { FindOptionsWhere } from 'typeorm';

export class IngredientController {
  private ingredientRepository = AppDataSource.getRepository(Ingredient);

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createDto = new CreateIngredientDto();
      Object.assign(createDto, req.body);

      const errors = await validate(createDto);
      if (errors.length > 0) {
        throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST, errors);
      }

      const ingredient = await ingredientService.create(createDto);
      res.status(HttpStatus.CREATED).json(ingredient);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Considerar paginación, filtros (ej. por nombre), y ordenación desde req.query
      // unitOfMeasure ya es un campo directo, no una relación a cargar.
      const ingredients = await ingredientService.findAll();
      res.status(HttpStatus.OK).json(ingredients);
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
      }
      // unitOfMeasure ya es un campo directo, no una relación a cargar.
      const ingredient = await ingredientService.findOne(id);
      if (!ingredient) {
        throw new HttpException('Ingredient not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(ingredient);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
      }

      const updateDto = new UpdateIngredientDto();
      Object.assign(updateDto, req.body);

      const errors = await validate(updateDto, { skipMissingProperties: true });
      if (errors.length > 0) {
        throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST, errors);
      }

      const ingredient = await ingredientService.update(id, updateDto);
      if (!ingredient) {
        throw new HttpException('Ingredient not found or unable to update', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(ingredient);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
      }
      await ingredientService.remove(id);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { newStock } = req.body;

      if (isNaN(id)) {
        throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
      }
      if (typeof newStock !== 'number' || newStock < 0) {
        throw new HttpException('Invalid newStock value', HttpStatus.BAD_REQUEST);
      }

      const ingredient = await ingredientService.updateStock(id, newStock);
      if (!ingredient) {
        throw new HttpException('Ingredient not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(ingredient);
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { quantityChange } = req.body;

      if (isNaN(id)) {
        throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
      }
      if (typeof quantityChange !== 'number') {
        throw new HttpException('Invalid quantityChange value', HttpStatus.BAD_REQUEST);
      }

      const ingredient = await ingredientService.adjustStock(id, quantityChange);
      if (!ingredient) {
        throw new HttpException('Ingredient not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(ingredient);
    } catch (error) {
      next(error);
    }
  }

  async findLowStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string, 10) : undefined;
      if (threshold !== undefined && isNaN(threshold)) {
        throw new HttpException('Invalid threshold value', HttpStatus.BAD_REQUEST);
      }
      const ingredients = await ingredientService.findLowStock(threshold);
      res.status(HttpStatus.OK).json(ingredients);
    } catch (error) {
      next(error);
    }
  }
}

export const ingredientController = new IngredientController(); 