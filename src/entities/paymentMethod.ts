import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./user";

export enum PaymentMethodType {
  BANK_TRANSFER = "BANK_TRANSFER",
  WALLET = "WALLET",
  OTHER = "OTHER"
}

@Entity("payment_methods")
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "enum",
    enum: PaymentMethodType,
    default: PaymentMethodType.BANK_TRANSFER
  })
  type!: PaymentMethodType;

  @Column()
  bankName!: string; // Ej: Banreservas, Zelle, Wise

  @Column("text")
  accountDetails!: string; // Número de cuenta, nombre del titular, etc.

  // Vinculación obligatoria con el Usuario (KYC)
  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @CreateDateColumn()
  created_at!: Date;
}