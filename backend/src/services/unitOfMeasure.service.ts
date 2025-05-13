import { AppDataSource } from '../data-source';
import { UnitOfMeasure } from '../entities/UnitOfMeasure';
import { CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto } from '../dtos/unitOfMeasure.dto';
import { FindManyOptions, FindOneOptions } from 'typeorm';

export class UnitOfMeasureService {
  private unitOfMeasureRepository = AppDataSource.getRepository(UnitOfMeasure);

  async create(createDto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    const unitOfMeasure = this.unitOfMeasureRepository.create(createDto);
    return this.unitOfMeasureRepository.save(unitOfMeasure);
  }

  async findAll(options?: FindManyOptions<UnitOfMeasure>): Promise<UnitOfMeasure[]> {
    return this.unitOfMeasureRepository.find(options);
  }

  async findOne(id: number, options?: FindOneOptions<UnitOfMeasure>): Promise<UnitOfMeasure | null> {
    return this.unitOfMeasureRepository.findOne({ where: { id }, ...options });
  }

  // Find one by specific criteria, e.g., name or symbol, could be useful.
  async findOneBy(criteria: Partial<UnitOfMeasure>): Promise<UnitOfMeasure | null> {
    return this.unitOfMeasureRepository.findOneBy(criteria);
  }

  async update(id: number, updateDto: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure | null> {
    const unitOfMeasure = await this.findOne(id);
    if (!unitOfMeasure) {
      return null;
    }
    this.unitOfMeasureRepository.merge(unitOfMeasure, updateDto);
    return this.unitOfMeasureRepository.save(unitOfMeasure);
  }

  async remove(id: number): Promise<void> {
    // Considerar si se debe permitir eliminar unidades en uso.
    // Por ahora, la eliminación fallará si hay claves foráneas referenciándola (comportamiento por defecto de BD).
    // O podríamos verificarlo aquí y lanzar un error.
    await this.unitOfMeasureRepository.delete(id);
  }
}

// Exportar una instancia del servicio para que sea un singleton si se desea
export const unitOfMeasureService = new UnitOfMeasureService(); 