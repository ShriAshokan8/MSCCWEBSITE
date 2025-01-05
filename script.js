document.addEventListener('DOMContentLoaded', () => {
    console.log("The DOM is ready.");

    // Select the hamburger and navigation menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Add a click event to toggle the menu
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active'); // Animate the hamburger icon
        navMenu.classList.toggle('active');  // Show or hide the menu
    });

    // Close the menu when a link is clicked
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
});
