import { Router } from 'express';
import { IngredientController } from '../controllers/ingredient.controller';
// import { authMiddleware } from '../middleware/auth.middleware'; // Descomentar si se necesita autenticación
// import { roleMiddleware } from '../middleware/role.middleware'; // Descomentar para proteger rutas por rol

const router = Router();
const ingredientController = new IngredientController();

// Por ahora, rutas públicas. Proteger según sea necesario más adelante.
// Ejemplo de ruta protegida: router.post('/', authMiddleware, roleMiddleware(['ADMIN']), ingredientController.create);

router.post('/', ingredientController.create.bind(ingredientController));
router.get('/', ingredientController.findAll.bind(ingredientController));
router.get('/:id', ingredientController.findOne.bind(ingredientController));
router.put('/:id', ingredientController.update.bind(ingredientController));
router.delete('/:id', ingredientController.remove.bind(ingredientController));

export default router; 