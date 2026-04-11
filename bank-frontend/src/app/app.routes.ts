import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
    // Public routes - no authentication required (must come first)
    {
        path: '',
        loadChildren: () =>
            import('./features/public/public.routes').then((m) => m.PUBLIC_ROUTES),
    },
    {
        path: 'auth',
        loadChildren: () =>
            import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
    },
    // Authenticated routes - protected by guard, shared layout
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('@layout/components/main-layout/main-layout.component').then(
                (m) => m.MainLayoutComponent
            ),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('@features/dashboard/components/dashboard/dashboard.component').then(
                        (m) => m.DashboardComponent
                    ),
                title: 'Dashboard - SecureBank',
            },
            {
                path: 'accounts',
                loadChildren: () =>
                    import('./features/accounts/accounts.routes').then((m) => m.ACCOUNT_ROUTES),
            },
            {
                path: 'transactions',
                loadChildren: () =>
                    import('./features/transactions/transactions.routes').then(
                        (m) => m.TRANSACTION_ROUTES
                    ),
            },
            {
                path: 'transfers',
                loadChildren: () =>
                    import('./features/transfers/transfers.routes').then((m) => m.TRANSFER_ROUTES),
            },
            {
                path: 'payments',
                loadChildren: () =>
                    import('./features/payments/payments.routes').then(
                        (m) => m.PAYMENT_ROUTES
                    ),
            },
            {
                path: 'cards',
                loadChildren: () =>
                    import('./features/cards/cards.routes').then((m) => m.CARD_ROUTES),
            },
            {
                path: 'user',
                loadChildren: () =>
                    import('./features/user/user.routes').then((m) => m.USER_ROUTES),
            },
        ],
    },
    {
        path: '**',
        redirectTo: '',
    },
];
