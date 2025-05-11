import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';
import { validateDto } from '../middleware/validation.middleware';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/order.dto';

const router = Router();
const orderController = new OrderController();

// Rutas públicas
router.get('/active', orderController.getActiveOrders.bind(orderController));

// Rutas protegidas
router.use(authMiddleware);
router.get('/', orderController.getAll.bind(orderController));
router.get('/:id', orderController.getById.bind(orderController));
router.post('/', validateDto(CreateOrderDto), orderController.create.bind(orderController));
router.patch('/:id/status', validateDto(UpdateOrderStatusDto), orderController.updateStatus.bind(orderController));
router.post('/:id/cancel', orderController.cancel.bind(orderController));
router.post('/:id/reprint', orderController.reprint.bind(orderController));

export default router; 