import { Router } from 'express';
import { unitOfMeasureController } from '../controllers/unitOfMeasure.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkRole } from '../middleware/role.middleware';
import { UserRole } from '../entities/User';
// TODO: Importar middlewares de autenticación/autorización si son necesarios para estas rutas
// import { isAuthenticated, authorizeRoles } from '../middlewares/auth.middleware'; 

const router = Router();

// Crear una nueva unidad de medida
// Solo OWNER puede crear
router.post('/', authMiddleware, checkRole([UserRole.OWNER]), unitOfMeasureController.create);

// Obtener todas las unidades de medida
// Cualquier usuario autenticado puede leer
router.get('/', authMiddleware, unitOfMeasureController.findAll);

// Obtener una unidad de medida por ID
// Cualquier usuario autenticado puede leer
router.get('/:id', authMiddleware, unitOfMeasureController.findOne);

// Actualizar una unidad de medida por ID
// Solo OWNER puede actualizar
router.put('/:id', authMiddleware, checkRole([UserRole.OWNER]), unitOfMeasureController.update);

// Eliminar una unidad de medida por ID
// Solo OWNER puede eliminar
router.delete('/:id', authMiddleware, checkRole([UserRole.OWNER]), unitOfMeasureController.remove);

export default router; 