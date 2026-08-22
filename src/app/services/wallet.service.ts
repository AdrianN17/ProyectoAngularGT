import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { API_BASE } from '../core/api.config';
import { WalletResponse, CreateWalletRequest, UpdateWalletRequest, ReplaceWalletRequest } from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl      = API_BASE.wallet;

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

  getWallet(walletId: string): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(
      `${this.apiUrl}/Wallets/${walletId}`,
      { headers: this.authHeaders }
    );
  }

  getWalletByEmail(email: string): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(
      `${this.apiUrl}/wallets/email/${encodeURIComponent(email)}`,
      { headers: this.authHeaders }
    );
  }

  createWallet(body: CreateWalletRequest, idempotencyKey: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/wallets`,
      body,
      { headers: this.jsonHeaders(idempotencyKey) }
    );
  }

  updateWallet(walletId: string, body: UpdateWalletRequest): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/Wallets/${walletId}`,
      body,
      { headers: this.jsonHeaders() }
    );
  }

  replaceWallet(walletId: string, body: ReplaceWalletRequest): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/Wallets/${walletId}`,
      body,
      { headers: this.jsonHeaders() }
    );
  }

  searchWallets(params: { documentType?: string; documentNumber?: string }): Observable<WalletResponse[]> {
    let httpParams = new HttpParams();
    if (params.documentType)   httpParams = httpParams.set('documentType',   params.documentType);
    if (params.documentNumber) httpParams = httpParams.set('documentNumber', params.documentNumber);
    return this.http.get<WalletResponse[]>(
      `${this.apiUrl}/Wallets`,
      { headers: this.authHeaders, params: httpParams }
    );
  }
}
