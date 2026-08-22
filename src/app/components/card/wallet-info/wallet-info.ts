import { Component, input, output, signal, inject, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import { WalletService } from '../../../services/wallet.service';
import { WalletResponse } from '../../../models/wallet.model';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-wallet-info',
  imports: [],
  templateUrl: './wallet-info.html',
  styleUrl: './wallet-info.css',
})
export class WalletInfo {
  walletId = input('');
  walletLoaded = output<WalletResponse | null>();

  private readonly walletService = inject(WalletService);
  private currentSub?: Subscription;

  wallet = signal<WalletResponse | null>(null);
  loading = signal(false);
  error = signal('');

  constructor() {
    effect(() => {
      const id = this.walletId();
      this.currentSub?.unsubscribe();
      if (!id || !UUID_RE.test(id)) {
        this.wallet.set(null);
        this.error.set('');
        this.loading.set(false);
        this.walletLoaded.emit(null);
        return;
      }
      this.loading.set(true);
      this.error.set('');
      this.currentSub = this.walletService.getWallet(id).subscribe({
        next: (data) => {
          this.wallet.set(data);
          this.loading.set(false);
          this.walletLoaded.emit(data);
        },
        error: () => {
          this.wallet.set(null);
          this.error.set('Wallet no encontrada.');
          this.loading.set(false);
          this.walletLoaded.emit(null);
        },
      });
    });
  }

  currencyLabel(c: string): string {
    const map: Record<string, string> = { PEN: 'Soles', USD: 'Dólares', EUR: 'Euros' };
    return map[c] ?? c;
  }
}
