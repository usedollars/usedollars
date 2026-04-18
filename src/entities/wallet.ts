import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user"; 

@Entity("wallets")
export class Wallet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  currency!: string; // usdt, btc, etc.

  @Column({ unique: true })
  address!: string; // Dirección única de la billetera

  // Usamos 'decimal' con alta precisión (escala 8 es perfecta para cripto como BTC)
  @Column("decimal", { precision: 20, scale: 8, default: 0 })
  balance!: number;

  @Column("decimal", { precision: 20, scale: 8, default: 0 })
  locked_balance!: number; // Fondos congelados en Escrow

  // --- RELACIONES ---
  // [CORRECCIÓN]: Eliminamos el (user) => user.wallets para evitar el crash de TypeORM
  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  // --- FECHAS ---
  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;
}