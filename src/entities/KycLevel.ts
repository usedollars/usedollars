import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("kyc_levels")
export class KycLevel {
  @PrimaryGeneratedColumn()
  id!: number; // 👈 Agregado !

  @Column({ type: "varchar", length: 5, default: "DO" })
  region_id!: string; // 👈 Agregado !

  @Column({ type: "int" })
  level_tier!: number; // 👈 Agregado !

  // Límite diario en dinero (precisión financiera)
  @Column({ type: "decimal", precision: 20, scale: 2, name: "daily_limit_base" })
  dailyLimitBase!: number; // 👈 Agregado !

  @CreateDateColumn()
  created_at!: Date; // 👈 Agregado !

  @UpdateDateColumn()
  updated_at!: Date; // 👈 Agregado !
}