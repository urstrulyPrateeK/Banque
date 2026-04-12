import { ChangeDetectionStrategy, Component } from '@angular/core';
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
            title: 'Resilient transaction workflows',
            description: 'Handle transfers, receipts, and dispute-ready histories from a single operational surface.',
        },
        {
            title: 'Document storage with signed access',
            description: 'Upload KYC and profile documents into cloud-backed storage with time-limited retrieval.',
        },
        {
            title: 'Operational observability',
            description: 'Metrics, health endpoints, and search-first interfaces keep activity visible as usage scales.',
        },
        {
            title: 'Angular-first operator experience',
            description: 'Reactive dashboards, polished flows, and responsive components built for everyday use.',
        },
    ];

    protected readonly stats = [
        { value: '<100ms', label: 'Dashboard repaint target' },
        { value: '15 min', label: 'Signed document access window' },
        { value: 'SERIALIZABLE', label: 'Transfer isolation mode' },
        { value: '/actuator', label: 'Metrics and health surface' },
    ];

    protected readonly architectureLayers = [
        'Angular 21 experience layer',
        'Spring Boot 4 orchestration',
        'PostgreSQL + cache + cloud storage',
    ];
}
