import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToOne, 
  JoinColumn, 
  ManyToOne 
} from "typeorm";
import { Transaction } from "./transaction";
import { User } from "./user";

export enum DisputeStatus {
  OPEN = "OPEN",
  RESOLVED = "RESOLVED",
  CANCELLED = "CANCELLED"
}

export enum DisputeWinner {
  CLAIMANT = "CLAIMANT",         // El que inició la disputa
  COUNTERPARTY = "COUNTERPARTY", // La otra parte de la transacción
  NONE = "NONE"                  // Aún sin definir o cancelada
}

@Entity("disputes")
export class Dispute {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Transaction)
  @JoinColumn({ name: "transaction_id" })
  transaction!: Transaction;

  // El usuario que abre la disputa (usualmente el comprador si no recibe o el vendedor si hay fraude)
  @ManyToOne(() => User, (user) => user.disputes)
  @JoinColumn({ name: "claimant_id" })
  claimant!: User;

  @Column("text")
  reason!: string;

  @Column({
    type: "enum",
    enum: DisputeStatus,
    default: DisputeStatus.OPEN
  })
  status!: DisputeStatus;

  @Column({
    type: "enum",
    enum: DisputeWinner,
    default: DisputeWinner.NONE,
    nullable: true
  })
  winner!: DisputeWinner;

  // Auditoría: ¿Qué administrador resolvió este problema?
  @ManyToOne(() => User)
  @JoinColumn({ name: "resolved_by_id" })
  resolved_by!: User;

  @Column("text", { nullable: true })
  admin_notes!: string; // Justificación del admin para cerrar el caso

  // URLs de las pruebas (Capturas de pago, chats, etc.)
  // En una fase posterior podrías hacer una entidad separada 'DisputeEvidence'
  @Column("text", { array: true, default: "{}" })
  evidence_urls!: string[];

  @Column({ type: "timestamp", nullable: true })
  resolved_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}