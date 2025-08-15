import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany 
} from "typeorm";
import { Wallet } from "./wallet"; // Asegúrate que wallet.ts exista

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @OneToMany(() => Wallet, (wallet: Wallet) => wallet.user)
  wallets!: Wallet[];
}
