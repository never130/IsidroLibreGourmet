import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User';

export const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tiene permisos para realizar esta acción' });
    }

    next();
  };
}; 