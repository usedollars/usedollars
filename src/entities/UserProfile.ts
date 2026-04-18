import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user"; // Asegúrate de que importe 'user' en minúsculas

@Entity("user_profiles")
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string; // 👈 Agregado !

  // Relación 1:1 con el Usuario
  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User; // 👈 Agregado !

  @Column({ type: "varchar", length: 5, default: "DO" })
  region_id!: string; // 👈 Agregado !

  @Column({ type: "int", default: 0 })
  kyc_level_tier!: number; // 👈 Agregado !

  @Column({ type: "varchar", length: 100, nullable: true })
  full_name!: string; // 👈 Agregado !

  @CreateDateColumn()
  created_at!: Date; // 👈 Agregado !

  @UpdateDateColumn()
  updated_at!: Date; // 👈 Agregado !
}