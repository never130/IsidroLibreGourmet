import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';
import { validateDto } from '../middleware/validation.middleware';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expense.dto';

const router = Router();
const expenseController = new ExpenseController();

// Aplicar authMiddleware a todas las rutas de gastos si se considera que deben ser protegidas
// Si diferentes rutas GET necesitan diferentes roles, se puede especificar por ruta.
// Por ahora, asumimos que todos los usuarios autenticados pueden leer gastos.
router.use(authMiddleware);

// Rutas (ahora todas protegidas por el router.use(authMiddleware) de arriba)
router.get('/', expenseController.getAll.bind(expenseController));
router.get('/date-range', expenseController.getByDateRange.bind(expenseController));
router.get('/category/:category', expenseController.getByCategory.bind(expenseController));
router.get('/:id', expenseController.getById.bind(expenseController));

// Rutas con protección de roles específica y validación de DTO
router.post('/', 
  // authMiddleware ya está aplicado globalmente para estas rutas por router.use()
  checkRole([UserRole.OWNER, UserRole.DEVELOPER, UserRole.CASHIER]), // Permitir a CAJERO crear gastos
  validateDto(CreateExpenseDto), 
  expenseController.create.bind(expenseController)
);

router.patch('/:id', 
  // authMiddleware ya está aplicado globalmente
  checkRole([UserRole.OWNER, UserRole.DEVELOPER]), 
  validateDto(UpdateExpenseDto), 
  expenseController.update.bind(expenseController)
);

router.delete('/:id', 
  // authMiddleware ya está aplicado globalmente
  checkRole([UserRole.OWNER, UserRole.DEVELOPER]), 
  expenseController.delete.bind(expenseController)
);

export default router; 