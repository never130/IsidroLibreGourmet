/**
 * Punto de entrada principal de la aplicación backend
 * Configura el servidor Express, la conexión a la base de datos y las rutas
 */

import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';
import { User, UserRole } from './entities/User';
import bcrypt from 'bcrypt';
import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import productRoutes from './routes/product.routes';
import userRoutes from './routes/user.routes';
import expenseRoutes from './routes/expense.routes';
import reportRoutes from './routes/report.routes';
import dashboardRoutes from './routes/dashboard.routes';
import businessSettingRoutes from './routes/business-setting.routes';
import dotenv from 'dotenv';
    dotenv.config(); // Carga las variables de .env a process.env
// dotenv

// Inicializar la aplicación Express
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/business-settings', businessSettingRoutes);

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