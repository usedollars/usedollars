import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Wallet } from './wallet';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true, nullable: true })
  phoneNumber!: string;

  @Column()
  password!: string;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => Wallet, wallet => wallet.user)
  wallets!: Wallet[];
}

