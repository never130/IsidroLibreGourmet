/**
 * Controlador de productos
 * Maneja todas las operaciones CRUD relacionadas con productos
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Product } from '../entities/Product';
import { LessThanOrEqual, ILike } from 'typeorm';
import { CreateProductDto, UpdateProductDto, UpdateProductStockDto } from '../dtos/product.dto';

export class ProductController {
  private productRepository = AppDataSource.getRepository(Product);

  /**
   * Obtiene todos los productos, opcionalmente filtrados por término de búsqueda y estado de actividad.
   * @param req Request de Express (query params: term, isActive)
   * @param res Response de Express
   * @returns Lista de productos
   */
  async getAll(req: Request, res: Response) {
    try {
      const { term, isActive } = req.query;
      const whereConditions: any = {};

      if (term) {
        whereConditions.name = ILike(`%${term}%`);
        // Podrías añadir más campos a la búsqueda aquí, ej: description
        // whereConditions.description = ILike(`%${term}%`); // Ejemplo
      }

      if (isActive !== undefined) {
        whereConditions.isActive = isActive === 'true';
      }

      const products = await this.productRepository.find({
        where: whereConditions,
        order: { name: 'ASC' },
      });
      res.json(products);
    } catch (error) {
      console.error('Error getting products:', error);
      res.status(500).json({ message: 'Error getting products' });
    }
  }

  /**
   * Obtiene un producto por su ID
   * @param req - Request de Express con el ID del producto
   * @param res - Response de Express
   * @returns Datos del producto
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await this.productRepository.findOne({
        where: { id: parseInt(id) },
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error getting product by id:', error);
      res.status(500).json({ message: 'Error getting product by id' });
    }
  }

  /**
   * Crea un nuevo producto
   * @param req - Request de Express con los datos del producto
   * @param res - Response de Express
   * @returns Producto creado
   */
  async create(req: Request, res: Response) {
    try {
      const createProductDto = req.body as CreateProductDto;
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      // TODO: Manejar errores de validación de DTO o duplicados de BD más específicamente
      res.status(500).json({ message: 'Error creating product' });
    }
  }

  /**
   * Actualiza un producto existente
   * @param req - Request de Express con el ID y los nuevos datos del producto
   * @param res - Response de Express
   * @returns Producto actualizado
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateProductDto = req.body as UpdateProductDto;

      const product = await this.productRepository.findOneBy({ id: parseInt(id) });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      this.productRepository.merge(product, updateProductDto);
      const updatedProduct = await this.productRepository.save(product);
      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Error updating product' });
    }
  }

  /**
   * Elimina un producto
   * @param req - Request de Express con el ID del producto
   * @param res - Response de Express
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await this.productRepository.findOneBy({ id: parseInt(id) });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      await this.productRepository.remove(product);
      res.status(204).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Error deleting product' });
    }
  }

  /**
   * Actualiza el stock de un producto
   * @param req - Request de Express con el ID y el nuevo stock
   * @param res - Response de Express
   * @returns Producto actualizado
   */
  async updateStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateProductStockDto = req.body as UpdateProductStockDto;

      const product = await this.productRepository.findOneBy({ id: parseInt(id) });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // La DTO espera `stock`, no `quantity`. Asegurarse que la lógica sea correcta.
      // Si la DTO define la cantidad a añadir/restar, la lógica sería: product.stock += updateProductStockDto.quantityChange;
      // Si la DTO define el nuevo stock total, la lógica es: product.stock = updateProductStockDto.stock;
      // Asumiendo que UpdateProductStockDto tiene { stock: number } que es el nuevo valor total.
      product.stock = updateProductStockDto.stock;
      
      // Opcional: Validar que el stock no sea negativo si es un requisito de negocio
      if (product.stock < 0) {
         // return res.status(400).json({ message: 'Stock cannot be negative' });
         // Por ahora lo permitimos, pero es un punto a considerar.
      }

      await this.productRepository.save(product);
      res.json(product);
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ message: 'Error updating stock' });
    }
  }

  async toggleActiveStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await this.productRepository.findOneBy({ id: parseInt(id) });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      product.isActive = !product.isActive;
      await this.productRepository.save(product);
      res.json(product);
    } catch (error) {
      console.error('Error toggling product active status:', error);
      res.status(500).json({ message: 'Error toggling product active status' });
    }
  }

  /**
   * Obtiene productos con stock bajo
   * @param req - Request de Express con el umbral de stock
   * @param res - Response de Express
   * @returns Lista de productos con stock bajo
   */
  async getLowStock(req: Request, res: Response) {
    try {
      const thresholdQuery = req.query.threshold as string | undefined;
      const threshold = thresholdQuery ? parseInt(thresholdQuery) : 10;

      if (isNaN(threshold)) {
        return res.status(400).json({ message: 'Invalid threshold value' });
      }

      const products = await this.productRepository.find({
        where: {
          stock: LessThanOrEqual(threshold),
          // isAvailable: true, // Decidimos mostrar todos, activos o no, que estén bajos de stock
          isActive: true, // O quizás solo activos que estén bajos de stock?
        },
        order: { stock: 'ASC' },
      });

      res.json(products);
    } catch (error) {
      console.error('Error getting low stock products:', error);
      res.status(500).json({ message: 'Error getting low stock products' });
    }
  }
} 