# MSC Initiative Website

Welcome to the MSC Initiative website repository! This is a student-led STEM movement website built with modern web technologies and best practices.

## About MSC Initiative

The MSC Initiative is a student-led STEM movement that started on September 23rd, 2024. We bring together enthusiastic students to compete, learn, and excel in Mathematics, Science, and Computing through engaging challenges and real-world projects.

**Official Domains:**
- Primary: [https://mscinitiative.app](https://mscinitiative.app)
- Alternative: [https://msccw.pages.dev](https://msccw.pages.dev)

---

## Tech Stack

- **HTML5** - Semantic markup with accessibility features
- **CSS3** - Modern CSS with design tokens, custom properties, and advanced components
- **JavaScript (ES6+)** - Interactive components and analytics
- **PostCSS** - CSS processing and optimization
- **Terser** - JavaScript minification

---

## Recent Improvements (December 2024)

### Advanced Component System
- ✅ Comprehensive design token system (colors, spacing, typography, shadows, transitions)
- ✅ 12-column responsive grid system
- ✅ Enhanced button system (primary, secondary, danger, text)
- ✅ Modal/dialog component with focus trap
- ✅ Toast notification system
- ✅ Enhanced form components with validation
- ✅ Breadcrumb navigation
- ✅ Back-to-top button with smooth scroll
- ✅ Feedback widget (emoji-based)
- ✅ Changelog/What's New widget

### Accessibility Enhancements
- ✅ Skip-to-content and skip-to-nav links
- ✅ ARIA labels and live regions
- ✅ Minimum 44px hit areas
- ✅ Clear focus indicators
- ✅ Reduced-motion support
- ✅ Screen reader utilities

### Performance Optimizations
- ✅ Content-visibility for offscreen content
- ✅ Preconnect and DNS prefetch hints
- ✅ Font-display: swap for fonts
- ✅ CLS prevention with intrinsic sizing
- ✅ CSS and JS minification

### Analytics & Tracking
- ✅ Event tracking system for CTAs, forms, and FAQs
- ✅ Multi-platform analytics support (GA, FB Pixel)
- ✅ Lightweight feedback collection

### SEO & Meta
- ✅ JSON-LD structured data
- ✅ Open Graph and Twitter Card meta tags
- ✅ Canonical URLs
- ✅ Updated domain references

For detailed implementation notes, see [CHANGES.md](CHANGES.md).

---

## Project Structure

```
/
├── css/
│   └── advanced-components.css     # Advanced UI components
├── js/
│   ├── main.js                     # Core functionality
│   └── advanced-components.js      # Interactive components
├── images/                         # Image assets
├── index.html                      # Homepage
├── about.html                      # About page
├── contact.html                    # Contact form
├── events.html                     # Events listing
├── faq.html                        # FAQ page
├── newsletters.html                # Newsletters archive
├── style.css                       # Main stylesheet
├── script.js                       # Main JavaScript
├── manifest.json                   # PWA manifest
├── sw.js                           # Service worker
└── CHANGES.md                      # Detailed changelog
```

---

## Build & Development

### Install Dependencies
```bash
npm install
```

### Development
Edit files directly. The site uses vanilla HTML/CSS/JS with no build step required for development.

### Build for Production
```bash
npm run build
```

This command:
1. Formats CSS with css-declaration-sorter
2. Minifies CSS with cssnano
3. Minifies JavaScript with terser

### Individual Commands
```bash
npm run format        # Format CSS
npm run minify:css    # Minify CSS
npm run minify:js     # Minify JavaScript
npm run minify        # Minify everything
```

---

## Features

### Design System
- **Color Palette**: White, Peach, Orange, Black (brand colors)
- **Typography**: Poppins font family with 7-step scale (12/14/16/20/24/32/40)
- **Spacing**: 4px-based system (4/8/16/24/32/40/48/64)
- **Components**: Buttons, forms, modals, alerts, breadcrumbs, and more

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Semantic HTML markup
- High contrast focus indicators

### Performance
- Lighthouse Performance: 95+
- Lighthouse Accessibility: 95+
- Lighthouse Best Practices: 95+
- Lighthouse SEO: 95+

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS 14+, Android 90+)

---

## Contributing

This is a student-led initiative. For contributions or questions:
- Email: support@mscinitiative.app
- Check our [Code of Conduct](CODE_OF_CONDUCT.md)
- Review [Contributing Guidelines](CONTRIBUTING.md)

---

## License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built with ❤️ by the MSC Initiative team and contributors.

**Empowering STEM Excellence**

---

<sub>This repository is part of the MSC Initiative project. For more information, visit [mscinitiative.app](https://mscinitiative.app)</sub>
