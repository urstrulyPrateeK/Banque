import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/landing/landing.component').then(m => m.LandingComponent),
        title: 'SecureBank - Banking Made Simple'
    },
    {
        path: 'about',
        loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent),
        title: 'About Us - SecureBank'
    },
    {
        path: 'contact',
        loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent),
        title: 'Contact Us - SecureBank'
    },
    {
        path: 'privacy',
        loadComponent: () => import('./components/privacy/privacy.component').then(m => m.PrivacyComponent),
        title: 'Privacy Policy - SecureBank'
    },
    {
        path: 'terms',
        loadComponent: () => import('./components/terms/terms.component').then(m => m.TermsComponent),
        title: 'Terms of Service - SecureBank'
    },
    {
        path: 'faq',
        loadComponent: () => import('./components/faq/faq.component').then(m => m.FAQComponent),
        title: 'FAQ - SecureBank'
    }
];
