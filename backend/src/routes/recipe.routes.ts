import { Router } from 'express';
import { recipeController } from '../controllers/recipe.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '../entities/User';
// TODO: Importar middlewares de autenticación/autorización
// import { isAuthenticated, authorizeRoles } from '../middlewares/auth.middleware';

const router = Router();

const writeRoles = [UserRole.OWNER, UserRole.ADMIN];

// Crear una nueva receta
router.post('/', authMiddleware, checkRole(writeRoles), /* isAuthenticated, authorizeRoles(['ADMIN', 'MANAGER']), */ recipeController.create);

// Obtener todas las recetas
router.get('/', authMiddleware, /* isAuthenticated, */ recipeController.findAll);

// Obtener una receta por su ID
router.get('/:id', authMiddleware, /* isAuthenticated, */ recipeController.findOne);

// Obtener la receta de un producto específico por productId
router.get('/product/:productId', authMiddleware, /* isAuthenticated, */ recipeController.findByProductId);

// Actualizar una receta por ID
router.put('/:id', authMiddleware, checkRole(writeRoles), /* isAuthenticated, authorizeRoles(['ADMIN', 'MANAGER']), */ recipeController.update);

// Eliminar una receta por ID
router.delete('/:id', authMiddleware, checkRole(writeRoles), /* isAuthenticated, authorizeRoles(['ADMIN', 'MANAGER']), */ recipeController.remove);

export default router; 