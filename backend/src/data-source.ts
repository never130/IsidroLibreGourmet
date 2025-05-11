import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Product } from './entities/Product';
import { Order } from './entities/Order';
import { OrderItem } from './entities/OrderItem';
import { Expense } from './entities/Expense';
import { BusinessSetting } from './entities/BusinessSetting';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'isidro_libre_gourmet',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Product, Order, OrderItem, Expense, BusinessSetting],
  subscribers: [],
  migrations: ['src/migrations/**/*.ts'],
  migrationsTableName: "migrations_typeorm",
});
