import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const validateDto = (dtoClass: any, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let dataToValidate: any;

    switch (source) {
      case 'query':
        dataToValidate = req.query;
        break;
      case 'params':
        dataToValidate = req.params;
        break;
      case 'body':
      default:
        dataToValidate = req.body;
        break;
    }

    const dtoObject = plainToClass(dtoClass, dataToValidate);
    const errors = await validate(dtoObject, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      const errorMessages = errors.map(error => ({
        property: error.property,
        constraints: error.constraints,
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    if (source === 'query') {
      req.query = dtoObject as any; // Sobrescribir req.query con el objeto validado y transformado
    } else if (source === 'params') {
      // req.params es ParamsDictionary, se necesita cuidado al reasignar
      // O simplemente no reasignar y confiar en que el controlador use el dtoObject si es necesario
      // Por ahora, para ser consistentes, lo reasignamos aunque pueda necesitar un type cast
      req.params = dtoObject as any; 
    } else {
      req.body = dtoObject; // Sobrescribir req.body
    }
    
    next();
  };
}; 