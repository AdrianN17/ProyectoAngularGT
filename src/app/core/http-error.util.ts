import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../services/toast.service';

/**
 * Para errores 400 muestra:
 *   - Un toast con "title: detail" si están presentes.
 *   - Un toast adicional por cada mensaje en el objeto `errors` (errores de campo).
 * Para cualquier otro error muestra el mensaje de fallback.
 */
export function showHttpErrors(err: unknown, toastService: ToastService, fallback: string): void {
  if (err instanceof HttpErrorResponse && err.status === 400) {
    const body = err.error;
    if (body && typeof body === 'object') {
      const title  = typeof body['title']  === 'string' ? body['title']  : '';
      const detail = typeof body['detail'] === 'string' ? body['detail'] : '';

      // Toast principal con title + detail
      if (title || detail) {
        const main = title && detail ? `${title}: ${detail}` : (title || detail);
        toastService.show(main, 'error');
      }

      // Un toast por cada error de campo
      const errors = body['errors'];
      if (errors && typeof errors === 'object') {
        for (const field of Object.keys(errors)) {
          const messages: unknown[] = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
          for (const msg of messages) {
            if (typeof msg === 'string') {
              toastService.show(`${field}: ${msg}`, 'error');
            }
          }
        }
      }
      return;
    }
  }
  toastService.show(fallback, 'error');
}

