/**
 * Animations Module
 * 
 * Acest modul gestionează animațiile și efectele vizuale din site
 * Folosește IntersectionObserver pentru a activa animații la scroll
 */

// Configurație pentru animații
const defaultConfig = {
    threshold: 0.2,
    once: true,
    animateClass: 'animated',
    offset: { top: 0, bottom: 0 },
};

/**
 * Inițializează animații la scroll pentru elemente cu clasele specificate
 * @param {Object} options - Opțiuni de configurare
 */
export function initializeAnimations(options = {}) {
    // Merge options with defaults
    const config = { ...defaultConfig, ...options };
    
    // Verifică suportul pentru IntersectionObserver
    if (!('IntersectionObserver' in window)) {
        // Fallback pentru browsere care nu suportă IntersectionObserver
        document.querySelectorAll('.animate').forEach(el => {
            el.classList.add(config.animateClass);
        });
        return;
    }
    
    // Creează observer pentru animații
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                
                // Adaugă clasa pentru animație
                target.classList.add(config.animateClass);
                
                // Adaugă delay dacă este specificat
                const delay = target.getAttribute('data-animation-delay');
                if (delay) {
                    target.style.animationDelay = `${delay}ms`;
                }
                
                // Dezabonează elementul dacă animația rulează doar o dată
                if (config.once) {
                    animationObserver.unobserve(target);
                }
            } else if (!config.once) {
                // Elimină clasa când elementul nu mai este vizibil (dacă nu e once)
                entry.target.classList.remove(config.animateClass);
            }
        });
    }, {
        threshold: config.threshold,
        rootMargin: `${config.offset.top}px 0px ${config.offset.bottom}px 0px`
    });
    
    // Observă toate elementele cu clasă .animate
    document.querySelectorAll('.animate').forEach(el => {
        animationObserver.observe(el);
    });
    
    return animationObserver;
}

/**
 * Animează un element cu o animație specifică
 * @param {HTMLElement} element - Elementul de animat
 * @param {string} animationType - Tipul de animație (fadeIn, fadeOut, etc.)
 * @param {number} duration - Durata animației în milisecunde
 * @returns {Promise} - Promise care se rezolvă când animația este completă
 */
export function animateElement(element, animationType, duration = 300) {
    return new Promise(resolve => {
        if (!element) {
            resolve();
            return;
        }
        
        // Setează durata animației
        element.style.animationDuration = `${duration}ms`;
        
        // Adaugă clasele pentru animație
        element.classList.add('animated', animationType);
        
        // Handler pentru evenimentul de finalizare a animației
        const animationEndHandler = () => {
            element.classList.remove('animated', animationType);
            element.removeEventListener('animationend', animationEndHandler);
            resolve();
        };
        
        // Ascultă pentru evenimentul de finalizare a animației
        element.addEventListener('animationend', animationEndHandler);
    });
}

/**
 * Adaugă efecte de hover pentru elementele specificate
 * @param {string} selector - Selector CSS pentru elementele țintă
 * @param {Object} effects - Efecte de aplicat (clase CSS)
 */
export function addHoverEffects(selector, effects) {
    document.querySelectorAll(selector).forEach(element => {
        element.addEventListener('mouseenter', () => {
            if (effects.enter) {
                element.classList.add(effects.enter);
            }
        });
        
        element.addEventListener('mouseleave', () => {
            if (effects.enter) {
                element.classList.remove(effects.enter);
            }
            
            if (effects.leave) {
                element.classList.add(effects.leave);
                
                // Elimină clasa după animație
                element.addEventListener('animationend', () => {
                    element.classList.remove(effects.leave);
                }, { once: true });
            }
        });
    });
}
