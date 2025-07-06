/**
 * About Page Module
 * 
 * Acest modul gestionează funcționalitățile specifice paginii Despre noi
 */

import { initializeAnimations } from './animations.js';

/**
 * Inițializează funcționalitățile pentru pagina Despre noi
 */
export function initAboutPage() {
    // Inițializează animațiile pentru valorile noastre
    initValuesAnimation();
}

/**
 * Inițializează animațiile pentru secțiunea Valorile noastre
 */
function initValuesAnimation() {
    // Adaugă clasa animate pentru cardurile de valori
    const valueCards = document.querySelectorAll('.about__value-card');
    valueCards.forEach((card, index) => {
        card.classList.add('animate');
        card.setAttribute('data-animation-delay', index * 100);
    });

    // Inițializează animațiile cu configurație specifică
    initializeAnimations({
        threshold: 0.3,
        once: true,
        animateClass: 'visible'
    });
}

/**
 * Adaugă efecte hover la cardurile de valori
 */
export function enhanceValueCards() {
    const valueCards = document.querySelectorAll('.about__value-card');
    
    valueCards.forEach(card => {
        const icon = card.querySelector('.about__value-icon');
        
        card.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.1)';
        });
        
        card.addEventListener('mouseleave', () => {
            icon.style.transform = '';
        });
    });
}

// Exportă funcționalitățile principale
export default { initAboutPage, enhanceValueCards };
