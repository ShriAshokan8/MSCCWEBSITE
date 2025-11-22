// MSC Initiative Website JavaScript - Ultra Modern Edition

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functions
    initializeUltraNavigation();
    initializeAnimations();
    initializeScrollEffects();
    initializeLoadingAnimations();
    setCurrentYear();
    
    console.log('MSC Initiative website loaded successfully!');
});

// Set current year in footer
function setCurrentYear() {
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
}

// Ultra-modern navigation functionality
function initializeUltraNavigation() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');
    const nav = document.querySelector('.ultra-nav');
    
    if (mobileToggle && mobileOverlay) {
        // Toggle mobile menu
        mobileToggle.addEventListener('click', function() {
            toggleMobileMenu();
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && mobileOverlay.getAttribute('aria-hidden') === 'false') {
                closeMobileMenu();
            }
        });
        
        // Close when clicking outside
        mobileOverlay.addEventListener('click', function(event) {
            if (event.target === mobileOverlay) {
                closeMobileMenu();
            }
        });
        
        // Close when clicking a link
        const mobileLinks = mobileOverlay.querySelectorAll('.mobile-nav-item');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                closeMobileMenu();
            });
        });
        
        function toggleMobileMenu() {
            const isHidden = mobileOverlay.getAttribute('aria-hidden') === 'true';
            if (isHidden) {
                openMobileMenu();
            } else {
                closeMobileMenu();
            }
        }
        
        function openMobileMenu() {
            mobileOverlay.setAttribute('aria-hidden', 'false');
            mobileToggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
        
        function closeMobileMenu() {
            mobileOverlay.setAttribute('aria-hidden', 'true');
            mobileToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }
    
    // Scroll effect for navigation
    if (nav) {
        let lastScroll = 0;
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                nav.style.boxShadow = '0 4px 20px rgba(255, 160, 122, 0.15)';
            } else {
                nav.style.boxShadow = '';
            }
            
            lastScroll = currentScroll;
        }, { passive: true });
    }
}

function initializeMottoTransition() {
    const mottoContainer = document.querySelector('.motto-container');
    if (!mottoContainer) return;
    
    // Check if we're on the homepage with hero section
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;
    
    // Create old motto element
    const oldMotto = document.createElement('div');
    oldMotto.className = 'old-motto';
    oldMotto.textContent = 'Challenge, Create, Compete';
    
    // Create new motto element
    const newMotto = document.createElement('div');
    newMotto.className = 'motto';
    newMotto.textContent = 'Explore, Innovate, Excel: Maths, Science, Computing';
    
    // Clear container and add old motto first
    mottoContainer.innerHTML = '';
    mottoContainer.appendChild(oldMotto);
    
    // Transition to new motto after delay
    setTimeout(() => {
        oldMotto.style.animation = 'mottoFadeOut 1.5s ease-out forwards';
        
        setTimeout(() => {
            mottoContainer.removeChild(oldMotto);
            mottoContainer.appendChild(newMotto);
            newMotto.style.animation = 'mottoFadeIn 1.5s ease-out forwards';
        }, 1500);
    }, 2000); // Start transition after 2 seconds
}

// Smooth scrolling navigation
function initializeNavigation() {
    // Make navbar sticky with smooth transition
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Mobile menu close on link click
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse.classList.contains('show')) {
                navbarToggler.click();
            }
        });
    });
}

// Scroll-triggered animations
function initializeScrollEffects() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
            }
        });
    }, observerOptions);
    
    // Observe all elements with loading class
    document.querySelectorAll('.loading').forEach(el => {
        observer.observe(el);
    });
    
    // Observe cards for staggered animation
    document.querySelectorAll('.card, .team-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
}

// Loading animations for page elements
function initializeLoadingAnimations() {
    // Add loading class to animatable elements
    const animatableElements = document.querySelectorAll(
        '.content-section, .card, .team-card, .timeline-item, .event-category'
    );
    
    animatableElements.forEach(el => {
        el.classList.add('loading');
    });
    
    // Animate elements on scroll
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.1 });
    
    animatableElements.forEach(el => {
        animateOnScroll.observe(el);
    });
}

// General animations initialization
function initializeAnimations() {
    // Logo entrance animation
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('load', function() {
            this.style.animation = 'logoEntry 1s ease-out';
        });
    }
    
    // Welcome message animation
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        setTimeout(() => {
            welcomeMessage.style.animation = 'fadeInUp 1s ease-out forwards';
        }, 3000); // After motto transition
    }
    
    // Hover effects for cards
    document.querySelectorAll('.card, .team-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Team member data (can be moved to separate JSON file if needed)
const teamData = {
    coreTeam: [
        {
            name: 'John Smith',
            role: 'Initiative Lead',
            class: 'Year 12',
            joinDate: '23rd September 2024',
            photo: 'images/team-photos/placeholder.jpg'
        },
        {
            name: 'Sarah Johnson',
            role: 'Science Coordinator',
            class: 'Year 11',
            joinDate: '25th September 2024',
            photo: 'images/team-photos/placeholder.jpg'
        },
        {
            name: 'Mike Chen',
            role: 'Computing Lead',
            class: 'Year 12',
            joinDate: '24th September 2024',
            photo: 'images/team-photos/placeholder.jpg'
        },
        {
            name: 'Emma Wilson',
            role: 'Maths Coordinator',
            class: 'Year 11',
            joinDate: '26th September 2024',
            photo: 'images/team-photos/placeholder.jpg'
        }
    ],
    supportTeam: [
        {
            name: 'Alex Thompson',
            role: 'Event Organizer',
            class: 'Year 10',
            joinDate: '30th September 2024',
            photo: 'images/team-photos/placeholder.jpg'
        },
        {
            name: 'Lisa Brown',
            role: 'Communications Lead',
            class: 'Year 10',
            joinDate: '1st October 2024',
            photo: 'images/team-photos/placeholder.jpg'
        },
        {
            name: 'David Lee',
            role: 'Technical Support',
            class: 'Year 9',
            joinDate: '2nd October 2024',
            photo: 'images/team-photos/placeholder.jpg'
        }
    ]
};

// Function to render team members
function renderTeamMembers() {
    const coreTeamContainer = document.getElementById('core-team');
    const supportTeamContainer = document.getElementById('support-team');
    
    if (coreTeamContainer) {
        coreTeamContainer.innerHTML = teamData.coreTeam.map(member => createTeamCard(member)).join('');
    }
    
    if (supportTeamContainer) {
        supportTeamContainer.innerHTML = teamData.supportTeam.map(member => createTeamCard(member)).join('');
    }
}

// Function to create team member card
function createTeamCard(member) {
    const placeholderSvg = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
            <rect width="80" height="80" fill="#FFD5B4"/>
            <text x="40" y="45" font-family="Arial" font-size="12" text-anchor="middle" fill="#FF6B35">Photo</text>
        </svg>
    `);
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="team-card text-center">
                <img src="${member.photo}" alt="${member.name}" class="team-photo mb-3" 
                     onerror="this.src='${placeholderSvg}'">
                <div class="team-name">${member.name}</div>
                <div class="team-role">${member.role}</div>
                <div class="team-details mt-2">
                    <small class="text-muted">
                        ${member.class} • Joined: ${member.joinDate}
                    </small>
                </div>
            </div>
        </div>
    `;
}

// Timeline data for about page
const timelineData = [
    {
        date: '23rd September 2024',
        title: 'MSC Initiative Launch',
        description: 'The MSC Initiative was officially launched as a student-led STEM movement, starting with the first competition.'
    },
    {
        date: 'October 2024',
        title: 'Team Formation',
        description: 'Core and support teams were established to manage and expand the initiative.'
    },
    {
        date: 'November 2024',
        title: 'Event Planning',
        description: 'Detailed planning began for the 2024-25 test run and future expansion.'
    },
    {
        date: 'March 2025',
        title: 'STEM Week Launch',
        description: 'Official launch of the 2025 test run during STEM Week.'
    },
    {
        date: 'April 2025',
        title: 'Competition Conclusion',
        description: 'Awards and recognition ceremony for the 2024-25 test run participants.'
    }
];

// Function to render timeline
function renderTimeline() {
    const timelineContainer = document.getElementById('timeline');
    if (!timelineContainer) return;
    
    timelineContainer.innerHTML = timelineData.map((item, index) => `
        <div class="timeline-item">
            <div class="timeline-content ${index % 2 === 0 ? 'slide-in-left' : 'slide-in-right'}">
                <div class="timeline-date">${item.date}</div>
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            </div>
        </div>
    `).join('');
}

// Initialize team and timeline when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    renderTeamMembers();
    renderTimeline();
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance optimization for scroll events
const optimizedScrollHandler = debounce(function() {
    // Handle scroll events here if needed
}, 10);

window.addEventListener('scroll', optimizedScrollHandler);

// Export functions for global use
window.MSC = {
    initializeAnimations,
    initializeNavigation,
    initializeHamburgerMenu,
    initializeMottoTransition,
    renderTeamMembers,
    renderTimeline,
    teamData,
    timelineData
};