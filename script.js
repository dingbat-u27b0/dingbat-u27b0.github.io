document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // 2. Scroll to Top Functionality
    const scrollToTopBtn = document.getElementById('scrollToTop');

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const themeToggle = document.getElementById('theme-toggle');
    const iconBulb = document.getElementById('icon-bulb');
    const iconMoon = document.getElementById('icon-moon');
    const body = document.body;

    // Optional but recommended: Check if the user previously chose light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        iconBulb.classList.remove('active');
        iconMoon.classList.add('active');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault(); // Prevents the page from jumping to the top
            body.classList.toggle('light-theme');
            
            // Swap icons and save preference
            if (body.classList.contains('light-theme')) {
                iconBulb.classList.remove('active');
                iconMoon.classList.add('active');
                localStorage.setItem('theme', 'light');
            } else {
                iconMoon.classList.remove('active');
                iconBulb.classList.add('active');
                localStorage.setItem('theme', 'dark'); // Dark is default
            }
        });
    }
});





