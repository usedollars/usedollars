import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn 
} from "typeorm";
import { User } from "./user";
import { Transaction } from "./transaction";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("text")
  content!: string;

  /**
   * Identifica si el mensaje es de la Administradora resolviendo una disputa.
   */
  @Column({ type: "boolean", default: false })
  is_admin_note!: boolean; // 👈 Agregamos esto para tu control total

  /**
   * Relación con la orden P2P.
   */
  @ManyToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "order_id" })
  order!: Transaction;

  /**
   * Quién envió el mensaje.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: "sender_id" })
  sender!: User;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}