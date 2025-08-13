import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  currency!: string;

  @Column('decimal', { precision: 18, scale: 8 })
  balance!: number;

  @ManyToOne(() => User, user => user.wallets)
  user!: User;
}

