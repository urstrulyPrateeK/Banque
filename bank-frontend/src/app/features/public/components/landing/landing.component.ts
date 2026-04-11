import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
    protected readonly features = [
        {
            icon: '💳',
            title: 'Digital Banking',
            description: 'Manage your accounts, transfer funds, and pay bills all from one secure platform.'
        },
        {
            icon: '🔒',
            title: 'Bank-Level Security',
            description: 'Your data is protected with industry-leading encryption and security measures.'
        },
        {
            icon: '📱',
            title: 'Mobile First',
            description: 'Access your accounts anywhere, anytime with our responsive mobile-friendly design.'
        },
        {
            icon: '⚡',
            title: 'Fast Transactions',
            description: 'Instant transfers and real-time updates keep you in control of your finances.'
        },
        {
            icon: '📊',
            title: 'Financial Insights',
            description: 'Track your spending, set budgets, and get personalized financial recommendations.'
        },
        {
            icon: '🌍',
            title: 'Global Access',
            description: 'Bank from anywhere in the world with our international banking services.'
        }
    ];

    protected readonly stats = [
        { value: '2M+', label: 'Active Users' },
        { value: '$50B+', label: 'Assets Managed' },
        { value: '99.9%', label: 'Uptime' },
        { value: '24/7', label: 'Support' }
    ];
}
