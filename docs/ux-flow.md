# UX Flow — Banque User Journey

## Primary User Flow

```
Register → Verify Email → Login → 2FA Setup → Dashboard → Transfer → Feedback
```

---

## Detailed Flow Map

### 1. Registration

```
Landing Page (/):
  └─ Click "Get Started"
      └─ Register Form (/auth/register):
          ├─ Enter: First Name, Last Name, Email, Password
          ├─ Validation: Real-time field validation
          └─ Submit → Account Created → Redirect to Login
```

### 2. Authentication

```
Login Page (/auth/login):
  ├─ Enter: Email + Password
  ├─ Submit → JWT token issued
  ├─ If 2FA enabled:
  │   └─ 2FA Verification (/auth/two-factor):
  │       ├─ Enter 6-digit OTP (sent via SMS)
  │       └─ Verify → Dashboard
  └─ If 2FA not enabled:
      └─ Redirect → Dashboard
```

### 3. Dashboard (Primary Surface)

```
Dashboard (/dashboard):
  ├─ Platform Overview Card:
  │   ├─ Greeting with user's name
  │   ├─ Tech stack highlights (Angular Signals, Spring Boot + GCP)
  │   └─ Portfolio Pulse (total balance + spending patterns)
  ├─ KPI Cards (4):
  │   ├─ Total Balance (sum of all accounts)
  │   ├─ Monthly Spend (debits this cycle)
  │   ├─ Active Accounts (count)
  │   └─ Recent Transfers (count + delta)
  └─ Quick Actions:
      ├─ New Transfer → /transfers/create
      ├─ View Accounts → /accounts
      └─ Upload Document → /documents
```

### 4. Account Management

```
Accounts (/accounts):
  ├─ Summary Cards: Total Accounts, Active, Total Balance
  ├─ Account Cards (per account):
  │   ├─ Type icon (Checking/Savings/Business/Investment)
  │   ├─ Account number (masked: ****XXXX)
  │   ├─ Available Balance
  │   ├─ Status Badge (ACTIVE/INACTIVE)
  │   └─ "View Details →"
  └─ Account Detail (/accounts/:id):
      ├─ Full account info
      ├─ Transaction history table
      └─ Balance trend
```

### 5. Fund Transfer

```
Transfer (/transfers/create):
  ├─ Select: Source Account (dropdown)
  ├─ Enter: Destination Account Number
  ├─ Enter: Amount + Description
  ├─ Validation:
  │   ├─ Sufficient balance check
  │   ├─ Amount > 0
  │   └─ Source ≠ Destination
  ├─ Submit → SERIALIZABLE transaction
  │   ├─ Success → Confirmation with transaction ID
  │   └─ Failure → Error message with reason
  └─ Post-Transfer:
      └─ FeedbackComponent (thumbs up/down)
```

### 6. Document Upload

```
Document Upload (/documents):
  ├─ Drag-and-drop zone (or click to browse)
  ├─ File validation: type + size limits
  ├─ Upload progress indicator
  ├─ Success → Document stored (GCS or local)
  └─ View → Signed URL generated (15-min expiry)
```

### 7. Profile & Security

```
Profile (/user/profile):
  ├─ Header: Avatar, Name, Email, Role Badge
  ├─ Personal Information:
  │   ├─ View mode (read-only fields)
  │   └─ Edit mode (toggle via Edit button)
  ├─ Account Security:
  │   ├─ Email Verification status
  │   └─ 2FA (SMS) status + Enable flow:
  │       ├─ Enter phone number
  │       ├─ Receive OTP via SMS
  │       ├─ Enter 6-digit code
  │       └─ Verified ✓
  └─ Save Changes → Profile updated
```

---

## Navigation Structure

```
Sidebar (authenticated):
  ├─ Dashboard
  ├─ Accounts
  ├─ Transactions
  ├─ Transfers
  ├─ Payments
  ├─ Cards
  ├─ Profile
  ├─ Settings
  └─ Activity

Public Navbar:
  ├─ About
  ├─ FAQ
  ├─ Contact
  ├─ Sign In
  └─ Get Started
```

---

## Error Handling UX

| Scenario             | User Experience                                       |
| -------------------- | ----------------------------------------------------- |
| Invalid credentials  | Inline error below form, field highlighted            |
| Insufficient balance | Toast notification + disabled submit                  |
| Network error        | Retry prompt with "Try Again" button                  |
| Session expired      | Auto-redirect to login with "Session expired" message |
| Upload too large     | File rejected with size limit displayed               |

---

*Documented by Prateek Singh, April 2026*
