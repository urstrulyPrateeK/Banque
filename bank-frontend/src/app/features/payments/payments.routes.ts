import { Routes } from '@angular/router';

export const PAYMENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/payment-list/payment-list.component').then(
                (m) => m.PaymentListComponent
            ),
        title: 'Payments - Banque',
    },
    {
        path: ':id/receipt',
        loadComponent: () =>
            import('./components/payment-receipt/payment-receipt.component').then(
                (m) => m.PaymentReceiptComponent
            ),
        title: 'Payment Receipt - Banque',
    },
];

