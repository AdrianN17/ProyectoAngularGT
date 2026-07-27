import { Component, Input, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { WalletService, WalletSchemaResponse } from '../../services/wallet.service';
import { TransactionList } from '../card/transaction-list/transaction-list';
import { RechargeList } from '../card/recharge-list/recharge-list';
import { TransactionCreate } from '../card/transaction-create/transaction-create';
import { WalletEdit } from '../card/wallet-edit/wallet-edit';

@Component({
  selector: 'app-user-wallet',
  imports: [DecimalPipe, TransactionList, RechargeList, TransactionCreate, WalletEdit],
  templateUrl: './user-wallet.html',
  styleUrl: './user-wallet.css',
})
export class UserWallet implements OnInit {
  @Input() walletId?: string;

  private readonly walletService = inject(WalletService);
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly platformId    = inject(PLATFORM_ID);

  activeTab     = signal<'transactions' | 'recharges'>('transactions');
  showModal     = signal(false);
  showEditModal = signal(false);

  openTransferModal(): void { this.showModal.set(true); }

  wallet  = signal<WalletSchemaResponse | null>(null);
  loading = signal(true);
  error   = signal('');

  onWalletUpdated(updated: WalletSchemaResponse): void {
    this.wallet.set(updated);
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = this.walletId ?? this.route.snapshot.paramMap.get('walletId') ?? '9afc4154-5cf6-4ffc-b946-a0c5eae4a4ec';
    this.walletService.getWallet(id).subscribe({
      next: (data) => {
        this.wallet.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la wallet. Verifique el ID o su conexión.');
        this.loading.set(false);
      },
    });
  }
}
