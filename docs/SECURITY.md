# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅ Active |

## Reporting a Vulnerability

If you discover a security vulnerability in Banque, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Email:** Send a detailed report to emperorprateek74@gmail.com
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 5 business days
- **Fix & Disclosure:** Coordinated with reporter

### Security Measures in Banque

- **Authentication:** JWT tokens with configurable expiry + refresh token rotation
- **Two-Factor Auth:** SMS-based OTP verification for sensitive operations
- **Transaction Safety:** SERIALIZABLE isolation on fund transfers prevents race conditions
- **Document Access:** Signed URLs with time-limited access (default: 15 minutes)
- **Container Security:** Non-root user in production Docker image
- **Input Validation:** Jakarta Bean Validation on all API request bodies
- **CORS:** Configurable allowed origins, defaults to frontend URL only
- **Logging:** MDC-based structured logging with user context (no PII in logs)

### Out of Scope

- Vulnerabilities in dependencies (report upstream)
- Denial of service attacks on demo/development instances
- Social engineering attacks

---

Thank you for helping keep Banque secure.
