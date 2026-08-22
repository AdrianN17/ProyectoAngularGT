import { Component, Input, OnInit, signal, inject, computed } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { TransactionService } from '../../../services/transaction.service';
import { TransactionResponse } from '../../../models/transaction.model';
import { ToastService } from '../../../services/toast.service';
import { showHttpErrors } from '../../../core/http-error.util';

type SortField = keyof TransactionResponse | '';
type SortDir   = 'asc' | 'desc';

@Component({
  selector: 'app-transaction-list-delete',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './transaction-list-delete.html',
  styleUrl: './transaction-list-delete.css',
})
export class TransactionListDelete implements OnInit {
  @Input({ required: true }) walletId!: string;

  private readonly transactionService = inject(TransactionService);
  private readonly toastService       = inject(ToastService);

  transactions = signal<TransactionResponse[]>([]);
  loading      = signal(true);
  error        = signal('');

  searchTerm  = signal('');
  currentPage = signal(1);
  readonly pageSize = 10;

  sortField = signal<SortField>('CreatedAt');
  sortDir   = signal<SortDir>('desc');

  pendingDelete = signal<TransactionResponse | null>(null);
  deleting      = signal(false);

  sorted = computed(() => {
    const field = this.sortField() as keyof TransactionResponse;
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

  requestDelete(tx: TransactionResponse): void { this.pendingDelete.set(tx); }
  cancelDelete():  void { if (!this.deleting()) this.pendingDelete.set(null); }

  confirmDelete(): void {
    const tx = this.pendingDelete();
    if (!tx || this.deleting()) return;
    this.deleting.set(true);

    const body = {
      FromWalletId: tx.FromWalletId,
      ToWalletId:   tx.ToWalletId,
      Amount:       tx.Amount,
      Currency:     tx.Currency,
      SourceType:   tx.SourceType,
    };

    this.transactionService.deleteTransaction(tx.PaymentId, body).subscribe({
      next: () => {
        this.transactions.update(list => list.filter(t => t.PaymentId !== tx.PaymentId));
        this.toastService.show('Transacción eliminada correctamente', 'success');
        this.pendingDelete.set(null);
        this.deleting.set(false);
        if (this.currentPage() > this.totalPages()) this.currentPage.set(this.totalPages());
      },
      error: (err) => {
        showHttpErrors(err, this.toastService, 'Error al eliminar la transacción');
        this.deleting.set(false);
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
