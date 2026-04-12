import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@features/auth/store/auth.store';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit {
    protected readonly authStore = inject(AuthStore);
    protected readonly isLoggedIn = signal(false);

    protected readonly features = [
        {
            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            title: 'Bank-grade security',
            description: 'JWT + 2FA authentication with SERIALIZABLE transaction isolation prevents race conditions.',
        },
        {
            icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
            title: 'Real-time analytics',
            description: 'Micrometer-powered metrics and reactive Angular Signals deliver instant financial insights.',
        },
        {
            icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
            title: 'Cloud-native architecture',
            description: 'GCP Cloud Storage integration with signed URLs for secure document handling.',
        },
        {
            icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
            title: 'Responsive experience',
            description: 'Built mobile-first with Angular 21. Accessible, keyboard-navigable, screen-reader tested.',
        },
    ];

    protected readonly stats = [
        { value: '<50ms', label: 'Token validation' },
        { value: '99.9%', label: 'Cache hit rate' },
        { value: 'Zero', label: 'Race conditions' },
        { value: '24/7', label: 'Service uptime' },
    ];

    ngOnInit(): void {
        this.isLoggedIn.set(this.authStore.isAuthenticated());
    }
}

