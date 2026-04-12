import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@features/auth/store/auth.store';

@Component({
    selector: 'app-header',
    imports: [],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
    private readonly router = inject(Router);
    protected readonly authStore = inject(AuthStore);

    protected logout(): void {
        this.authStore.logout();
    }

    protected navigateToProfile(): void {
        this.router.navigate(['/user/profile']);
    }
}
