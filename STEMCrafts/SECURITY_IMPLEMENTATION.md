# Security Implementation Guide

## Subresource Integrity (SRI)

### What is SRI?

Subresource Integrity (SRI) is a security feature that enables browsers to verify that resources they fetch are delivered without unexpected manipulation. It works by allowing you to provide a cryptographic hash that a fetched resource must match.

### Current Implementation

The STEM Crafts Club website uses minimal external resources to reduce security risks:

1. **Google Fonts** - For the Inter font family
2. **Formspree** - For contact form submissions (HTTPS with CSP whitelisting)

### Why No SRI for Google Fonts?

Google Fonts intentionally cannot use SRI hashes because:

1. **Dynamic Content**: Google Fonts serves different CSS based on the user's browser and operating system
2. **Automatic Optimization**: The CSS changes as Google optimizes font delivery
3. **User-Agent Specific**: Different browsers receive different font files for optimal compatibility

### Alternatives for Enhanced Security

#### Option 1: Self-Host Fonts (Recommended for Production)

Self-hosting fonts provides:

- Ability to use SRI hashes
- Improved performance (no external DNS lookup)
- Better privacy (no data sent to Google)

**Steps to self-host:**

1. Download the Inter font family from [Google Fonts](https://fonts.google.com/specimen/Inter) or [Inter GitHub](https://github.com/rsms/inter)
2. Place font files in `/fonts/` directory
3. Update CSS with `@font-face` declarations
4. Generate SRI hashes using: `openssl dgst -sha384 -binary fonts/Inter.woff2 | openssl base64 -A`

Example:
```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/Inter-Regular.woff2') format('woff2');
}
```

#### Option 2: Continue with Google Fonts (Current)

Benefits:
- Automatic optimization
- Reduced bandwidth if users have cached fonts
- No maintenance required

We mitigate risks by:
- Using `crossorigin="anonymous"` attribute
- Implementing Content Security Policy (CSP)
- Using HTTPS for all connections
- Preconnecting to Google domains

## Content Security Policy (CSP)

Our current CSP implementation (in `_headers` file):

```
Content-Security-Policy: 
  default-src 'self'; 
  img-src 'self' data: https:; 
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; 
  style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com; 
  font-src 'self' https://fonts.gstatic.com data:; 
  connect-src 'self' https://formspree.io https://api.formspree.io; 
  frame-ancestors 'self'; 
  base-uri 'self'; 
  form-action 'self' https://formspree.io
```

### CSP Improvements for Production

1. **Remove 'unsafe-inline' for scripts**: Replace inline scripts with external files or use nonces
2. **Add nonces for JSON-LD**: Use server-side generated nonces for structured data
3. **Implement report-uri**: Monitor CSP violations

Example with nonces:
```html
<script nonce="random-nonce-value" type="application/ld+json">
{ ... }
</script>
```

## HTTPS and Certificate Pinning

### Current Setup
- All resources loaded over HTTPS
- HSTS (HTTP Strict Transport Security) enabled via `_headers`
- Preload list submission recommended

### HSTS Configuration
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## External Link Security

All external links include:
- `rel="noopener"` - Prevents new pages from accessing window.opener
- `rel="noreferrer"` - Prevents referrer information leakage

Example:
```html
<a href="https://external-site.com" target="_blank" rel="noopener noreferrer">
```

## Form Security

### Contact Form
- Honeypot field for spam protection
- HTTPS-only submission (Formspree)
- Input validation and sanitization
- CSRF protection via Formspree

### Login Form (Brackets)
- Client-side validation
- Secure password handling
- No sensitive data in localStorage
- Session management best practices

## Service Worker Security

The service worker (`sw.js`) implements:
- Same-origin policy enforcement
- Secure cache strategies
- HTTPS-only operation (service workers don't work over HTTP)

## Recommended Security Headers

Already implemented in `_headers`:
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy`
- ✅ `Strict-Transport-Security`
- ✅ Content Security Policy

## Monitoring and Maintenance

### Regular Security Audits
1. Run Lighthouse audits monthly
2. Check for vulnerabilities with `npm audit`
3. Review CSP reports if implemented
4. Monitor for new security headers and best practices

### Keeping Dependencies Updated
```bash
npm audit
npm audit fix
npm update
```

## Additional Resources

- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Google Fonts Best Practices](https://developers.google.com/fonts/docs/getting_started)

## Contact

For security concerns, please email: security@mscinitiative.app
