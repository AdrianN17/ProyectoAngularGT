import { Component, Input, OnInit, signal, inject, computed } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RechargeService, RechargeSchemaResponse } from './recharge.service';
import { ToastService } from '../../../services/toast.service';

type SortField = keyof RechargeSchemaResponse | '';
type SortDir   = 'asc' | 'desc';

@Component({
  selector: 'app-recharge-list',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './recharge-list.html',
  styleUrl: './recharge-list.css',
})
export class RechargeList implements OnInit {
  @Input({ required: true }) walletId!: string;

  private readonly rechargeService = inject(RechargeService);
  private readonly toastService    = inject(ToastService);

  recharges   = signal<RechargeSchemaResponse[]>([]);
  loading     = signal(true);
  error       = signal('');

  searchTerm  = signal('');
  currentPage = signal(1);
  readonly pageSize = 10;

  sortField = signal<SortField>('CreatedAt');
  sortDir   = signal<SortDir>('desc');

  sorted = computed(() => {
    const field = this.sortField() as keyof RechargeSchemaResponse;
    const dir   = this.sortDir();
    const list  = [...this.recharges()];
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
    return this.sorted().filter(r =>
      r.RechargeId.toLowerCase().includes(term) ||
      r.Currency.toLowerCase().includes(term)   ||
      r.MethodType.toLowerCase().includes(term)
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

  ngOnInit(): void {
    this.rechargeService.getRecharges(this.walletId).subscribe({
      next: (data) => {
        this.recharges.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las recargas.');
        this.loading.set(false);
        this.toastService.show('Error al cargar las recargas', 'error');
      },
    });
  }
}

