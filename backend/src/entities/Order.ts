import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { OrderItem } from './OrderItem';
import { User } from './User';

export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  TRANSFER = 'transfer',
  OTHER = 'other'
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: OrderType,
    default: OrderType.DINE_IN
  })
  type: OrderType;

  @Column()
  customerName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerPhone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH
  })
  paymentMethod: PaymentMethod;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @OneToMany(() => OrderItem, item => item.order, { cascade: ['insert', 'update'], eager: false })
  items: OrderItem[];

  @ManyToOne(() => User, user => user.orders, { nullable: false, eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 