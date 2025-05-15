import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '../entities/User';
import { validateDto } from '../middleware/validation.middleware';
import { CreateUserDto, UpdateUserDto, LoginDto, UpdateProfileDto } from '../dtos/user.dto';

const router = Router();
const userController = new UserController();

// Rutas públicas
router.post('/login', validateDto(LoginDto), (req, res) => userController.login(req, res));

// Ruta para obtener el perfil del usuario actual
router.get(
  '/me',
  authMiddleware, // Solo requiere autenticación
  (req, res) => userController.getCurrentUser(req, res)
);

// Ruta para que el usuario actualice su propio perfil
router.put(
  '/me/profile', 
  authMiddleware, // Solo requiere autenticación, no un rol específico
  validateDto(UpdateProfileDto), 
  (req, res) => userController.updateCurrentUserProfile(req, res)
);

// Rutas protegidas (para administración de usuarios por roles OWNER/DEVELOPER)
router.get('/', authMiddleware, roleMiddleware([UserRole.OWNER]), (req, res) => userController.getAll(req, res));
router.get('/:id', authMiddleware, roleMiddleware([UserRole.OWNER]), (req, res) => userController.getById(req, res));
router.post('/', authMiddleware, roleMiddleware([UserRole.OWNER]), validateDto(CreateUserDto), (req, res) => userController.create(req, res));
router.patch('/:id', authMiddleware, roleMiddleware([UserRole.OWNER]), validateDto(UpdateUserDto), (req, res) => userController.update(req, res));
router.delete('/:id', authMiddleware, roleMiddleware([UserRole.OWNER]), (req, res) => userController.delete(req, res));

export default router; 