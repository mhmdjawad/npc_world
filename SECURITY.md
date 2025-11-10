# NPC World - Security Notes

## Security Summary

This document summarizes security considerations and recommendations for the NPC World application.

## Fixed Vulnerabilities

### XSS (Cross-Site Scripting) - FIXED ✓
**Issue:** WebSocket client was displaying user-provided data without proper sanitization.

**Location:** `public/client.html` - Functions `addMessage()` and `updateEntityInfo()`

**Fix Applied:** Added `escapeHtml()` function to properly escape all user-provided values before inserting into the DOM. This prevents XSS attacks via entity names, states, or other dynamic content.

**Code:**
```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

All dynamic content is now escaped using this function before being inserted via innerHTML.

## Known Recommendations

### Missing Rate Limiting - RECOMMENDED FOR PRODUCTION

**Issue:** API endpoints do not implement rate limiting. This is a common recommendation for production APIs.

**Affected Endpoints:**
- All public endpoints (`/worlds`, `/entities`)
- All admin endpoints (`/admin/*`)

**Risk Level:** Low-Medium for this scaffold/demo application

**Recommendation:** For production deployment, implement rate limiting using a middleware like `express-rate-limit`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

**Implementation Example:**

```bash
# Install rate limiting middleware
npm install express-rate-limit

# Update src/server.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});

app.use('/worlds', apiLimiter);
app.use('/entities', apiLimiter);
app.use('/admin', adminLimiter);
```

**Current Status:** Not implemented in this scaffold as it's intended as a development/demo environment. For production use, rate limiting should be added.

## Additional Security Considerations

### 1. Admin Token Security
**Current:** Admin endpoints are protected by Bearer token authentication.

**Recommendations:**
- Use a strong, randomly generated token (not the default from .env.example)
- Store tokens securely (environment variables, secret management systems)
- Consider implementing token rotation
- For production, consider using OAuth2 or JWT with expiration

### 2. Password Security
**Current:** PHP registration page uses `password_hash()` with bcrypt.

**Status:** ✓ Good - This is a secure approach for password storage.

**Additional recommendations:**
- Implement password strength requirements
- Add CAPTCHA to prevent automated registrations
- Implement password reset functionality
- Consider adding 2FA for admin accounts

### 3. Database Security
**Current:** Parameterized queries are used throughout the application.

**Status:** ✓ Good - This prevents SQL injection attacks.

**Maintained by:**
- Node.js: Using `mysql2` with parameterized queries
- PHP: Using prepared statements with `mysqli`

### 4. CORS Configuration
**Current:** CORS is enabled for all origins.

**Code:** `app.use(cors());`

**Recommendation:** For production, restrict CORS to specific origins:
```javascript
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

### 5. WebSocket Security
**Current:** WebSocket connections are open without authentication.

**Recommendations for production:**
- Implement WebSocket authentication
- Use WSS (WebSocket Secure) over TLS
- Validate entity_id permissions before subscribing
- Implement connection limits per client

### 6. Environment Variables
**Current:** `.env.example` template provided.

**Recommendations:**
- Never commit `.env` file to version control (already in .gitignore ✓)
- Use strong, unique passwords for production
- Rotate credentials regularly
- Use secret management systems for production

### 7. Docker Security
**Current:** Standard Docker setup with exposed ports.

**Recommendations for production:**
- Use Docker secrets for sensitive data
- Run containers as non-root users
- Keep base images updated
- Use specific image versions (not `latest`)
- Implement network isolation
- Use read-only file systems where possible

### 8. Input Validation
**Current:** Basic validation on required fields.

**Recommendations:**
- Add comprehensive input validation for all endpoints
- Validate data types, lengths, formats
- Sanitize inputs before database storage
- Implement request size limits

Example:
```javascript
const { body, validationResult } = require('express-validator');

router.post('/entities/:id/idea',
  body('idea_text').isString().isLength({ min: 1, max: 1000 }),
  body('priority').isInt({ min: 1, max: 10 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... rest of handler
  }
);
```

## Security Best Practices for Deployment

### 1. Use HTTPS/TLS
- Deploy behind a reverse proxy (nginx, Apache) with TLS
- Use Let's Encrypt for free SSL certificates
- Redirect HTTP to HTTPS

### 2. Implement Logging and Monitoring
- Log all authentication attempts
- Monitor for suspicious activity
- Set up alerts for anomalies
- Use centralized logging (ELK stack, CloudWatch, etc.)

### 3. Keep Dependencies Updated
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix vulnerabilities
npm audit fix
```

### 4. Implement Backup Strategy
- Regular database backups
- Store backups securely off-site
- Test backup restoration regularly
- Implement point-in-time recovery

### 5. Security Headers
Add security headers using `helmet`:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 6. Error Handling
- Don't expose stack traces in production
- Log errors server-side
- Return generic error messages to clients
- Set `NODE_ENV=production`

### 7. Database Access
- Use principle of least privilege
- Separate read/write credentials if possible
- Enable database audit logging
- Use connection pooling limits

## Testing Security

### Automated Security Scanning
```bash
# Run npm audit
npm audit

# Run CodeQL (already done)
# Results: 2 XSS issues fixed, 11 rate-limiting recommendations

# Additional tools to consider:
# - Snyk
# - OWASP ZAP
# - Burp Suite
```

### Manual Security Testing
- Test authentication/authorization
- Try SQL injection attempts (should fail with parameterized queries)
- Test XSS attempts (should be blocked with escaping)
- Test CSRF on state-changing operations
- Test WebSocket message validation

## Compliance Considerations

For production deployment, consider:
- GDPR (if handling EU user data)
- CCPA (if handling California user data)
- PCI DSS (if handling payment data)
- HIPAA (if handling health data)
- SOC 2 (for SaaS deployments)

## Security Incident Response

Recommended incident response plan:
1. Detect and contain the threat
2. Assess the scope and impact
3. Notify affected users if required
4. Document the incident
5. Implement fixes
6. Review and update security measures

## Summary

### Current Security Status
- ✅ XSS vulnerabilities fixed
- ✅ SQL injection prevented (parameterized queries)
- ✅ Password hashing implemented (bcrypt)
- ✅ Admin authentication implemented (Bearer token)
- ✅ Sensitive data in .gitignore
- ⚠️ Rate limiting not implemented (recommended for production)
- ⚠️ CORS open to all origins (should restrict in production)
- ⚠️ WebSocket not authenticated (should implement in production)

### For Production Deployment
1. Implement rate limiting on all endpoints
2. Restrict CORS to specific origins
3. Add WebSocket authentication
4. Use HTTPS/WSS everywhere
5. Implement comprehensive input validation
6. Add security headers (helmet)
7. Set up logging and monitoring
8. Regular security audits and updates
9. Use strong, unique credentials
10. Implement backup and recovery procedures

This scaffold is suitable for development and demonstration purposes. For production deployment, implement the recommended security enhancements based on your specific requirements and threat model.
