import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return next(req);

  const auth   = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    tap({
      error: (err) => {
        if (err?.status === 401) {
          auth.logout();
          router.navigate(['/login']);
        }
      },
    })
  );
};
