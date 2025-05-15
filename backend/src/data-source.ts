import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Product } from './entities/Product';
import { Order } from './entities/Order';
import { OrderItem } from './entities/OrderItem';
import { Expense } from './entities/Expense';
import { BusinessSetting } from './entities/BusinessSetting';
import { UnitOfMeasure } from './entities/UnitOfMeasure';
import { Ingredient } from './entities/Ingredient';
import { Recipe } from './entities/Recipe';
import { RecipeItem } from './entities/RecipeItem';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'isidro_libre_gourmet',
  synchronize: true,
  logging: ['query', 'error'],
  entities: [User, Product, Order, OrderItem, Expense, BusinessSetting, UnitOfMeasure, Ingredient, Recipe, RecipeItem],
  subscribers: [],
  migrations: ['src/migrations/**/*.ts'],
  migrationsTableName: "migrations_typeorm",
});
