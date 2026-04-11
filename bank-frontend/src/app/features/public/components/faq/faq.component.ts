import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

@Component({
    selector: 'app-faq',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './faq.component.html',
    styleUrl: './faq.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FAQComponent {
    protected readonly selectedCategory = signal<string>('all');
    protected readonly openIndex = signal<number | null>(null);

    protected readonly categories = [
        { id: 'all', label: 'All Questions' },
        { id: 'account', label: 'Account Management' },
        { id: 'security', label: 'Security & Privacy' },
        { id: 'transactions', label: 'Transactions' },
        { id: 'fees', label: 'Fees & Charges' },
        { id: 'support', label: 'Support & Help' }
    ];

    protected readonly faqs: FAQItem[] = [
        {
            category: 'account',
            question: 'How do I open an account?',
            answer: 'You can open an account online by clicking "Get Started" and completing our registration process. You\'ll need to provide personal information, verify your identity, and fund your account to get started.'
        },
        {
            category: 'account',
            question: 'What documents do I need to open an account?',
            answer: 'You\'ll need a government-issued photo ID (driver\'s license or passport), proof of address (utility bill or bank statement), and your Social Security Number or Tax ID. Additional documents may be required based on your account type.'
        },
        {
            category: 'account',
            question: 'How long does it take to open an account?',
            answer: 'Most accounts can be opened within minutes online. However, account activation and full access may take 1-2 business days after identity verification is complete.'
        },
        {
            category: 'security',
            question: 'How secure is my information?',
            answer: 'We use bank-level encryption, multi-factor authentication, and follow industry best practices to protect your data. All transactions are encrypted and monitored for suspicious activity.'
        },
        {
            category: 'security',
            question: 'What should I do if I suspect unauthorized activity?',
            answer: 'Contact us immediately at support@Banque.com or call +1 (555) 123-4567. We\'ll help you secure your account and investigate any suspicious transactions.'
        },
        {
            category: 'transactions',
            question: 'How long do transfers take?',
            answer: 'Internal transfers between Banque accounts are instant. External transfers typically take 1-3 business days depending on the receiving bank.'
        },
        {
            category: 'transactions',
            question: 'Are there limits on transactions?',
            answer: 'Yes, transaction limits vary based on your account type and verification level. You can view your limits in your account settings. Limits may be increased after additional verification.'
        },
        {
            category: 'fees',
            question: 'What fees do you charge?',
            answer: 'Many of our accounts have no monthly maintenance fees. Some services like wire transfers, overdrafts, and premium features may have associated fees. Check our fee schedule for complete details.'
        },
        {
            category: 'fees',
            question: 'Are there ATM fees?',
            answer: 'We provide free ATM access at thousands of locations nationwide. Out-of-network ATM fees may apply, but we reimburse up to $10 per month in ATM fees for qualifying accounts.'
        },
        {
            category: 'support',
            question: 'How can I contact customer support?',
            answer: 'You can reach us via email at support@Banque.com, phone at +1 (555) 123-4567, or through our in-app chat feature. Our support team is available Monday-Friday, 9 AM - 6 PM EST.'
        },
        {
            category: 'support',
            question: 'Do you offer 24/7 support?',
            answer: 'While our phone support operates during business hours, you can access your account and perform most transactions 24/7 through our online platform and mobile app.'
        }
    ];

    protected readonly filteredFaqs = computed(() => {
        const category = this.selectedCategory();
        if (category === 'all') {
            return this.faqs;
        }
        return this.faqs.filter(faq => faq.category === category);
    });

    protected toggleQuestion(index: number): void {
        const current = this.openIndex();
        this.openIndex.set(current === index ? null : index);
    }

    protected isOpen(index: number): boolean {
        return this.openIndex() === index;
    }

    protected selectCategory(categoryId: string): void {
        this.selectedCategory.set(categoryId);
        this.openIndex.set(null);
    }
}

