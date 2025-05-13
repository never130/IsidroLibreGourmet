import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('unit_of_measures') // Nombre de la tabla
export class UnitOfMeasure {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true }) // Para asegurar que el nombre sea único
  @Column({ type: 'varchar', length: 50 })
  name: string; // Ej: "Gramo", "Mililitro", "Unidad", "Kilogramo", "Litro"

  @Index({ unique: true }) // Para asegurar que el símbolo sea único
  @Column({ type: 'varchar', length: 10 })
  symbol: string; // Ej: "g", "ml", "ud", "kg", "l"

  @Column({ type: 'text', nullable: true })
  description?: string; // Opcional, para notas adicionales

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 