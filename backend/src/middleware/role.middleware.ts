import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User';

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tiene permisos para realizar esta acción' });
    }

    next();
  };
}; 