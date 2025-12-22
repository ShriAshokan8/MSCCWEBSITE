// MSC Initiative - Structured Data Generator
// Generates JSON-LD structured data for SEO

const structuredData = {
    // Organization schema - for all pages
    organization: {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "MSC Initiative",
        "alternateName": "MSC - Mathematics, Science, Computing Initiative",
        "url": "https://mscinitiative.app",
        "logo": "https://mscinitiative.app/images/msc-logo.svg",
        "description": "A student-led STEM movement exploring Mathematics, Science, and Computing. Join us to Explore, Innovate, and Excel!",
        "foundingDate": "2024-09-23",
        "email": "support@mscinitiative.app",
        "sameAs": [
            "https://msccw.pages.dev"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "email": "support@mscinitiative.app",
            "contactType": "General Inquiries",
            "availableLanguage": "English"
        }
    },

    // Website schema
    website: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "MSC Initiative",
        "url": "https://mscinitiative.app",
        "description": "MSC Initiative - A student-led STEM movement exploring Maths, Science, and Computing.",
        "publisher": {
            "@type": "Organization",
            "name": "MSC Initiative",
            "url": "https://mscinitiative.app"
        }
    },

    // Breadcrumb schema generator
    breadcrumb: function(items) {
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url ? `https://mscinitiative.app${item.url}` : undefined
            }))
        };
    },

    // FAQ schema generator
    faqPage: function(faqs) {
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
    },

    // Event schema generator
    event: function(eventData) {
        return {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": eventData.name,
            "description": eventData.description,
            "startDate": eventData.startDate,
            "endDate": eventData.endDate,
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
            "location": {
                "@type": "VirtualLocation",
                "url": eventData.url || "https://mscinitiative.app"
            },
            "organizer": {
                "@type": "Organization",
                "name": "MSC Initiative",
                "url": "https://mscinitiative.app"
            }
        };
    }
};

// Export for use in pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = structuredData;
}

// Example usage:
// Add to homepage breadcrumb:
// const breadcrumbData = structuredData.breadcrumb([
//     { name: "Home", url: "/" }
// ]);

// Add to about page breadcrumb:
// const breadcrumbData = structuredData.breadcrumb([
//     { name: "Home", url: "/" },
//     { name: "About" }
// ]);

// Add FAQ page schema:
// const faqData = structuredData.faqPage([
//     { question: "What is MSC Initiative?", answer: "..." },
//     { question: "How do I join?", answer: "..." }
// ]);
