import { AppDataSource } from '../data-source';
import { Wallet } from '../entities/Wallet';
import { User } from '../entities/User';

interface TransferParams {
  fromUserId: number;
  toUserEmail: string;
  amount: number;
  currency: string;
}

interface CreateWalletParams {
  userId: number;
  currency: string;
  balance: number;
}

export class WalletService {
  private walletRepo = AppDataSource.getRepository(Wallet);
  private userRepo = AppDataSource.getRepository(User);

  // Obtener wallets de un usuario
  async getMyWallets(userId: number) {
    const wallets = await this.walletRepo.find({
      where: { user: { id: userId } },
    });
    return wallets;
  }

  // Crear wallet
  async createWallet({ userId, currency, balance }: CreateWalletParams) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new Error('Usuario no encontrado');

    const wallet = this.walletRepo.create({ user, currency, balance });
    return this.walletRepo.save(wallet);
  }

  // Transferir fondos entre usuarios internos
  async transfer({ fromUserId, toUserEmail, amount, currency }: TransferParams) {
    if (amount <= 0) throw new Error('El monto debe ser mayor a 0');

    const fromWallet = await this.walletRepo.findOneBy({
      user: { id: fromUserId },
      currency,
    });
    if (!fromWallet) throw new Error('Wallet del remitente no encontrada');
    if (fromWallet.balance < amount) throw new Error('Fondos insuficientes');

    const toUser = await this.userRepo.findOneBy({ email: toUserEmail });
    if (!toUser) throw new Error('Usuario destinatario no encontrado');

    let toWallet = await this.walletRepo.findOneBy({ user: { id: toUser.id }, currency });
    if (!toWallet) {
      // Crear wallet si no existe
      toWallet = this.walletRepo.create({ user: toUser, currency, balance: 0 });
      await this.walletRepo.save(toWallet);
    }

    fromWallet.balance -= amount;
    toWallet.balance += amount;

    await this.walletRepo.save([fromWallet, toWallet]);

    return { fromWallet, toWallet };
  }
}

