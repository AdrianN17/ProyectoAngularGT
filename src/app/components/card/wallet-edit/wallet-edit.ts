import { Component, Input, OnInit, output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WalletService, WalletSchemaResponse } from '../../../services/wallet.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-wallet-edit',
  imports: [ReactiveFormsModule],
  templateUrl: './wallet-edit.html',
  styleUrl: './wallet-edit.css',
})
export class WalletEdit implements OnInit {
  @Input({ required: true }) wallet!: WalletSchemaResponse;
  closed  = output<void>();
  updated = output<WalletSchemaResponse>();

  private readonly walletService = inject(WalletService);
  private readonly toastService  = inject(ToastService);
  private readonly fb            = inject(FormBuilder);

  submitting = false;

  form = this.fb.group({
    Name:       ['', [Validators.required, Validators.minLength(2)]],
    LastName:   ['', [Validators.required, Validators.minLength(2)]],
    Email:      ['', [Validators.required, Validators.email]],
    Phone:      ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()\u002B]{7,20}$/)]],
    DailyLimit: [0,  [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.form.patchValue({
      Name:       this.wallet.Name,
      LastName:   this.wallet.LastName,
      Email:      this.wallet.Email,
      Phone:      this.wallet.Phone,
      DailyLimit: this.wallet.DailyLimit,
    });
  }

  fieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.invalid || !ctrl.touched) return '';
    if (ctrl.hasError('required'))  return 'Campo obligatorio.';
    if (ctrl.hasError('minlength')) return `Mínimo ${ctrl.getError('minlength').requiredLength} caracteres.`;
    if (ctrl.hasError('email'))     return 'Correo electrónico inválido.';
    if (ctrl.hasError('pattern'))   return 'Formato de teléfono inválido.';
    if (ctrl.hasError('min'))       return 'Debe ser mayor a 0.';
    return '';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;

    const patch = this.form.value as Partial<WalletSchemaResponse>;
    this.walletService.updateWallet(this.wallet.WalletId, patch).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.show('Wallet actualizada correctamente', 'success');
        this.updated.emit({ ...this.wallet, ...patch });
        this.closed.emit();
      },
      error: () => {
        this.submitting = false;
        this.toastService.show('Error al actualizar la wallet', 'error');
      },
    });
  }
}
