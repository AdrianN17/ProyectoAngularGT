import { Component, signal, inject, output } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { WalletInfo } from '../wallet-info/wallet-info';
import { WalletSchemaResponse } from '../../../services/wallet.service';
import { API_BASE } from '../../../core/api.config';
import { SourceType } from '../../../models/source-type.enum';

const FROM_WALLET_ID = '9afc4154-5cf6-4ffc-b946-a0c5eae4a4ec';

/** Validador personalizado: el valor debe ser un UUID v4 válido */
function uuidValidator(control: AbstractControl): ValidationErrors | null {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!control.value) return null;
  return UUID_RE.test(control.value.trim()) ? null : { invalidUuid: true };
}

/** Validador personalizado: no se puede transferir a la propia wallet */
function noSelfTransferValidator(fromId: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return control.value.trim() === fromId ? { selfTransfer: true } : null;
  };
}

@Component({
  selector: 'app-transaction-create',
  imports: [ReactiveFormsModule, WalletInfo],
  templateUrl: './transaction-create.html',
  styleUrl: './transaction-create.css',
})
export class TransactionCreate {
  private readonly http         = inject(HttpClient);
  private readonly authService  = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly fb           = inject(FormBuilder);

  closed  = output<void>();
  success = output<void>();

  toWalletIdForLookup = signal('');
  currency            = signal('');
  walletReady         = signal(false);
  submitting          = signal(false);

  readonly sourceTypes = Object.values(SourceType);

  private lastSubmittedHash = '';

  form = this.fb.group({
    ToWalletId: ['', [Validators.required, uuidValidator, noSelfTransferValidator(FROM_WALLET_ID)]],
    Amount:     [{ value: null as number | null, disabled: true }, [Validators.required, Validators.min(0.01)]],
    SourceType: [SourceType.APP, Validators.required],
  });

  onToWalletIdInput(): void {
    const val = this.form.get('ToWalletId')!.value ?? '';
    this.toWalletIdForLookup.set(val.trim());
    this.walletReady.set(false);
    this.currency.set('');
    this.form.get('Amount')?.disable();
    this.form.get('Amount')?.setValue(null);
  }

  onWalletLoaded(wallet: WalletSchemaResponse | null): void {
    this.walletReady.set(!!wallet);
    this.currency.set(wallet?.Currency ?? '');
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
    if (ctrl.hasError('required'))     return 'Campo obligatorio.';
    if (ctrl.hasError('invalidUuid'))  return 'Ingrese un UUID de wallet válido.';
    if (ctrl.hasError('selfTransfer')) return 'No puede transferir a su propia wallet.';
    if (ctrl.hasError('min'))          return 'El monto debe ser mayor a 0.';
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
    const hash = `${raw.ToWalletId}-${raw.Amount}`;
    if (hash === this.lastSubmittedHash) {
      this.toastService.show('Esta transferencia ya fue enviada recientemente. Espere antes de reintentar.', 'error');
      return;
    }

    this.submitting.set(true);
    this.lastSubmittedHash = hash;
    setTimeout(() => { this.lastSubmittedHash = ''; }, 30_000);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json',
      'idempotency-key': this.generateUUID(),
    });

    const body = {
      FromWalletId: FROM_WALLET_ID,
      ToWalletId:   raw.ToWalletId,
      Amount:       raw.Amount,
      Currency:     this.currency(),
      SourceType:   raw.SourceType,
    };

    this.http.post(`${API_BASE.transaction}/Transactions`, body, { headers }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.show('Transferencia procesada con éxito', 'success');
        this.success.emit();
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.show('Error al realizar la transferencia', 'error');
      },
    });
  }
}
