import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./components/login/login.component').then((m) => m.LoginComponent),
        title: 'Login - Banque',
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./components/register/register.component').then((m) => m.RegisterComponent),
        title: 'Create Account - Banque',
    },
    {
        path: 'verify-otp',
        loadComponent: () =>
            import('./components/two-factor/two-factor.component').then((m) => m.TwoFactorComponent),
        title: 'Verify OTP - Banque',
    },
    {
        path: 'forgot-password',
        loadComponent: () =>
            import('./components/forgot-password/forgot-password.component').then(
                (m) => m.ForgotPasswordComponent
            ),
        title: 'Forgot Password - Banque',
    },
    {
        path: 'reset-password',
        loadComponent: () =>
            import('./components/reset-password/reset-password.component').then(
                (m) => m.ResetPasswordComponent
            ),
        title: 'Reset Password - Banque',
    },
    {
        path: 'verify-email',
        loadComponent: () =>
            import('./components/verify-email/verify-email.component').then(
                (m) => m.VerifyEmailComponent
            ),
        title: 'Verify Email - Banque',
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
];

