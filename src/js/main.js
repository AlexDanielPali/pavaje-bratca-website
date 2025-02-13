import { initializeSlider } from './modules/slider.js';
import { updateDateTime } from './modules/utils.js';
import { initializeNav } from './modules/nav.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeSlider();
    updateDateTime();
    initializeNav();

    // Modern smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href'))?.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});