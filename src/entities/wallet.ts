import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./user";

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal')
  balance!: number;

  @ManyToOne(() => User, (user) => user.wallets)
  user!: User;
}
