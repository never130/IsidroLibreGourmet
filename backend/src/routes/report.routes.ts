import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware, checkRole } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User';
import { validateDto } from '../middleware/validation.middleware';
import { ReportParamsDto, TopProductsParamsDto, LowStockParamsDto } from '../dtos/report.dto';

const router = Router();
const reportController = new ReportController();

// Middleware de autenticación y rol base para todas las rutas de reportes
router.use(authMiddleware, checkRole([UserRole.OWNER, UserRole.DEVELOPER, UserRole.ADMIN])); // Incluimos ADMIN

// Rutas de Reportes de Ventas
router.get('/summary', 
  validateDto(ReportParamsDto, 'query'), // startDate, endDate
  reportController.getSalesSummary.bind(reportController)
);

router.get('/order-stats', 
  validateDto(ReportParamsDto, 'query'), // startDate, endDate
  reportController.getOrderStats.bind(reportController)
);

router.get('/payment-methods', 
  validateDto(ReportParamsDto, 'query'), // startDate, endDate
  reportController.getSalesByPaymentMethod.bind(reportController)
);

router.get('/revenue-over-time', 
  validateDto(ReportParamsDto, 'query'), // startDate, endDate
  reportController.getRevenueOverTime.bind(reportController)
);

// Rutas de Reportes de Productos
router.get('/product-stats', 
  // No requiere DTO de query params por ahora, según el frontend y el controlador actual
  // validateDto(ReportParamsDto, 'query'), // Opcional: startDate, endDate si se añaden al controller
  reportController.getProductsStats.bind(reportController)
);

router.get('/top-products', 
  validateDto(TopProductsParamsDto, 'query'), // startDate, endDate, limit
  reportController.getTopProducts.bind(reportController)
);

router.get('/low-stock-products', 
  validateDto(LowStockParamsDto, 'query'), // threshold
  reportController.getLowStockProducts.bind(reportController)
);

// Ruta de Reportes de Gastos
router.get('/expenses-summary', 
  validateDto(ReportParamsDto, 'query'), // startDate, endDate
  reportController.getExpensesStats.bind(reportController)
);

// Rutas deprecadas o no usadas actualmente por el frontend han sido eliminadas:
// /sales (reemplazada por /summary)
// /expenses (reemplazada por /expenses-summary)
// /products (reemplazada por /product-stats)
// /products/top (reemplazada por /top-products)
// /products/low-stock (reemplazada por /low-stock-products)
// /products/performance (getProductPerformance no se usa directamente en el frontend)
// /sales/daily (getDailySales deprecado)
// /sales/detailed (getSalesReport deprecado)

export default router; 