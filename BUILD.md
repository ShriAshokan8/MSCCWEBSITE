# Build and Deployment Guide

This document describes how to build and optimize the MSC Initiative website.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

Install the required dependencies:

```bash
npm install
```

## Build Commands

### Minify All Assets

To minify both CSS and JavaScript files:

```bash
npm run build
```

This will create minified versions:

- `script.min.js` (from `script.js`)
- `js/main.min.js` (from `js/main.js`)
- `sw.min.js` (from `sw.js`)

### Individual Commands

Minify only CSS:
```bash
npm run minify:css
```

Minify only JavaScript:
```bash
npm run minify:js
```

## File Size Comparison

After minification, you should see significant file size reductions:

- `style.css` (35KB) → `style.min.css` (23KB) - 34% reduction
- `script.js` (3.7KB) → `script.min.js` (1.7KB) - 54% reduction
- `js/main.js` (14KB) → `js/main.min.js` (7.8KB) - 44% reduction
- `sw.js` (3.2KB) → `sw.min.js` (1.5KB) - 53% reduction

## Using Minified Files in Production

To use minified files in production, update the HTML `<link>` and `<script>` tags:

### CSS
Replace:
```html
<link rel="stylesheet" href="/style.css">
```

With:
```html
<link rel="stylesheet" href="/style.min.css">
```

### JavaScript
Replace:
```html
<script src="/script.js" defer></script>
<script src="/js/main.js" defer></script>
```

With:
```html
<script src="/script.min.js" defer></script>
<script src="/js/main.min.js" defer></script>
```

### Service Worker
Update the service worker registration in `script.min.js` or create a build script to automatically use `sw.min.js` in production.

## Development vs Production

- **Development**: Use the unminified versions for easier debugging
- **Production**: Use the minified versions for better performance

## Performance Improvements

The minified files provide several benefits:

1. **Reduced file sizes** - Faster downloads and lower bandwidth usage
2. **Faster parsing** - Smaller files are parsed more quickly by browsers
3. **Better caching** - Smaller files are more efficient to cache
4. **Improved Core Web Vitals** - Faster LCP (Largest Contentful Paint) and FID (First Input Delay)

## Service Worker Cache

The service worker (`sw.js`) automatically caches critical assets for offline support. When using minified files in production, update the service worker to cache the `.min.css` and `.min.js` versions instead.

## Continuous Integration

You can add the build step to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm install

- name: Build and minify
  run: npm run build
```

## Additional Optimizations

Consider these additional optimizations:

1. **Image optimization**: Use tools like imagemin to compress images
2. **WebP/AVIF conversion**: Convert images to modern formats
3. **Gzip/Brotli compression**: Enable server-side compression
4. **CDN**: Use a CDN for static assets
5. **HTTP/2**: Enable HTTP/2 on your server

## License

Apache-2.0 - See LICENSE file for details
