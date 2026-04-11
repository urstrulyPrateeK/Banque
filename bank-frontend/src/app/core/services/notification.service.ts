import { Injectable, signal, computed } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: number;
    type: NotificationType;
    message: string;
    title?: string;
    duration: number;
}

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private readonly _notifications = signal<Notification[]>([]);
    private idCounter = 0;

    readonly notifications = this._notifications.asReadonly();
    readonly hasNotifications = computed(() => this._notifications().length > 0);

    show(
        message: string,
        type: NotificationType = 'info',
        title?: string,
        duration = 5000
    ): void {
        const notification: Notification = {
            id: ++this.idCounter,
            type,
            message,
            title,
            duration,
        };

        this._notifications.update((notifications) => [...notifications, notification]);

        if (duration > 0) {
            setTimeout(() => this.dismiss(notification.id), duration);
        }
    }

    success(message: string, title?: string): void {
        this.show(message, 'success', title ?? 'Success');
    }

    error(message: string, title?: string): void {
        this.show(message, 'error', title ?? 'Error');
    }

    warning(message: string, title?: string): void {
        this.show(message, 'warning', title ?? 'Warning');
    }

    info(message: string, title?: string): void {
        this.show(message, 'info', title ?? 'Info');
    }

    dismiss(id: number): void {
        this._notifications.update((notifications) =>
            notifications.filter((n) => n.id !== id)
        );
    }

    clear(): void {
        this._notifications.set([]);
    }
}
