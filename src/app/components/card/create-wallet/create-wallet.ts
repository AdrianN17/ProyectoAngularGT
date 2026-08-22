import { Component, output, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { WalletService } from '../../../services/wallet.service';
import { ToastService } from '../../../services/toast.service';
import { CreateWalletRequest } from '../../../models/wallet.model';
import { Currency } from '../../../models/currency.enum';
import { DocumentType } from '../../../models/document-type.enum';

/** Validador personalizado: solo dígitos, 6–12 caracteres */
function documentNumberValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return /^\d{6,12}$/.test(control.value) ? null : { invalidDocument: true };
}

/** Validador personalizado: límite diario entre 1 y 100 000 */
function dailyLimitValidator(control: AbstractControl): ValidationErrors | null {
  const v = Number(control.value);
  if (isNaN(v)) return { invalidLimit: true };
  return v >= 1 && v <= 100_000 ? null : { invalidLimit: true };
}

@Component({
  selector: 'app-create-wallet',
  imports: [ReactiveFormsModule],
  templateUrl: './create-wallet.html',
  styleUrl: './create-wallet.css',
})
export class CreateWallet {
  private readonly walletService = inject(WalletService);
  private readonly toastService  = inject(ToastService);
  private readonly fb            = inject(FormBuilder);

  closed  = output<void>();
  created = output<void>();

  submitting = false;

  readonly currencies    = Object.values(Currency);
  readonly documentTypes = Object.values(DocumentType);

  form = this.fb.group({
    Name:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    LastName:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    DocumentType:   [DocumentType.DNI, Validators.required],
    DocumentNumber: ['', [Validators.required, documentNumberValidator]],
    Email:          ['', [Validators.required, Validators.email]],
    Phone:          ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,20}$/)]],
    Currency:       [Currency.PEN, Validators.required],
    DailyLimit:     [500, [Validators.required, dailyLimitValidator]],
  });

  fieldError(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl?.invalid || !ctrl.touched) return '';
    if (ctrl.hasError('required'))        return 'Campo obligatorio.';
    if (ctrl.hasError('minlength'))       return `Mínimo ${ctrl.getError('minlength').requiredLength} caracteres.`;
    if (ctrl.hasError('maxlength'))       return `Máximo ${ctrl.getError('maxlength').requiredLength} caracteres.`;
    if (ctrl.hasError('email'))           return 'Correo electrónico inválido.';
    if (ctrl.hasError('pattern'))         return 'Formato inválido.';
    if (ctrl.hasError('invalidDocument')) return 'Solo dígitos, entre 6 y 12 caracteres.';
    if (ctrl.hasError('invalidLimit'))    return 'Debe ser un valor entre 1 y 100,000.';
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
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;

    this.walletService.createWallet(this.form.value as CreateWalletRequest, this.generateUUID()).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.show('Wallet creada correctamente', 'success');
        this.created.emit();
        this.closed.emit();
      },
      error: () => {
        this.submitting = false;
        this.toastService.show('Error al crear la wallet', 'error');
      },
    });
  }
}
