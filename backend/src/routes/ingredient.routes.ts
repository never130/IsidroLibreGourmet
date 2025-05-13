import { Router } from 'express';
import { ingredientController } from '../controllers/ingredient.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '../entities/User';

const router = Router();

// Roles que pueden escribir (crear, actualizar, eliminar, ajustar stock)
const writeRoles = [UserRole.OWNER, UserRole.ADMIN];
// Roles que pueden leer información sensible de stock (como low-stock)
const sensitiveReadRoles = [UserRole.OWNER, UserRole.ADMIN];

// Crear un nuevo ingrediente
router.post('/', authMiddleware, checkRole(writeRoles), ingredientController.create);

// Obtener todos los ingredientes (cualquier usuario autenticado)
router.get('/', authMiddleware, ingredientController.findAll);

// Obtener ingredientes con bajo stock (solo roles con permisos)
router.get('/low-stock', authMiddleware, checkRole(sensitiveReadRoles), ingredientController.findLowStock);

// Obtener un ingrediente por ID (cualquier usuario autenticado)
router.get('/:id', authMiddleware, ingredientController.findOne);

// Actualizar un ingrediente por ID
router.put('/:id', authMiddleware, checkRole(writeRoles), ingredientController.update);

// Eliminar un ingrediente por ID
router.delete('/:id', authMiddleware, checkRole(writeRoles), ingredientController.remove);

// Actualizar el stock de un ingrediente (establecer un nuevo valor)
router.patch('/:id/stock', authMiddleware, checkRole(writeRoles), ingredientController.updateStock);

// Ajustar el stock de un ingrediente (sumar o restar cantidad)
router.patch('/:id/adjust-stock', authMiddleware, checkRole(writeRoles), ingredientController.adjustStock);

export default router; 