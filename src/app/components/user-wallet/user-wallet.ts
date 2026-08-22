import { Component, Input, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { WalletResponse } from '../../models/wallet.model';
import { AuthService } from '../../services/auth.service';
import { TransactionList } from '../card/transaction-list/transaction-list';
import { RechargeList } from '../card/recharge-list/recharge-list';
import { TransactionCreate } from '../card/transaction-create/transaction-create';

@Component({
  selector: 'app-user-wallet',
  imports: [DecimalPipe, TransactionList, RechargeList, TransactionCreate],
  templateUrl: './user-wallet.html',
  styleUrl: './user-wallet.css',
})
export class UserWallet implements OnInit {
  @Input() walletId?: string;

  private readonly walletService = inject(WalletService);
  private readonly authService   = inject(AuthService);
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly platformId    = inject(PLATFORM_ID);

  activeTab = signal<'transactions' | 'recharges'>('transactions');
  showModal = signal(false);

  openTransferModal(): void { this.showModal.set(true); }

  wallet  = signal<WalletResponse | null>(null);
  loading = signal(true);
  error   = signal('');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Si se pasó walletId por ruta/input, usarlo directamente
    const routeId = this.walletId ?? this.route.snapshot.paramMap.get('walletId');
    if (routeId) {
      this.loadById(routeId);
      return;
    }

    // Obtener wallet por el email del usuario autenticado
    const email = this.authService.getEmail();
    if (email) {
      this.walletService.getWalletByEmail(email).subscribe({
        next: (data) => { this.wallet.set(data); this.loading.set(false); },
        error: () => {
          this.error.set('No se encontró una wallet asociada a tu cuenta.');
          this.loading.set(false);
        },
      });
    } else {
      this.error.set('No se pudo obtener el usuario autenticado.');
      this.loading.set(false);
    }
  }

  private loadById(id: string): void {
    this.walletService.getWallet(id).subscribe({
      next: (data) => { this.wallet.set(data); this.loading.set(false); },
      error: () => {
        this.error.set('No se pudo cargar la wallet. Verifique el ID o su conexión.');
        this.loading.set(false);
      },
    });
  }
}
