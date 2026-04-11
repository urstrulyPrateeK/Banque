import { Routes } from '@angular/router';

export const TRANSFER_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/transfer-list/transfer-list.component').then(m => m.TransferListComponent),
        title: 'Transfers - SecureBank'
    },
    {
        path: 'create',
        loadComponent: () => import('./components/transfer-create/transfer-create.component').then(m => m.TransferCreateComponent),
        title: 'Create Transfer - SecureBank'
    },
    {
        path: ':id/receipt',
        loadComponent: () => import('./components/transfer-receipt/transfer-receipt.component').then(m => m.TransferReceiptComponent),
        title: 'Transfer Receipt - SecureBank'
    }
];
