import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
}
