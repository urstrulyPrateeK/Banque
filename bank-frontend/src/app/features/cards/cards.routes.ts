import { Routes } from '@angular/router';

export const CARD_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/card-list/card-list.component').then(
                (m) => m.CardListComponent
            ),
        title: 'Cards - Banque',
    },
];

