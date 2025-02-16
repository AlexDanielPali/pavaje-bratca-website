export function initializeNav() {
    const navToggle = document.querySelector('.nav__toggle');
    const navMenu = document.querySelector('.nav__menu');
    
    if (!navToggle || !navMenu) return;

    function toggleMenu() {
        const isOpen = navToggle.classList.contains('nav__toggle--active');
        
        navToggle.classList.toggle('nav__toggle--active');
        navMenu.classList.toggle('nav__menu--active');
        
        // Update aria-expanded
        navToggle.setAttribute('aria-expanded', !isOpen);
        
        // Toggle body scroll
        document.body.style.overflow = !isOpen ? 'hidden' : '';
    }

    // Toggle menu on button click
    navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const isMenuOpen = navMenu.classList.contains('nav__menu--active');
        if (isMenuOpen && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            toggleMenu();
        }
    });

    // Close menu when clicking links
    navMenu.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', toggleMenu);
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('nav__menu--active')) {
            toggleMenu();
        }
    });
}