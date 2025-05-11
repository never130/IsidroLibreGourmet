import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User'; // Asumiendo que todos los roles pueden ver el dashboard

const router = Router();
const dashboardController = new DashboardController();

router.get(
  '/summary',
  authMiddleware,
  // checkRole([UserRole.OWNER, UserRole.ADMIN, UserRole.CASHIER, UserRole.DEVELOPER]), // O ajusta los roles según necesidad
  dashboardController.getSummary.bind(dashboardController)
);

export default router; 