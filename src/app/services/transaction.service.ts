import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { API_BASE } from '../core/api.config';
import { TransactionResponse, CreateTransactionRequest } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl      = API_BASE.transaction;

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private jsonHeaders(idempotencyKey?: string): HttpHeaders {
    const h: Record<string, string> = {
      Authorization:  `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) h['idempotency-key'] = idempotencyKey;
    return new HttpHeaders(h);
  }

  getTransactions(walletId: string): Observable<TransactionResponse[]> {
    return this.http.get<TransactionResponse[]>(
      `${this.apiUrl}/transactions/wallet/${walletId}`,
      { headers: this.authHeaders }
    );
  }

  createTransaction(body: CreateTransactionRequest, idempotencyKey: string): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(
      `${this.apiUrl}/Transactions`,
      body,
      { headers: this.jsonHeaders(idempotencyKey) }
    );
  }

  deleteTransaction(paymentId: string, body: CreateTransactionRequest): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/transactions/${paymentId}`,
      { headers: this.jsonHeaders(), body }
    );
  }
}
