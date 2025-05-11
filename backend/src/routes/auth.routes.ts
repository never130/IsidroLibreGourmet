import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateDto } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

const router = Router();
const authController = new AuthController();

router.post('/login', validateDto(LoginDto), authController.login.bind(authController));

// Ruta para obtener el perfil del usuario autenticado
router.get(
  '/profile',
  authMiddleware,
  authController.getProfile.bind(authController)
);

export default router; 