import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/User';

// Interfaz para el payload del token JWT
interface TokenPayload {
  id: number;
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Extender la interfaz Request para incluir el usuario con los nuevos campos
declare global {
  namespace Express {
    interface Request {
      // user ahora puede tener los campos opcionales del perfil
      user?: Pick<User, 'id' | 'username' | 'role' | 'firstName' | 'lastName' | 'email'>;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Usar la interfaz TokenPayload para tipar el resultado de jwt.verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as TokenPayload;
    
    // Construir el objeto req.user con los campos esperados
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// La función checkRole ha sido movida/confirmada en role.middleware.ts 