import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  template: `
    <div class="callback-wrap">
      @if (error()) {
        <p class="error-text">{{ error() }}</p>
        <button (click)="goToLogin()">Volver al inicio</button>
      } @else {
        <div class="spinner"></div>
        <p>Completando inicio de sesión...</p>
      }
    </div>
  `,
  styles: [`
    .callback-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Segoe UI', system-ui, sans-serif;
      gap: 16px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e0e0e0;
      border-top-color: #0078d4;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-text { color: #d13438; margin: 0; }
    p { color: #555; margin: 0; }
    button {
      padding: 8px 20px;
      border: 1px solid #0078d4;
      color: #0078d4;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.95rem;
    }
    button:hover { background: #0078d4; color: white; }
  `],
})
export class AuthCallback implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  error = signal('');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const params = this.route.snapshot.queryParamMap;
    const errorParam = params.get('error');

    if (errorParam) {
      this.error.set(params.get('error_description') ?? errorParam);
      return;
    }

    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.handleCallback(code, state).subscribe({
      next: (token) => {
        this.authService.saveToken(token);
        const roles = this.authService.getRoles();
        if (roles.includes('User-App')) {
          this.router.navigate(['/user-wallet']);
        } else {
          this.error.set(`Acceso denegado. Tu rol actual es: ${roles.join(', ') || 'ninguno'}. Se requiere el rol 'User-App'.`);
        }
      },
      error: (err: { message?: string; error?: { error?: string; error_description?: string }; status?: number }) => {
        const desc = err.error?.error_description ?? err.error?.error ?? err.message ?? 'Error desconocido';
        this.error.set(`[${err.status ?? ''}] ${desc}`);
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
