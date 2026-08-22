import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { WalletResponse } from '../../models/wallet.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { API_BASE } from '../../core/api.config';
import { CreateWallet } from '../card/create-wallet/create-wallet';
import { EditWallet } from '../card/edit-wallet/edit-wallet';
import { TransactionListDelete } from '../card/transaction-list-delete/transaction-list-delete';
import { RechargeListDelete } from '../card/recharge-list-delete/recharge-list-delete';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-support-wallet',
  imports: [FormsModule, DecimalPipe, CreateWallet, EditWallet, TransactionListDelete, RechargeListDelete],
  templateUrl: './support-wallet.html',
  styleUrl: './support-wallet.css',
})
export class SupportWallet {
  private readonly walletService = inject(WalletService);
  private readonly authService   = inject(AuthService);
  private readonly toastService  = inject(ToastService);
  private readonly http          = inject(HttpClient);

  walletIdInput   = signal('');
  confirmedWallet = signal<WalletResponse | null>(null);
  loadingWallet   = signal(false);
  walletError     = signal('');

  activeTab         = signal<'transactions' | 'recharges'>('transactions');
  showCreateModal   = signal(false);
  showEditModal     = signal(false);
  showDeleteConfirm = signal(false);
  deleting          = signal(false);

  onInput(value: string): void {
    const id = value.trim();
    this.walletIdInput.set(id);
    this.confirmedWallet.set(null);
    this.walletError.set('');

    if (!id || !UUID_RE.test(id)) return;

    this.loadingWallet.set(true);
    this.walletService.getWallet(id).subscribe({
      next: (data) => {
        this.confirmedWallet.set(data);
        this.loadingWallet.set(false);
      },
      error: () => {
        this.walletError.set('Wallet no encontrada.');
        this.loadingWallet.set(false);
      },
    });
  }

  onWalletUpdated(updated: WalletResponse): void {
    this.confirmedWallet.set(updated);
    this.showEditModal.set(false);
  }

  confirmDelete(): void {
    const w = this.confirmedWallet();
    if (!w || this.deleting()) return;
    this.deleting.set(true);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });

    this.http.delete(`${API_BASE.wallet}/wallets/${w.WalletId}`, { headers }).subscribe({
      next: () => {
        this.toastService.show('Wallet eliminada correctamente', 'success');
        this.confirmedWallet.set(null);
        this.walletIdInput.set('');
        this.showDeleteConfirm.set(false);
        this.deleting.set(false);
      },
      error: () => {
        this.toastService.show('Error al eliminar la wallet', 'error');
        this.deleting.set(false);
      },
    });
  }
}

