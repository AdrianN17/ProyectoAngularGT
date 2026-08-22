import { Component, signal } from '@angular/core';
import { WalletInfo } from '../card/wallet-info/wallet-info';
import { WalletResponse } from '../../models/wallet.model';
import { RechargeCreate } from '../card/recharge-create/recharge-create';
import { RechargeListMinimun } from '../card/recharge-list-minimun/recharge-list-minimun';

@Component({
  selector: 'app-seller-wallet',
  imports: [WalletInfo, RechargeCreate, RechargeListMinimun],
  templateUrl: './seller-wallet.html',
  styleUrl: './seller-wallet.css',
})
export class SellerWallet {
  walletIdInput    = signal('');
  confirmedWallet  = signal<WalletResponse | null>(null);
  showRechargeModal = signal(false);

  onInput(value: string): void {
    this.walletIdInput.set(value.trim());
    this.confirmedWallet.set(null);
  }

  onWalletLoaded(wallet: WalletResponse | null): void {
    this.confirmedWallet.set(wallet);
  }

  onRechargeSuccess(): void {
    this.showRechargeModal.set(false);
  }
}
