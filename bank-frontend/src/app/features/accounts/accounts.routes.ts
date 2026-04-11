import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/account-list/account-list.component').then(m => m.AccountListComponent),
        title: 'My Accounts - SecureBank'
    },
    {
        path: 'new',
        loadComponent: () => import('./components/create-account/create-account.component').then(m => m.CreateAccountComponent),
        title: 'Create Account - SecureBank'
    },
    {
        path: ':id',
        loadComponent: () => import('./components/account-details/account-details.component').then(m => m.AccountDetailsComponent),
        title: 'Account Details - SecureBank'
    }
];
