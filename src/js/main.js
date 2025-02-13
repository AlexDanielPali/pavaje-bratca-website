import { initializeSlider } from './modules/slider.js';
import { updateDateTime } from './modules/utils.js';
import { initializeNav } from './modules/nav.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the slider component
    initializeSlider();

    // Update the date and time
    updateDateTime();

    // Initialize the navigation menu
    initializeNav();

    // Modern smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            } else {
                console.error('Target element not found for smooth scroll:', this.getAttribute('href'));
            }
        });
    });
});