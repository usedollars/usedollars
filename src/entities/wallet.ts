import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn 
} from "typeorm";
import { User } from "./User";

@Entity({ name: "wallets" })
export class Wallet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 10 })
  currency!: string; // Ej: "USDT", "USD", "BTC"

  @Column({ type: "varchar", unique: true })
  address!: string; // Dirección única de billetera interna (por ejemplo "usd_genesis33")

  @Column({ type: "decimal", precision: 18, scale: 2, default: 0 })
  balance!: number; // Balance real del usuario

  @ManyToOne(() => User, user => user.wallets)
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

