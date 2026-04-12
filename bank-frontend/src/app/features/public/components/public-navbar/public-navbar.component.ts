import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '@features/auth/store/auth.store';

@Component({
    selector: 'app-public-navbar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    template: `
    <nav class="navbar" [class.scrolled]="isNavScrolled()">
        <div class="nav-inner">
            <a routerLink="/" class="nav-brand">
                <img src="banque-mark.svg" alt="Banque" class="nav-logo">
                <span class="nav-name">Banque</span>
            </a>
            <div class="nav-links">
                <a routerLink="/about" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">About</a>
                <a routerLink="/faq" routerLinkActive="active">FAQ</a>
                <a routerLink="/contact" routerLinkActive="active">Contact</a>
            </div>
            <div class="nav-actions">
                @if (isLoggedIn()) {
                    <a routerLink="/dashboard" class="nav-cta">Go to Dashboard</a>
                } @else {
                    <a routerLink="/auth/login" class="nav-signin">Sign in</a>
                    <a routerLink="/auth/register" class="nav-cta">Get Started</a>
                }
            </div>
        </div>
    </nav>
    `,
    styles: [`
    .navbar {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 200;
        padding: 0;
        background: var(--bq-navy, #0a1628);
        border-bottom: 1px solid rgba(255,255,255,0.06);
        transition: all 0.35s var(--bq-ease, cubic-bezier(0.2,0,0,1));
    }

    .navbar.scrolled {
        background: rgba(10,22,40,0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    }

    .nav-inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        display: flex;
        align-items: center;
        height: 56px;
        gap: 2rem;
    }

    .nav-brand {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        text-decoration: none;
    }

    .nav-logo {
        width: 32px;
        height: 32px;
        border-radius: 8px;
    }

    .nav-name {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 1.1875rem;
        color: white;
        letter-spacing: -0.01em;
    }

    .nav-links {
        display: flex;
        gap: 0.125rem;
        margin-left: auto;
    }

    .nav-links a {
        font-size: 0.8125rem;
        font-weight: 500;
        color: rgba(255,255,255,0.55);
        text-decoration: none;
        padding: 0.375rem 0.875rem;
        border-radius: var(--bq-r-full, 999px);
        transition: all 0.2s var(--bq-ease);
        letter-spacing: 0.01em;
    }

    .nav-links a:hover {
        color: rgba(255,255,255,0.9);
        background: rgba(255,255,255,0.06);
    }

    .nav-links a.active {
        color: var(--bq-teal, #2dd4bf);
        background: rgba(45,212,191,0.08);
        font-weight: 600;
    }

    .nav-actions {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        margin-left: 1rem;
    }

    .nav-signin {
        font-weight: 500;
        font-size: 0.8125rem;
        color: rgba(255,255,255,0.7);
        text-decoration: none;
        padding: 0.375rem 0.875rem;
        border-radius: var(--bq-r-full, 999px);
        transition: all 0.2s;
    }
    .nav-signin:hover {
        color: white;
        background: rgba(255,255,255,0.06);
    }

    .nav-cta {
        display: inline-flex;
        align-items: center;
        padding: 0.4375rem 1.125rem;
        background: var(--bq-teal, #0d9488);
        color: white;
        font-weight: 600;
        font-size: 0.8125rem;
        border-radius: var(--bq-r-full, 999px);
        text-decoration: none;
        transition: all 0.2s var(--bq-ease);
        letter-spacing: 0.01em;
    }
    .nav-cta:hover {
        background: #0f766e;
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(13,148,136,0.3);
    }

    @media (max-width: 768px) {
        .nav-links { display: none; }
        .nav-actions { margin-left: auto; }
    }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicNavbarComponent implements OnInit, OnDestroy {
    private readonly authStore = inject(AuthStore);
    protected readonly isNavScrolled = signal(false);
    protected readonly isLoggedIn = signal(false);
    private scrollHandler: (() => void) | null = null;

    ngOnInit(): void {
        this.isLoggedIn.set(this.authStore.isAuthenticated());
        this.scrollHandler = () => this.isNavScrolled.set(window.scrollY > 40);
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }

    ngOnDestroy(): void {
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
        }
    }
}
