import { Component, Input, OnInit, signal, inject, output } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { WalletInfo } from '../wallet-info/wallet-info';
import { WalletSchemaResponse } from '../../../services/wallet.service';
import { API_BASE } from '../../../core/api.config';
import { ReceiptService } from '../../../core/receipt.service';
import { RechargeSchemaResponse } from '../recharge-list/recharge.service';

/** Validador personalizado: el valor debe ser un UUID v4 válido */
function uuidValidator(control: AbstractControl): ValidationErrors | null {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!control.value) return null;
  return UUID_RE.test(control.value.trim()) ? null : { invalidUuid: true };
}

@Component({
  selector: 'app-recharge-create',
  imports: [ReactiveFormsModule, WalletInfo],
  templateUrl: './recharge-create.html',
  styleUrl: './recharge-create.css',
})
export class RechargeCreate implements OnInit {
  private readonly http          = inject(HttpClient);
  private readonly authService   = inject(AuthService);
  private readonly toastService  = inject(ToastService);
  private readonly receiptService = inject(ReceiptService);
  private readonly fb            = inject(FormBuilder);

  @Input() preselectedWalletId?: string;

  closed  = output<void>();
  success = output<void>();

  walletIdForLookup = signal('');
  currency          = signal('');
  loadedWallet      = signal<WalletSchemaResponse | null>(null);
  walletReady       = signal(false);
  submitting        = signal(false);
  preselected       = signal(false);

  private lastSubmittedHash = '';

  form = this.fb.group({
    WalletId: ['', [Validators.required, uuidValidator]],
    Amount:   [{ value: null as number | null, disabled: true }, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    if (this.preselectedWalletId) {
      this.preselected.set(true);
      this.form.get('WalletId')?.setValue(this.preselectedWalletId);
      this.form.get('WalletId')?.disable();
      this.walletIdForLookup.set(this.preselectedWalletId);
    }
  }

  onWalletIdInput(): void {
    const val = this.form.get('WalletId')!.value ?? '';
    this.walletIdForLookup.set(val.trim());
    this.walletReady.set(false);
    this.currency.set('');
    this.loadedWallet.set(null);
    this.form.get('Amount')?.disable();
    this.form.get('Amount')?.setValue(null);
  }

  onWalletLoaded(wallet: WalletSchemaResponse | null): void {
    this.walletReady.set(!!wallet);
    this.currency.set(wallet?.Currency ?? '');
    this.loadedWallet.set(wallet);
    if (wallet) {
      this.form.get('Amount')?.enable();
    } else {
      this.form.get('Amount')?.disable();
      this.form.get('Amount')?.setValue(null);
    }
  }

  fieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.invalid || !ctrl.touched) return '';
    if (ctrl.hasError('required'))    return 'Campo obligatorio.';
    if (ctrl.hasError('invalidUuid')) return 'Ingrese un UUID de wallet válido.';
    if (ctrl.hasError('min'))         return 'El monto debe ser mayor a 0.';
    return '';
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.walletReady() || !this.currency() || this.submitting()) return;

    const raw = this.form.getRawValue();

    // Validación de duplicados: misma wallet + mismo monto en menos de 30 segundos
    const hash = `${raw.WalletId}-${raw.Amount}`;
    if (hash === this.lastSubmittedHash) {
      this.toastService.show('Esta recarga ya fue enviada recientemente. Espere antes de reintentar.', 'error');
      return;
    }

    this.submitting.set(true);
    this.lastSubmittedHash = hash;
    setTimeout(() => { this.lastSubmittedHash = ''; }, 30_000);

    const headers = new HttpHeaders({
      Authorization:    `Bearer ${this.authService.getToken()}`,
      'Content-Type':   'application/json',
      'idempotency-key': this.generateUUID(),
    });

    const body = {
      WalletId:   raw.WalletId,
      Amount:     raw.Amount,
      Currency:   this.currency(),
      MethodType: 'TIENDA',
    };

    this.http.post<RechargeSchemaResponse>(`${API_BASE.transaction}/recharges`, body, { headers }).subscribe({
      next: (r) => {
        this.submitting.set(false);
        this.toastService.show('Recarga procesada con éxito', 'success');
        const w = this.loadedWallet();
        this.receiptService.downloadRecharge({
          rechargeId: r?.RechargeId  ?? this.generateUUID(),
          amount:     raw.Amount!,
          currency:   this.currency(),
          walletId:   raw.WalletId!,
          walletName: w ? `${w.Name} ${w.LastName}` : raw.WalletId!,
          createdAt:  r?.CreatedAt   ?? new Date().toISOString(),
        });
        this.success.emit();
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.show('Error al procesar la recarga', 'error');
      },
    });
  }
}
