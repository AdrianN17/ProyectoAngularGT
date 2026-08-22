import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { API_BASE } from '../core/api.config';
import { RechargeResponse, CreateRechargeRequest } from '../models/recharge.model';

@Injectable({ providedIn: 'root' })
export class RechargeService {
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

  getRecharges(walletId: string): Observable<RechargeResponse[]> {
    return this.http.get<RechargeResponse[]>(
      `${this.apiUrl}/Recharges/wallet/${walletId}`,
      { headers: this.authHeaders }
    );
  }

  createRecharge(body: CreateRechargeRequest, idempotencyKey: string): Observable<RechargeResponse> {
    return this.http.post<RechargeResponse>(
      `${this.apiUrl}/recharges`,
      body,
      { headers: this.jsonHeaders(idempotencyKey) }
    );
  }

  deleteRecharge(rechargeId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/Recharges/${rechargeId}`,
      { headers: this.authHeaders }
    );
  }
}
