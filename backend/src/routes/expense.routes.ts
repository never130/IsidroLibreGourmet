import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '../entities/User';
import { validateDto } from '../middleware/validation.middleware';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expense.dto';

const router = Router();
const expenseController = new ExpenseController();

// Aplicar authMiddleware a todas las rutas de gastos
router.use(authMiddleware);

// Proteger todas las rutas de gastos para que solo OWNER y DEVELOPER puedan acceder
router.use(roleMiddleware([UserRole.OWNER, UserRole.DEVELOPER]));

// Rutas (ahora todas protegidas por authMiddleware y roleMiddleware de arriba)
router.get('/', expenseController.getAll.bind(expenseController));
router.get('/date-range', expenseController.getByDateRange.bind(expenseController));
router.get('/category/:category', expenseController.getByCategory.bind(expenseController));
router.get('/:id', expenseController.getById.bind(expenseController));

router.post('/', 
  validateDto(CreateExpenseDto), 
  expenseController.create.bind(expenseController)
);

router.patch('/:id', 
  validateDto(UpdateExpenseDto), 
  expenseController.update.bind(expenseController)
);

router.delete('/:id', 
  expenseController.delete.bind(expenseController)
);

export default router; 