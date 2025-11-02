// MSC Initiative Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functions
    initializeAnimations();
    initializeNavigation();
    initializeHamburgerMenu();
    initializeMottoTransition();
    initializeScrollEffects();
    initializeLoadingAnimations();
    setCurrentYear();
    initializeThemeToggle();
    
    console.log('MSC Initiative website loaded successfully!');
});

// Theme toggle functionality
function initializeThemeToggle() {
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    // Get or create theme toggle button
    let themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) {
        // Create theme toggle button if it doesn't exist
        themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Toggle dark mode');
        themeToggle.innerHTML = `
            <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"></path>
            </svg>
            <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"></path>
            </svg>
        `;
        document.body.appendChild(themeToggle);
    }
    
    // Theme toggle click event
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Save theme preference
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        
        // Update aria-label
        themeToggle.setAttribute('aria-label', 
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
        );
    });
    
    // Update initial aria-label
    themeToggle.setAttribute('aria-label', 
        currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
}

// Set current year in footer
function setCurrentYear() {
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
}

// Hamburger menu functionality
function initializeHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (hamburger && mobileNav) {
        // Click event
        hamburger.addEventListener('click', function() {
            toggleMobileNav();
        });
        
        // Keyboard event for accessibility
        hamburger.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleMobileNav();
            }
        });
        
        function toggleMobileNav() {
            hamburger.classList.toggle('active');
            mobileNav.classList.toggle('active');
            
            // Update aria-expanded attribute
            const isExpanded = hamburger.classList.contains('active');
            hamburger.setAttribute('aria-expanded', isExpanded);
        }
        
        // Close mobile menu when clicking on a link
        const mobileNavLinks = mobileNav.querySelectorAll('a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                hamburger.setAttribute('aria-expanded', false);
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburger.contains(event.target) && !mobileNav.contains(event.target)) {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                hamburger.setAttribute('aria-expanded', false);
            }
        });
        
        // Close mobile menu on Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                mobileNav.classList.remove('active');
                hamburger.setAttribute('aria-expanded', false);
                hamburger.focus(); // Return focus to hamburger
            }
        });
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