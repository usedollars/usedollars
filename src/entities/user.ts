// src/entities/User.ts

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn 
} from "typeorm";
import { Wallet } from "./Wallet";

@Entity({ name: "users" })  // apunta a la tabla "users"
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column()
  password!: string;  // se guarda la contraseña encriptada

  @OneToMany(() => Wallet, wallet => wallet.user)
  wallets!: Wallet[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

