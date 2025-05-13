import { Request, Response, NextFunction } from 'express';
import { unitOfMeasureService } from '../services/unitOfMeasure.service';
import { CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto } from '../dtos/unitOfMeasure.dto';
import { HttpException, HttpStatus } from '../utils/HttpException';
import { validate } from 'class-validator';

export class UnitOfMeasureController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createDto = new CreateUnitOfMeasureDto();
      Object.assign(createDto, req.body);

      const errors = await validate(createDto);
      if (errors.length > 0) {
        throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST, errors);
      }

      const unitOfMeasure = await unitOfMeasureService.create(createDto);
      res.status(HttpStatus.CREATED).json(unitOfMeasure);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const unitsOfMeasure = await unitOfMeasureService.findAll();
      res.status(HttpStatus.OK).json(unitsOfMeasure);
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
      const unitOfMeasure = await unitOfMeasureService.findOne(id);
      if (!unitOfMeasure) {
        throw new HttpException('UnitOfMeasure not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(unitOfMeasure);
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
      
      const updateDto = new UpdateUnitOfMeasureDto();
      Object.assign(updateDto, req.body);

      const errors = await validate(updateDto, { skipMissingProperties: true });
      if (errors.length > 0) {
        throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST, errors);
      }

      const unitOfMeasure = await unitOfMeasureService.update(id, updateDto);
      if (!unitOfMeasure) {
        throw new HttpException('UnitOfMeasure not found or unable to update', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).json(unitOfMeasure);
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
      await unitOfMeasureService.remove(id);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}

export const unitOfMeasureController = new UnitOfMeasureController(); 