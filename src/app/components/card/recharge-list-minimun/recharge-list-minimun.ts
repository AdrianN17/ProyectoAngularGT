import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RechargeService, RechargeSchemaResponse } from '../recharge-list/recharge.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-recharge-list-minimun',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './recharge-list-minimun.html',
  styleUrl: './recharge-list-minimun.css',
})
export class RechargeListMinimun implements OnInit {
  @Input({ required: true }) walletId!: string;

  private readonly rechargeService = inject(RechargeService);
  private readonly toastService    = inject(ToastService);

  recharges = signal<RechargeSchemaResponse[]>([]);
  loading   = signal(true);
  error     = signal('');

  ngOnInit(): void {
    this.rechargeService.getRecharges(this.walletId).subscribe({
      next: (data) => {
        const top3 = [...data]
          .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())
          .slice(0, 3);
        this.recharges.set(top3);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las recargas.');
        this.loading.set(false);
        this.toastService.show('Error al cargar las recargas recientes', 'error');
      },
    });
  }
}
