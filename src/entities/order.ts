import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from "typeorm";
import { User } from "./user";

@Entity("orders")
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "decimal", precision: 20, scale: 8 })
    amount: number; // Cuánto vende (ej: 1.0 ETH)

    @Column({ type: "decimal", precision: 20, scale: 8 })
    price: number; // A cuánto lo vende (ej: 3000.00 USDT)

    @Column()
    asset: string; // 'eth', 'btc', 'dop'

    @Column({ default: 'usdt' })
    currency: string; // Moneda que recibe (generalmente USDT)

    @Column()
    type: string; // 'BUY' o 'SELL'

    @Column({ default: 'OPEN' })
    status: string; // 'OPEN', 'COMPLETED', 'CANCELLED'

    @ManyToOne(() => User, (user) => user.transactions)
    @JoinColumn({ name: "user_id" })
    user: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}