import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface ContactForm {
    name: string;
    email: string;
    subject: string;
    message: string;
}

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
    private readonly fb = inject(FormBuilder);

    protected readonly isSubmitting = signal(false);
    protected readonly isSubmitted = signal(false);

    protected readonly contactForm = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        subject: ['', [Validators.required, Validators.minLength(5)]],
        message: ['', [Validators.required, Validators.minLength(10)]],
    });

    protected readonly contactInfo = [
        {
            icon: '📧',
            title: 'Email',
            content: 'support@Banque.com',
            link: 'mailto:support@Banque.com'
        },
        {
            icon: '📞',
            title: 'Phone',
            content: '+1 (555) 123-4567',
            link: 'tel:+15551234567'
        },
        {
            icon: '📍',
            title: 'Address',
            content: '123 Banking Street, Financial District, NY 10004',
            link: null
        },
        {
            icon: '🕒',
            title: 'Business Hours',
            content: 'Monday - Friday: 9:00 AM - 6:00 PM EST',
            link: null
        }
    ];

    protected getFieldError(fieldName: keyof ContactForm): string | null {
        const control = this.contactForm.get(fieldName);
        if (control?.touched && control.errors) {
            if (control.errors['required']) {
                return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
            }
            if (control.errors['email']) {
                return 'Please enter a valid email address';
            }
            if (control.errors['minlength']) {
                const min = control.errors['minlength'].requiredLength;
                return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${min} characters`;
            }
        }
        return null;
    }

    protected onSubmit(): void {
        if (this.contactForm.valid) {
            this.isSubmitting.set(true);
            const formValue = this.contactForm.getRawValue();
            
            // Simulate API call
            setTimeout(() => {
                console.log('Contact form submitted:', formValue);
                this.isSubmitting.set(false);
                this.isSubmitted.set(true);
                this.contactForm.reset();
                
                // Reset submitted message after 5 seconds
                setTimeout(() => {
                    this.isSubmitted.set(false);
                }, 5000);
            }, 1000);
        } else {
            this.contactForm.markAllAsTouched();
        }
    }
}

