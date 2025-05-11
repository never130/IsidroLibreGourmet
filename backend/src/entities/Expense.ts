import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum ExpenseCategory {
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SUPPLIES = 'SUPPLIES',
  SALARY = 'SALARY',
  MAINTENANCE = 'MAINTENANCE',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer'
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.OTHER
  })
  category!: ExpenseCategory;

  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod!: PaymentMethod;

  @Column('date')
  date!: Date;

  @Column({ nullable: true })
  receiptNumber?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 