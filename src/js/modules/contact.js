/**
 * Contact Page Module
 * 
 * Acest modul gestionează funcționalitățile specifice paginii de Contact
 */

import { initializeAnimations } from './animations.js';

/**
 * Inițializează funcționalitățile pentru pagina de Contact
 */
export function initContactPage() {
    // Inițializează animațiile pentru cardurile de contact
    initContactAnimation();
    
    // Inițializează validarea formularului
    initFormValidation();
}

/**
 * Inițializează animațiile pentru secțiunea de contact
 */
function initContactAnimation() {
    // Adaugă clasa animate pentru cardurile de contact
    const contactCards = document.querySelectorAll('.contact__card');
    contactCards.forEach((card, index) => {
        card.classList.add('animate');
        card.setAttribute('data-animation-delay', index * 100);
    });
    
    // Animeaza formularul
    const contactForm = document.querySelector('.contact__form');
    if (contactForm) {
        contactForm.classList.add('animate');
        contactForm.setAttribute('data-animation-delay', '300');
    }

    // Animeaza harta
    const mapSection = document.querySelector('.contact-map-section');
    if (mapSection) {
        mapSection.classList.add('animate');
        mapSection.setAttribute('data-animation-delay', '400');
    }

    // Inițializează animațiile cu configurație specifică
    initializeAnimations({
        threshold: 0.3,
        once: true,
        animateClass: 'visible'
    });
}

/**
 * Inițializează validarea formularului de contact
 */
function initFormValidation() {
    const form = document.querySelector('#contact-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validare simplă
        const name = this.querySelector('#name').value;
        const email = this.querySelector('#email').value;
        const message = this.querySelector('#message').value;
        
        if (!name || !email || !message) {
            showFormMessage('Completați toate câmpurile obligatorii.', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showFormMessage('Introduceți un email valid.', 'error');
            return;
        }
        
        // Simulează trimiterea formularului (aici ar trebui să trimiteți datele la server)
        showFormMessage('Mesajul a fost trimis cu succes! Vă mulțumim.', 'success');
        form.reset();
    });
}

/**
 * Validează un email
 * @param {string} email - Emailul de validat
 * @returns {boolean} - True dacă emailul este valid
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Afișează un mesaj în formular
 * @param {string} message - Mesajul de afișat
 * @param {string} type - Tipul de mesaj (success sau error)
 */
function showFormMessage(message, type = 'success') {
    // Verifică dacă există deja un mesaj
    let messageEl = document.querySelector('.form-message');
    
    // Dacă nu există, creează unul nou
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'form-message';
        const form = document.querySelector('#contact-form');
        form.appendChild(messageEl);
    }
    
    // Setează clasa și textul în funcție de tip
    messageEl.className = `form-message ${type === 'success' ? 'success' : 'error'}`;
    messageEl.textContent = message;
    
    // Ascunde mesajul după 5 secunde
    setTimeout(() => {
        messageEl.classList.add('fade-out');
        setTimeout(() => {
            messageEl.remove();
        }, 300);
    }, 5000);
}

export default { initContactPage };
