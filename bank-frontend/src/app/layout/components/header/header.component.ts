import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStore } from '@features/auth/store/auth.store';
import { UserStore } from '@features/user/store/user.store';

@Component({
    selector: 'app-header',
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
    private readonly router = inject(Router);
    protected readonly authStore = inject(AuthStore);
    protected readonly userStore = inject(UserStore);

    protected readonly showDropdown = signal(false);
    protected readonly showNotifications = signal(false);

    ngOnInit(): void {
        this.userStore.loadProfile();
        this.userStore.loadNotifications({});
        this.userStore.loadUnreadCount();
    }

    protected toggleDropdown(): void {
        this.showDropdown.update(v => !v);
        if (this.showNotifications()) this.showNotifications.set(false);
    }

    protected toggleNotifications(): void {
        this.showNotifications.update(v => !v);
        if (this.showDropdown()) this.showDropdown.set(false);
    }

    protected navigateToProfile(): void {
        this.showDropdown.set(false);
        this.router.navigate(['/user/profile']);
    }

    protected navigateToSettings(): void {
        this.showDropdown.set(false);
        this.router.navigate(['/user/settings']);
    }

    protected navigateToActivity(): void {
        this.showDropdown.set(false);
        this.router.navigate(['/user/activity']);
    }

    protected markAllRead(): void {
        this.userStore.markAllAsRead();
    }

    protected logout(): void {
        this.showDropdown.set(false);
        this.authStore.logout();
    }
}
