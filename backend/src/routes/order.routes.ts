import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '../entities/User';
import { validateDto } from '../middleware/validation.middleware';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/order.dto';

const router = Router();
const orderController = new OrderController();

// Rutas públicas (si alguna no necesita authMiddleware general)
// Ejemplo: router.get('/public-info', orderController.getPublicInfo.bind(orderController));
// Por ahora, /active se tratará como protegida si authMiddleware está global abajo.
// Si /active es realmente pública, mover antes de router.use(authMiddleware) o crear un router aparte.

// Aplicar authMiddleware a todas las rutas subsiguientes en este router
router.use(authMiddleware);

// --- Rutas de Pedidos ---

// Obtener todos los pedidos (protegido)
router.get('/', orderController.getAll.bind(orderController));

// Obtener pedidos activos (protegido)
router.get('/active', orderController.getActiveOrders.bind(orderController)); // Asumiendo que también es protegida

// Crear un nuevo pedido (protegido, con validación)
// Cualquier usuario autenticado puede crear un pedido (ej. cajero, mesero)
router.post(
    '/',
    // authMiddleware, // Ya aplicado globalmente por router.use()
    validateDto(CreateOrderDto),
    orderController.create.bind(orderController)
);

// Obtener un pedido por ID (protegido)
// Podría ser accesible para el usuario que lo creó o administradores/cajeros
// Usamos orderController.getOne que parece ser el método más reciente/usado internamente
router.get(
    '/:id',
    // authMiddleware, // Ya aplicado globalmente
    // Aquí se podría añadir roleMiddleware si solo ciertos roles pueden ver cualquier pedido
    orderController.getOne.bind(orderController) // o getById si es el preferido, pero getOne se usó en la duplicada
);

// Actualizar el estado de un pedido (protegido, roles específicos, con validación)
// Típicamente para administradores, cajeros o el sistema
router.patch( // Cambiado a PATCH para consistencia con la definición que tenía validateDto
    '/:id/status',
    // authMiddleware, // Ya aplicado globalmente
    roleMiddleware([UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER]),
    validateDto(UpdateOrderStatusDto),
    orderController.updateStatus.bind(orderController)
);

// Marcar un pedido como completado (y deducir stock) (protegido, roles específicos)
// Típicamente para cajeros o el sistema al procesar un pago
router.post(
    '/:id/complete',
    // authMiddleware, // Ya aplicado globalmente
    roleMiddleware([UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER]),
    orderController.complete.bind(orderController)
);

// Cancelar un pedido (protegido)
// Podría tener roleMiddleware si solo ciertos roles pueden cancelar
router.post(
    '/:id/cancel',
    // authMiddleware, // Ya aplicado globalmente
    // roleMiddleware([UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER]), // Ejemplo si se necesita
    orderController.cancel.bind(orderController)
);

// Reimprimir un pedido existente (protegido)
// Podría tener roleMiddleware
router.post(
    '/:id/reprint',
    // authMiddleware, // Ya aplicado globalmente
    // roleMiddleware([UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER]), // Ejemplo si se necesita
    orderController.reprint.bind(orderController)
);


// TODO: Añadir ruta para listar pedidos GET / con filtros, paginación, etc. (ya está con GET '/')

export default router; 