import
 { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 

  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany, // 👈 Añadido para la relación inversa
  JoinColumn 
} from "typeorm";
import { KycLevel } from "./KycLevel";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false }) 
  password!: string;

  @Column({ nullable: true })
  name!: string; 

  // --- BLINDAJE DE IDENTIDAD (KYC) ---
  
  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  documentId?: string;

  @Column({ 
    type: "varchar", 
    default: "PENDING_VERIFICATION" 
  })
  kycStatus!: "PENDING_VERIFICATION" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

  @Column({ default: 0 })
  kycTier!: number;

  // --- RELACIÓN CON NIVELES ---
  
  @ManyToOne(() => KycLevel)
  @JoinColumn({ name: "kyc_level_id" })
  kycLevel!: KycLevel;

  // --- REFERIDOS Y LEGIÓN (SOLUCIÓN AL ERROR FATAL) ---

  /**
   * Esta es la propiedad que buscaba tu TransactionController
   * Define quién invitó a este usuario.
   */
  @ManyToOne(() => User, (user) => user.referrals)
  @JoinColumn({ name: "referred_by_id" })
  referredBy?: User;

  /**
   * Lista de usuarios que este usuario ha invitado (su Legión)
   */
  @OneToMany(() => User, (user) => user.referredBy)
  referrals?: User[];

  @Column({ unique: true, nullable: true }) 
  refCode!: string; 

  @Column({ default: 0 })
  legionCount!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

}