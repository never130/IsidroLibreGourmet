import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';

export enum Currency {
  MXN = 'MXN',
  USD = 'USD',
  EUR = 'EUR',
  // Agrega otras monedas según sea necesario
}

@Entity('business_settings') // Nombre de la tabla
export class BusinessSetting extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.MXN
  })
  currency!: Currency;

  // Podríamos añadir un campo para el logo más adelante
  // @Column({ type: 'varchar', length: 255, nullable: true })
  // logoUrl?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 