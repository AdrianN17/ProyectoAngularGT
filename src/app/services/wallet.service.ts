import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { API_BASE } from '../core/api.config';

export interface WalletSchemaResponse {
  WalletId: string;
  Name: string;
  LastName: string;
  DocumentNumber: string;
  DocumentType: string;
  Currency: string;
  Email: string;
  Phone: string;
  DailyLimit: number;
  balanceAmount: number;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl      = API_BASE.wallet;

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getWallet(walletId: string): Observable<WalletSchemaResponse> {
    return this.http.get<WalletSchemaResponse>(
      `${this.apiUrl}/Wallets/${walletId}`,
      { headers: this.authHeaders }
    );
  }

  getWalletByEmail(email: string): Observable<WalletSchemaResponse> {
    return this.http.get<WalletSchemaResponse>(
      `${this.apiUrl}/wallets/email/${encodeURIComponent(email)}`,
      { headers: this.authHeaders }
    );
  }

  updateWallet(walletId: string, body: Partial<WalletSchemaResponse>): Observable<void> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json',
    });
    return this.http.patch<void>(
      `${this.apiUrl}/Wallets/${walletId}`,
      body,
      { headers }
    );
  }

  /** PUT: reemplazo completo de todos los campos editables de la wallet */
  replaceWallet(
    walletId: string,
    body: Pick<WalletSchemaResponse, 'Name' | 'LastName' | 'DocumentType' | 'DocumentNumber' | 'Email' | 'Phone' | 'DailyLimit'>
  ): Observable<void> {
    const headers = new HttpHeaders({
      Authorization:  `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json',
    });
    return this.http.put<void>(`${this.apiUrl}/Wallets/${walletId}`, body, { headers });
  }

  /** GET con query params: búsqueda de wallets por tipo y número de documento */
  searchWallets(params: { documentType?: string; documentNumber?: string }): Observable<WalletSchemaResponse[]> {
    let httpParams = new HttpParams();
    if (params.documentType)   httpParams = httpParams.set('documentType',   params.documentType);
    if (params.documentNumber) httpParams = httpParams.set('documentNumber', params.documentNumber);
    return this.http.get<WalletSchemaResponse[]>(
      `${this.apiUrl}/Wallets`,
      { headers: this.authHeaders, params: httpParams }
    );
  }
}
