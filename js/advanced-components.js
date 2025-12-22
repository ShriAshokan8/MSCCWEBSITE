// MSC Initiative - Advanced Components JavaScript
// Provides functionality for modal, toast, feedback, back-to-top, and analytics

(function() {
    'use strict';

    // ===================================
    // BACK TO TOP BUTTON
    // ===================================
    function initBackToTop() {
        const backToTopBtn = document.querySelector('.back-to-top');
        if (!backToTopBtn) return;

        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        // Scroll to top with smooth behavior (respecting reduced motion)
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    }

    // ===================================
    // MODAL COMPONENT
    // ===================================
    class Modal {
        constructor(modalId) {
            this.backdrop = document.getElementById(modalId);
            if (!this.backdrop) return;
            
            this.modal = this.backdrop.querySelector('.modal');
            this.closeBtn = this.backdrop.querySelector('.modal-close');
            this.focusableElements = null;
            this.firstFocusable = null;
            this.lastFocusable = null;
            this.previousFocus = null;
            
            this.init();
        }

        init() {
            // Close on backdrop click
            this.backdrop.addEventListener('click', (e) => {
                if (e.target === this.backdrop) {
                    this.close();
                }
            });

            // Close button
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }

            // ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.backdrop.classList.contains('active')) {
                    this.close();
                }
            });
        }

        open() {
            this.backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Store current focus and set focus trap
            this.previousFocus = document.activeElement;
            this.setFocusTrap();
            
            // Focus first element
            if (this.firstFocusable) {
                this.firstFocusable.focus();
            }
        }

        close() {
            this.backdrop.classList.remove('active');
            document.body.style.overflow = '';
            
            // Return focus to previous element
            if (this.previousFocus) {
                this.previousFocus.focus();
            }
        }

        setFocusTrap() {
            this.focusableElements = this.modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (this.focusableElements.length === 0) return;
            
            this.firstFocusable = this.focusableElements[0];
            this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];

            this.modal.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;

                if (e.shiftKey) {
                    if (document.activeElement === this.firstFocusable) {
                        e.preventDefault();
                        this.lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === this.lastFocusable) {
                        e.preventDefault();
                        this.firstFocusable.focus();
                    }
                }
            });
        }
    }

    // ===================================
    // TOAST NOTIFICATION SYSTEM
    // ===================================
    class ToastManager {
        constructor() {
            this.container = this.createContainer();
        }

        createContainer() {
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
            return container;
        }

        show(message, type = 'info', duration = 5000) {
            const toast = document.createElement('div');
            toast.className = `toast alert alert-${type}`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
            
            toast.innerHTML = `
                <span>${message}</span>
                <button class="alert-close" aria-label="Close notification">×</button>
            `;

            this.container.appendChild(toast);

            const closeBtn = toast.querySelector('.alert-close');
            closeBtn.addEventListener('click', () => this.remove(toast));

            // Auto remove after duration
            if (duration > 0) {
                setTimeout(() => this.remove(toast), duration);
            }

            return toast;
        }

        remove(toast) {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentElement) {
                    this.container.removeChild(toast);
                }
            }, 300);
        }
    }

    // Global toast instance
    window.toastManager = new ToastManager();

    // ===================================
    // FEEDBACK WIDGET
    // ===================================
    function initFeedbackWidget() {
        const widgets = document.querySelectorAll('.feedback-widget');
        
        widgets.forEach(widget => {
            const buttons = widget.querySelectorAll('.feedback-btn');
            const messageEl = widget.querySelector('.feedback-message');
            
            buttons.forEach(btn => {
                btn.addEventListener('click', function() {
                    // Remove selected from all buttons
                    buttons.forEach(b => b.classList.remove('selected'));
                    
                    // Add selected to clicked button
                    this.classList.add('selected');
                    
                    // Show thank you message
                    if (messageEl) {
                        messageEl.textContent = 'Thank you for your feedback!';
                        messageEl.style.display = 'block';
                    }
                    
                    // Track feedback event
                    const feedbackValue = this.getAttribute('data-feedback');
                    trackEvent('feedback_submitted', {
                        feedback_type: feedbackValue,
                        page: window.location.pathname
                    });
                    
                    // Optional: Send feedback to server
                    sendFeedback(feedbackValue);
                });
            });
        });
    }

    // ===================================
    // FORM VALIDATION
    // ===================================
    function initFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('.form-input, .form-textarea, .form-select');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => validateField(input));
                input.addEventListener('input', () => {
                    if (input.classList.contains('error')) {
                        validateField(input);
                    }
                });
            });
            
            form.addEventListener('submit', (e) => {
                let isValid = true;
                
                inputs.forEach(input => {
                    if (!validateField(input)) {
                        isValid = false;
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    
                    // Focus first error
                    const firstError = form.querySelector('.form-input.error, .form-textarea.error');
                    if (firstError) {
                        firstError.focus();
                    }
                } else {
                    // Track form submission
                    trackEvent('form_submit', {
                        form_name: form.getAttribute('name') || form.getAttribute('id'),
                        page: window.location.pathname
                    });
                }
            });
        });
    }

    function validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        let isValid = true;
        let errorMessage = '';

        // Clear previous states
        field.classList.remove('error', 'success');
        const errorEl = field.parentElement.querySelector('.form-error');
        if (errorEl) {
            errorEl.remove();
        }

        // Check required
        if (required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Email validation
        else if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        // URL validation
        else if (type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                isValid = false;
                errorMessage = 'Please enter a valid URL';
            }
        }

        // Custom pattern
        const pattern = field.getAttribute('pattern');
        if (pattern && value) {
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
                isValid = false;
                errorMessage = field.getAttribute('data-error-message') || 'Invalid format';
            }
        }

        // Update UI
        if (!isValid) {
            field.classList.add('error');
            const error = document.createElement('span');
            error.className = 'form-error';
            error.textContent = errorMessage;
            error.setAttribute('role', 'alert');
            field.parentElement.appendChild(error);
        } else if (value) {
            field.classList.add('success');
        }

        return isValid;
    }

    // ===================================
    // ANALYTICS EVENT TRACKING
    // ===================================
    function trackEvent(eventName, eventData = {}) {
        // Console log for debugging
        console.log('Analytics Event:', eventName, eventData);
        
        // Google Analytics (gtag.js)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        // Google Analytics (ga.js - legacy)
        if (typeof ga !== 'undefined') {
            ga('send', 'event', eventData.category || 'engagement', eventName, eventData.label);
        }
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', eventName, eventData);
        }
        
        // Custom analytics endpoint (optional)
        sendAnalyticsEvent(eventName, eventData);
    }

    // Track CTA clicks
    function initCTATracking() {
        const ctaButtons = document.querySelectorAll('.btn-primary, .btn-secondary, [data-track-cta]');
        
        ctaButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                trackEvent('cta_click', {
                    cta_text: this.textContent.trim(),
                    cta_href: this.getAttribute('href') || '',
                    cta_location: this.closest('section')?.id || 'unknown',
                    page: window.location.pathname
                });
            });
        });
    }

    // Track FAQ interactions
    function initFAQTracking() {
        const faqItems = document.querySelectorAll('[data-faq-item]');
        
        faqItems.forEach(item => {
            item.addEventListener('click', function() {
                const question = this.querySelector('h3, .faq-question')?.textContent.trim();
                trackEvent('faq_opened', {
                    question: question,
                    page: window.location.pathname
                });
            });
        });
    }

    // ===================================
    // HELPER FUNCTIONS
    // ===================================
    function sendFeedback(feedbackValue) {
        // Send feedback to server endpoint
        fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                feedback: feedbackValue,
                page: window.location.pathname,
                timestamp: new Date().toISOString()
            })
        }).catch(error => {
            console.log('Feedback submission (offline/not configured):', error);
        });
    }

    function sendAnalyticsEvent(eventName, eventData) {
        // Send to custom analytics endpoint
        fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event: eventName,
                data: eventData,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            })
        }).catch(error => {
            console.log('Analytics event (offline/not configured):', error);
        });
    }

    // ===================================
    // INITIALIZATION
    // ===================================
    document.addEventListener('DOMContentLoaded', function() {
        initBackToTop();
        initFeedbackWidget();
        initFormValidation();
        initCTATracking();
        initFAQTracking();
        
        // Initialize modals
        document.querySelectorAll('[data-modal]').forEach(trigger => {
            const modalId = trigger.getAttribute('data-modal');
            const modal = new Modal(modalId);
            
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                modal.open();
            });
        });

        console.log('MSC Advanced Components initialized');
    });

    // Export for global use
    window.MSCAdvanced = {
        Modal,
        ToastManager,
        trackEvent
    };

})();
