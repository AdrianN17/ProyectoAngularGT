import { Component, Input, OnInit, signal, inject, computed } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { TransactionService, TransactionSchemaResponse } from './transaction.service';
import { ToastService } from '../../../services/toast.service';
import { WalletService } from '../../../services/wallet.service';
import { ReceiptService } from '../../../core/receipt.service';

type SortField = keyof TransactionSchemaResponse | '';
type SortDir   = 'asc' | 'desc';

@Component({
  selector: 'app-transaction-list',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css',
})
export class TransactionList implements OnInit {
  @Input({ required: true }) walletId!: string;

  private readonly transactionService = inject(TransactionService);
  private readonly toastService        = inject(ToastService);
  private readonly walletService       = inject(WalletService);
  private readonly receiptService      = inject(ReceiptService);

  downloadingId = signal('');

  transactions = signal<TransactionSchemaResponse[]>([]);
  loading      = signal(true);
  error        = signal('');

  searchTerm  = signal('');
  currentPage = signal(1);
  readonly pageSize = 10;

  sortField = signal<SortField>('CreatedAt');
  sortDir   = signal<SortDir>('desc');

  sorted = computed(() => {
    const field = this.sortField() as keyof TransactionSchemaResponse;
    const dir   = this.sortDir();
    const list  = [...this.transactions()];
    if (!field) return list;
    return list.sort((a, b) => {
      const av = a[field] as string | number;
      const bv = b[field] as string | number;
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ?  1 : -1;
      return 0;
    });
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.sorted();
    return this.sorted().filter(tx =>
      tx.PaymentId.toLowerCase().includes(term)   ||
      tx.ToWalletId.toLowerCase().includes(term)  ||
      tx.Currency.toLowerCase().includes(term)    ||
      tx.SourceType.toLowerCase().includes(term)
    );
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  paged = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  setSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  setSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.currentPage.set(1);
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return '⇅';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }

  downloadReceipt(tx: TransactionSchemaResponse): void {
    if (this.downloadingId()) return;
    this.downloadingId.set(tx.PaymentId);
    forkJoin({
      from: this.walletService.getWallet(tx.FromWalletId),
      to:   this.walletService.getWallet(tx.ToWalletId),
    }).subscribe({
      next: ({ from, to }) => {
        this.downloadingId.set('');
        this.receiptService.download({
          paymentId:    tx.PaymentId,
          amount:       tx.Amount,
          currency:     tx.Currency,
          fromWalletId: tx.FromWalletId,
          fromName:     `${from.Name} ${from.LastName}`,
          toWalletId:   tx.ToWalletId,
          toName:       `${to.Name} ${to.LastName}`,
          createdAt:    tx.CreatedAt,
        });
      },
      error: () => {
        this.downloadingId.set('');
        this.toastService.show('No se pudo generar el comprobante', 'error');
      },
    });
  }

  ngOnInit(): void {
    this.transactionService.getTransactions(this.walletId).subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las transacciones.');
        this.loading.set(false);
        this.toastService.show('Error al cargar las transacciones', 'error');
      },
    });
  }
}

