import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { API_BASE } from '../../../core/api.config';

export interface TransactionSchemaResponse {
  PaymentId: string;
  FromWalletId: string;
  ToWalletId: string;
  Amount: number;
  Currency: string;
  SourceType: string;
  CreatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl      = API_BASE.transaction;

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getTransactions(walletId: string): Observable<TransactionSchemaResponse[]> {
    return this.http.get<TransactionSchemaResponse[]>(
      `${this.apiUrl}/transactions/wallet/${walletId}`,
      { headers: this.authHeaders }
    );
  }

  deleteTransaction(
    paymentId: string,
    body: { FromWalletId: string; ToWalletId: string; Amount: number; Currency: string; SourceType: string }
  ): Observable<void> {
    const headers = new HttpHeaders({
      Authorization:  `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json',
    });
    return this.http.delete<void>(
      `${this.apiUrl}/transactions/${paymentId}`,
      { headers, body }
    );
  }
}
