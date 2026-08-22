import { Component, signal, inject, output, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { WalletService } from '../../../services/wallet.service';
import { TransactionService } from '../../../services/transaction.service';
import { ReceiptService } from '../../../core/receipt.service';
import { WalletInfo } from '../wallet-info/wallet-info';
import { WalletResponse } from '../../../models/wallet.model';
import { TransactionResponse } from '../../../models/transaction.model';
import { Currency } from '../../../models/currency.enum';

/** Validador personalizado: el valor debe ser un UUID v4 válido */
function uuidValidator(control: AbstractControl): ValidationErrors | null {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!control.value) return null;
  return UUID_RE.test(control.value.trim()) ? null : { invalidUuid: true };
}

@Component({
  selector: 'app-transaction-create',
  imports: [ReactiveFormsModule, WalletInfo],
  templateUrl: './transaction-create.html',
  styleUrl: './transaction-create.css',
})
export class TransactionCreate implements OnInit {
  private readonly authService     = inject(AuthService);
  private readonly toastService    = inject(ToastService);
  private readonly walletService   = inject(WalletService);
  private readonly transactionService = inject(TransactionService);
  private readonly receiptService  = inject(ReceiptService);
  private readonly fb              = inject(FormBuilder);
  private readonly platformId      = inject(PLATFORM_ID);

  private readonly selfTransferValidator: ValidatorFn = (ctrl: AbstractControl) => {
    if (!ctrl.value || !this.fromWalletId()) return null;
    return ctrl.value.trim() === this.fromWalletId() ? { selfTransfer: true } : null;
  };

  private get sourceType(): string {
    if (!isPlatformBrowser(this.platformId)) return 'WEB';
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? 'APP' : 'WEB';
  }

  closed  = output<void>();
  success = output<void>();

  toWalletIdForLookup = signal('');
  fromWalletId        = signal('');
  fromWallet          = signal<WalletResponse | null>(null);
  toWallet            = signal<WalletResponse | null>(null);
  walletReady         = signal(false);
  submitting          = signal(false);

  readonly currencies = [Currency.PEN, Currency.USD];

  private lastSubmittedHash = '';

  ngOnInit(): void {
    const email = this.authService.getEmail();
    if (!email) return;
    this.walletService.getWalletByEmail(email).subscribe({
      next: (wallet) => { this.fromWalletId.set(wallet.WalletId); this.fromWallet.set(wallet); },
      error: () => this.toastService.show('No se pudo cargar tu wallet de origen', 'error'),
    });
  }

  form = this.fb.group({
    ToWalletId: ['', [Validators.required, uuidValidator, this.selfTransferValidator]],
    Amount:     [{ value: null as number | null, disabled: true }, [Validators.required, Validators.min(0.01)]],
    Currency:   [{ value: Currency.PEN, disabled: true }, Validators.required],
  });

  onToWalletIdInput(): void {
    const val = this.form.get('ToWalletId')!.value ?? '';
    this.toWalletIdForLookup.set(val.trim());
    this.walletReady.set(false);
    this.toWallet.set(null);
    this.form.get('Amount')?.disable();
    this.form.get('Amount')?.setValue(null);
    this.form.get('Currency')?.disable();
    this.form.get('Currency')?.setValue(Currency.PEN);
  }

  onWalletLoaded(wallet: WalletResponse | null): void {
    this.walletReady.set(!!wallet);
    this.toWallet.set(wallet);
    if (wallet) {
      this.form.get('Amount')?.enable();
      this.form.get('Currency')?.enable();
      const walletCurrency = (wallet.Currency as Currency) === Currency.USD ? Currency.USD : Currency.PEN;
      this.form.get('Currency')?.setValue(walletCurrency);
    } else {
      this.form.get('Amount')?.disable();
      this.form.get('Amount')?.setValue(null);
      this.form.get('Currency')?.disable();
      this.form.get('Currency')?.setValue(Currency.PEN);
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
    if (this.form.invalid || !this.walletReady() || !this.fromWalletId() || this.submitting()) return;

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

    this.transactionService.createTransaction(
      {
        FromWalletId: this.fromWalletId(),
        ToWalletId:   raw.ToWalletId!,
        Amount:       raw.Amount!,
        Currency:     raw.Currency!,
        SourceType:   this.sourceType,
      },
      this.generateUUID(),
    ).subscribe({
      next: (tx: TransactionResponse) => {
        this.submitting.set(false);
        this.toastService.show('Transferencia procesada con éxito', 'success');
        const from = this.fromWallet();
        const to   = this.toWallet();
        this.receiptService.download({
          paymentId:    tx?.PaymentId    ?? this.generateUUID(),
          amount:       raw.Amount!,
          currency:     raw.Currency!,
          fromWalletId: this.fromWalletId(),
          fromName:     from ? `${from.Name} ${from.LastName}` : this.fromWalletId(),
          toWalletId:   raw.ToWalletId!,
          toName:       to   ? `${to.Name} ${to.LastName}`     : raw.ToWalletId!,
          createdAt:    tx?.CreatedAt   ?? new Date().toISOString(),
        });
        this.success.emit();
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.show('Error al realizar la transferencia', 'error');
      },
    });
  }
}
