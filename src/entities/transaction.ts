import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user";
import { Wallet } from "./wallet";
import { Order } from "./order"; // 👈 Importación vital para el mercado P2P

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  // Usamos decimal para precisión financiera
  @Column("decimal", { precision: 20, scale: 8 })
  amount!: number;

  @Column()
  asset!: string; // (usdt, btc...)

  @Column()
  type!: string; // (internal_transfer, deposit, p2p_trade, referral_bonus...)

  @Column()
  status!: string; // (completed, pending_payment, payment_sent, disputed, cancelled...)

  // --- Relaciones ---

  // Emisor de los fondos
  @ManyToOne(() => User)
  @JoinColumn({ name: "sender_id" })
  sender!: User;

  // Receptor de los fondos
  @ManyToOne(() => User)
  @JoinColumn({ name: "receiver_id" })
  receiver!: User;

  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: "wallet_id" })
  wallet!: Wallet;

  // [NUEVO]: Conexión con la Orden P2P
  // Esto permite que el sistema sepa a qué comercio pertenece esta transacción
  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: "order_id" })
  order?: Order;

  // --- Fechas ---
  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date; 
}