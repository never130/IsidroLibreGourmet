import { Request, Response, NextFunction } from 'express';
import { recipeService } from '../services/recipe.service';
import { CreateRecipeDto, UpdateRecipeDto } from '../dtos/recipe.dto';
import { HttpException, HttpStatus } from '../utils/HttpException';
import { validate } from 'class-validator';

export class RecipeController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createDto = new CreateRecipeDto();
      Object.assign(createDto, req.body);

      // La validación anidada de RecipeItemDto se maneja por class-validator gracias a @ValidateNested y @Type
      const errors = await validate(createDto);
      if (errors.length > 0) {
        throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST, errors);
      }

      const recipe = await recipeService.create(createDto);
      res.status(HttpStatus.CREATED).json(recipe);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Las relaciones se cargan por defecto en el servicio findAll
      const recipes = await recipeService.findAll(); 
      res.status(HttpStatus.OK).json(recipes);
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
      // Las relaciones se cargan por defecto en el servicio findOne
      const recipe = await recipeService.findOne(id);
      if (!recipe) {
        throw new HttpException('Recipe not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(recipe);
    } catch (error) {
      next(error);
    }
  }

  async findByProductId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        throw new HttpException('Invalid Product ID format', HttpStatus.BAD_REQUEST);
      }
      const recipe = await recipeService.findOneByProductId(productId);
      if (!recipe) {
        throw new HttpException('Recipe not found for this product', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(recipe);
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

      const updateDto = new UpdateRecipeDto();
      Object.assign(updateDto, req.body);
      
      const errors = await validate(updateDto, { skipMissingProperties: true }); // skipMissingProperties es importante aquí
      if (errors.length > 0) {
        throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST, errors);
      }

      const recipe = await recipeService.update(id, updateDto);
      if (!recipe) {
        throw new HttpException('Recipe not found or unable to update', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(recipe);
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
      await recipeService.remove(id);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}

export const recipeController = new RecipeController(); 