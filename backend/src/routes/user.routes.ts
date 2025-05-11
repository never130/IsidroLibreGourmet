import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';
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
router.get('/', authMiddleware, checkRole([UserRole.OWNER, UserRole.DEVELOPER, UserRole.ADMIN]), (req, res) => userController.getAll(req, res));
router.get('/:id', authMiddleware, checkRole([UserRole.OWNER, UserRole.DEVELOPER, UserRole.ADMIN]), (req, res) => userController.getById(req, res));
router.post('/', authMiddleware, checkRole([UserRole.OWNER, UserRole.DEVELOPER, UserRole.ADMIN]), validateDto(CreateUserDto), (req, res) => userController.create(req, res));
router.patch('/:id', authMiddleware, checkRole([UserRole.OWNER, UserRole.DEVELOPER, UserRole.ADMIN]), validateDto(UpdateUserDto), (req, res) => userController.update(req, res));
router.delete('/:id', authMiddleware, checkRole([UserRole.OWNER, UserRole.DEVELOPER, UserRole.ADMIN]), (req, res) => userController.delete(req, res));

export default router; 