import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateDto } from '../middleware/validation.middleware';
import { CreateProductDto, UpdateProductDto, UpdateProductStockDto } from '../dtos/product.dto';

const router = Router();
const productController = new ProductController();

// Aplicar authMiddleware a todas las rutas de productos
router.use(authMiddleware);

// Rutas de Productos (todas protegidas)
router.get('/', productController.getAll.bind(productController));
router.get('/:id', productController.getById.bind(productController));
router.get('/stock/low', productController.getLowStock.bind(productController));

router.post(
  '/',
  validateDto(CreateProductDto),
  productController.create.bind(productController)
);

router.put(
  '/:id',
  validateDto(UpdateProductDto),
  productController.update.bind(productController)
);

router.patch(
  '/:id/stock',
  validateDto(UpdateProductStockDto, 'body'),
  productController.updateStock.bind(productController)
);

router.patch(
  '/:id/toggle-active',
  productController.toggleActiveStatus.bind(productController)
);

router.delete(
  '/:id',
  productController.delete.bind(productController)
);

export default router; 