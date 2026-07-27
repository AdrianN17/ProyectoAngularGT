import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { AuthCallback } from './components/auth-callback/auth-callback';
import { UserWallet } from './components/user-wallet/user-wallet';
import { Shell } from './components/layout/shell/shell';
import { NotFound } from './components/not-found/not-found';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login',          component: Login },
  { path: 'auth/callback',  component: AuthCallback },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'user-wallet/:walletId', component: UserWallet },
      { path: 'user-wallet',           component: UserWallet },
      { path: '',                      redirectTo: 'user-wallet', pathMatch: 'full' },
    ],
  },
  { path: '**', component: NotFound },
];
