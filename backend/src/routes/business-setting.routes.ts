import { Router } from 'express';
import { BusinessSettingController } from '../controllers/business-setting.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '../entities/User';
import { validateDto } from '../middleware/validation.middleware';
import { BusinessSettingDto } from '../dtos/business-setting.dto';

const router = Router();
const controller = new BusinessSettingController();

// Obtener la configuración del negocio (accesible para cualquier usuario autenticado)
router.get(
    '/', 
    authMiddleware, 
    controller.getSettings
);

// Actualizar la configuración del negocio (solo OWNER o DEVELOPER)
router.put(
    '/', 
    authMiddleware, 
    roleMiddleware([UserRole.OWNER]),
    validateDto(BusinessSettingDto),
    controller.updateSettings
);

export default router; 