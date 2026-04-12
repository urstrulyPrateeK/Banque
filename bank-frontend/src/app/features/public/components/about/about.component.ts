// Banque - by Prateek Singh | github.com/prateeksingh
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './about.component.html',
    styleUrl: './about.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
    protected readonly values = [
        {
            icon: '01',
            title: 'Operational clarity',
            description: 'Account health, transaction context, and portfolio totals stay visible so users can act without hunting through noisy screens.',
        },
        {
            icon: '02',
            title: 'Guardrails by default',
            description: 'JWT auth, 2FA, signed document access, and serializable transfers keep sensitive flows constrained and auditable.',
        },
        {
            icon: '03',
            title: 'Cloud-ready architecture',
            description: 'The platform is designed to move cleanly between local development, single-service hosting, and Google Cloud storage-backed deployments.',
        },
        {
            icon: '04',
            title: 'Fast feedback loops',
            description: 'Signals, metrics, search, and in-product feedback make it easier to see what users need and tighten the product quickly.',
        },
    ];

    protected readonly milestones = [
        {
            year: 'Identity',
            event: 'Banque was rebranded around a focused platform story: smart banking infrastructure with clear operational surfaces.',
        },
        {
            year: 'Storage',
            event: 'KYC and profile documents now flow through a cloud-ready storage layer with signed access and local fallback support.',
        },
        {
            year: 'Scale',
            event: 'Caching, metrics, structured logging, and serializable transfer safety were added to show reliability under pressure.',
        },
        {
            year: 'UX',
            event: 'The dashboard, search, upload, and feedback flows were redesigned to feel deliberate, modern, and easy to trust.',
        },
    ];
}
