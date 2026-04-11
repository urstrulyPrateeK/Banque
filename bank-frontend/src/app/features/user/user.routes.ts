import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
    },
    {
        path: 'profile',
        loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
        title: 'My Profile - Banque'
    },
    {
        path: 'settings',
        loadComponent: () => import('./components/settings/user-settings.component').then(m => m.UserSettingsComponent),
        title: 'Settings - Banque'
    },
    {
        path: 'activity',
        loadComponent: () => import('./components/activity-log/activity-log.component').then(m => m.ActivityLogComponent),
        title: 'Activity Log - Banque'
    },
    {
        path: 'notifications',
        loadComponent: () => import('./components/notifications/notification-list.component').then(m => m.NotificationListComponent),
        title: 'Notifications - Banque'
    }
];

