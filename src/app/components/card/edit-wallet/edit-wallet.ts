import { Component, OnInit, input, output, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { WalletService } from '../../../services/wallet.service';
import { DocumentType } from '../../../models/document-type.enum';
import { WalletResponse, UpdateWalletRequest } from '../../../models/wallet.model';
import { showHttpErrors } from '../../../core/http-error.util';

function documentNumberValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return /^\d{6,12}$/.test(control.value) ? null : { invalidDocument: true };
}

function dailyLimitValidator(control: AbstractControl): ValidationErrors | null {
  const v = Number(control.value);
  if (isNaN(v)) return { invalidLimit: true };
  return v >= 1 && v <= 100_000 ? null : { invalidLimit: true };
}

@Component({
  selector: 'app-edit-wallet',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-wallet.html',
  styleUrl: './edit-wallet.css',
})
export class EditWallet implements OnInit {
  wallet = input.required<WalletResponse>();

  private readonly walletService = inject(WalletService);
  private readonly toastService  = inject(ToastService);
  private readonly fb            = inject(FormBuilder);

  closed  = output<void>();
  updated = output<WalletResponse>();

  submitting = false;

  readonly documentTypes = Object.values(DocumentType);

  form = this.fb.group({
    Name:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    LastName:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    DocumentType:   ['', Validators.required],
    DocumentNumber: ['', [Validators.required, documentNumberValidator]],
    Email:          ['', [Validators.required, Validators.email]],
    Phone:          ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,20}$/)]],
    DailyLimit:     [500, [Validators.required, dailyLimitValidator]],
  });

  ngOnInit(): void {
    this.form.patchValue({
      Name:           this.wallet().Name,
      LastName:       this.wallet().LastName,
      DocumentType:   this.wallet().DocumentType,
      DocumentNumber: this.wallet().DocumentNumber,
      Email:          this.wallet().Email,
      Phone:          this.wallet().Phone,
      DailyLimit:     this.wallet().DailyLimit,
    });
  }

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

  private buildPatchBody(): Record<string, unknown> {
    const fields = ['Name', 'LastName', 'DocumentType', 'DocumentNumber', 'Email', 'Phone', 'DailyLimit'] as const;
    const patch: Record<string, unknown> = {};
    for (const field of fields) {
      const ctrl = this.form.get(field);
      if (ctrl?.dirty) patch[field] = ctrl.value;
    }
    return patch;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting) return;

    const patch = this.buildPatchBody();
    if (Object.keys(patch).length === 0) {
      this.toastService.show('No hay cambios para guardar', 'error');
      return;
    }

    this.submitting = true;

    this.walletService.updateWallet(this.wallet().WalletId, patch as UpdateWalletRequest).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.show('Wallet actualizada correctamente', 'success');
        this.updated.emit({ ...this.wallet(), ...patch } as WalletResponse);
        this.closed.emit();
      },
      error: (err) => {
        this.submitting = false;
        showHttpErrors(err, this.toastService, 'Error al actualizar la wallet');
      },
    });
  }
}
