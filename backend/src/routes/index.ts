import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import expenseRoutes from './expense.routes';
import reportRoutes from './report.routes';
import businessSettingRoutes from './business-setting.routes';
import dashboardRoutes from './dashboard.routes';
import unitOfMeasureRoutes from './unitOfMeasure.routes';
import ingredientRoutes from './ingredient.routes';
import recipeRoutes from './recipe.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);
router.use('/business-settings', businessSettingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/units-of-measure', unitOfMeasureRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/recipes', recipeRoutes);

export default router; 