import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Wallet } from "./Wallet";

@Entity()
export class Transaction {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column()
  type: 'deposit' | 'withdraw';

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}

