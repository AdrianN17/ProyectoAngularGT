import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { API_BASE } from '../../../core/api.config';

export interface RechargeSchemaResponse {
  RechargeId: string;
  WalletId: string;
  Amount: number;
  Currency: string;
  MethodType: string;
  CreatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class RechargeService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl      = API_BASE.transaction;

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getRecharges(walletId: string): Observable<RechargeSchemaResponse[]> {
    return this.http.get<RechargeSchemaResponse[]>(
      `${this.apiUrl}/Recharges/wallet/${walletId}`,
      { headers: this.authHeaders }
    );
  }

  deleteRecharge(rechargeId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/Recharges/${rechargeId}`,
      { headers: this.authHeaders }
    );
  }
}
