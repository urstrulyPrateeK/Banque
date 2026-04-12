# User Research - Banque

## Research Methodology

I interviewed three users with different financial profiles to understand how they interact with banking applications and where current tools fall short. Each session lasted approximately 30 minutes and covered daily banking habits, pain points, and feature priorities.

---

## Participant Profiles

### Participant A - College Student (Age 21)

- Banking behavior: Checks balance 2-3x per week, primarily via mobile
- Primary frustrations:
  - "I can never tell how much I've actually spent this month without scrolling through a wall of transactions"
  - No visual summary of spending patterns
  - Transfer confirmations feel unclear - "Did it go through or not?"

### Participant B - Salaried Professional (Age 28)

- Banking behavior: Daily app usage, manages 2 accounts (checking + savings)
- Primary frustrations:
  - Switching between accounts requires multiple taps and page loads
  - Document upload for KYC verification was "painful - I had to mail a physical copy"
  - No feedback mechanism - "I found a bug once and had no way to report it"

### Participant C - Freelancer (Age 32)

- Banking behavior: Irregular income, needs to track inflows carefully
- Primary frustrations:
  - Dashboard doesn't surface recent transfer activity prominently
  - Security feels opaque - "I have no idea if my account is actually secure"
  - No spending insights or categorization

---

## Key Insights

| Pain Point               | Frequency | Severity | Solution Implemented                                |
| ------------------------ | --------- | -------- | --------------------------------------------------- |
| No spending overview     | 3/3       | High     | Dashboard KPI cards (Total Balance, Monthly Spend)  |
| Unclear transfer status  | 2/3       | High     | Transfer history with status badges                 |
| Document upload friction | 2/3       | Medium   | Drag-and-drop DocumentUploadComponent               |
| No feedback channel      | 1/3       | Medium   | Post-transaction FeedbackComponent                  |
| Security visibility      | 2/3       | Medium   | Account Security section with 2FA status            |
| Multi-account switching  | 2/3       | Low      | Account list with summary cards                     |

---

## Design Decisions Driven by Research

1. Dashboard as the landing page: All three participants wanted an at-a-glance financial summary. The dashboard now shows 4 KPI cards immediately after login.
2. Drag-and-drop document upload: Participant B specifically mentioned document submission friction. The upload component supports drag-and-drop with progress indicators.
3. Feedback after transfers: Participant B's inability to report issues led to the FeedbackComponent - a simple thumbs up/down that captures user sentiment without disrupting the flow.
4. Visible security state: Participants A and C both expressed uncertainty about their account security. The profile page now includes an Account Security section showing email verification and 2FA status.

---

Research conducted by Prateek Singh, April 2026