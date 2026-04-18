import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("activity_logs")
export class ActivityLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @Column()
  action: string; // Ejemplo: 'DISPUTE_OPENED', 'LOGIN', 'TRANSFER_SEND'

  @Column({ type: "jsonb", nullable: true })
  details: any; // Aquí guardamos JSON con info extra

  @CreateDateColumn()
  created_at: Date;
}