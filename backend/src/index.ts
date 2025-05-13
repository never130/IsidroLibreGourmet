/**
 * Punto de entrada principal de la aplicación backend
 * Configura el servidor Express, la conexión a la base de datos y las rutas
 */

import 'reflect-metadata';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';
import { User, UserRole } from './entities/User';
import bcrypt from 'bcrypt';
import allRoutes from './routes'; // Importar el enrutador principal
import { HttpException, HttpStatus } from './utils/HttpException';
import dotenv from 'dotenv';
import { QueryFailedError } from 'typeorm'; // Importar QueryFailedError
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'; // Importar errores de JWT
dotenv.config(); // Carga las variables de .env a process.env

// Inicializar la aplicación Express
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}));
app.use(express.json());

// Rutas principales
app.use('/api', allRoutes); // Usar el enrutador principal bajo el prefijo /api

// Middleware de manejo de errores global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[GLOBAL ERROR HANDLER]");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  if (err.errors) console.error("Validation Errors:", err.errors);

  if (err instanceof HttpException) {
    return res.status(err.status).json({
      message: err.message,
      status: err.status,
      errors: err.errors,
    });
  } 
  
  if (err instanceof JsonWebTokenError) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Invalid token',
        status: HttpStatus.UNAUTHORIZED,
    });
  }

  if (err instanceof TokenExpiredError) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Token expired',
        status: HttpStatus.UNAUTHORIZED,
    });
  }

  // Error de TypeORM (ej. violación de constraint, etc.)
  // QueryFailedError puede tener un `code` específico de la BD (ej. '23505' para unique_violation en PostgreSQL)
  if (err instanceof QueryFailedError) {
    // Podríamos personalizar mensajes basados en err.driverError.code o err.message
    // Por ejemplo, para unique violation:
    if ((err as any).code === '23505') { // Código de PostgreSQL para unique_violation
        return res.status(HttpStatus.CONFLICT).json({
            message: 'Database conflict: A record with this value already exists.', // Mensaje más amigable
            status: HttpStatus.CONFLICT,
            detail: err.message // Opcional: err.driverError.detail para más info de la BD
        });
    }
    return res.status(HttpStatus.BAD_REQUEST).json({ // O 500 si es más genérico
      message: 'Database query failed',
      status: HttpStatus.BAD_REQUEST,
      detail: err.message // Es bueno enviar el mensaje de error de la BD en desarrollo/staging
    });
  }
  
  // Error por defecto
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    message: err.message || 'Internal Server Error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  });
});

// Inicializar la base de datos y crear usuario por defecto
const port = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(async () => {
    console.log('Base de datos inicializada');
    
    // Crear usuario por defecto si no existe
    const userRepository = AppDataSource.getRepository(User);
    const defaultUser = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (!defaultUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = userRepository.create({
        username: 'admin',
        password: hashedPassword,
        role: UserRole.OWNER,
        isActive: true
      });
      await userRepository.save(adminUser);
      console.log('Usuario por defecto creado');
    }

    // Iniciar el servidor
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error al inicializar la base de datos:', error);
  }); 