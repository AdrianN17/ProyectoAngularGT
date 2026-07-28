import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';

const TENANT_ID = 'bbcf0814-0ddf-45e8-9081-46f4f44e31ac';
const CLIENT_ID = '69ef10ea-bea1-4e75-8bed-2d536321de91';
const SCOPE = 'api://69ef10ea-bea1-4e75-8bed-2d536321de91/user_impersonation openid profile offline_access';
const TOKEN_KEY = 'auth_access_token';
const CALLBACK_PATH = '/auth/callback';
const MS_TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly doc = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

  private get ss(): Storage | null {
    return isPlatformBrowser(this.platformId) ? sessionStorage : null;
  }

  private get redirectUri(): string {
    return `${this.doc.location.origin}${CALLBACK_PATH}`;
  }

  async login(): Promise<void> {
    const verifier = this.generateVerifier();
    const challenge = await this.generateChallenge(verifier);
    const state = this.generateState();

    this.ss?.setItem('pkce_verifier', verifier);
    this.ss?.setItem('oauth_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: this.redirectUri,
      scope: SCOPE,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });

    this.doc.location.href =
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params}`;
  }

  handleCallback(code: string, state: string): Observable<TokenResponse> {
    const storedState = this.ss?.getItem('oauth_state') ?? null;
    const verifier = this.ss?.getItem('pkce_verifier') ?? null;

    this.ss?.removeItem('oauth_state');
    this.ss?.removeItem('pkce_verifier');

    if (!verifier || state !== storedState) {
      return throwError(() => new Error('Estado inválido — posible ataque CSRF'));
    }

    const body = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('client_id', CLIENT_ID)
      .set('code', code)
      .set('redirect_uri', this.redirectUri)
      .set('code_verifier', verifier);

    return this.http.post<TokenResponse>(MS_TOKEN_URL, body.toString(), {
      headers: this.headers,
    });
  }

  saveToken(token: TokenResponse): void {
    this.ss?.setItem(TOKEN_KEY, token.access_token);
  }

  getToken(): string | null {
    return this.ss?.getItem(TOKEN_KEY) ?? null;
  }

  isAuthenticated(): boolean {
    return !!(this.ss?.getItem(TOKEN_KEY));
  }

  logout(): void {
    this.ss?.removeItem(TOKEN_KEY);
  }

  getRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return Array.isArray(decoded['roles']) ? decoded['roles'] : [];
    } catch {
      return [];
    }
  }

  getEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded['preferred_username'] ?? decoded['email'] ?? null;
    } catch {
      return null;
    }
  }

  private generateVerifier(): string {
    const array = new Uint8Array(48);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private async generateChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }
}
