/**
 * Back to Top Button Module
 * 
 * Implementează un buton care permite utilizatorului să se întoarcă rapid 
 * la începutul paginii când derulează în jos.
 */

/**
 * Inițializează butonul Back to Top
 * @param {Object} options - Opțiuni de configurare
 * @returns {Object} - Obiect cu metode de control pentru buton
 */
export function initializeBackToTop(options = {}) {
    // Configurație implicită
    const config = {
        scrollThreshold: 300,
        scrollDuration: 800,
        buttonClass: 'back-to-top',
        visibleClass: 'back-to-top--visible',
        ...options
    };
    
    // Verifică dacă butonul există deja, dacă nu, îl creează
    let backToTopButton = document.querySelector(`.${config.buttonClass}`);
    
    if (!backToTopButton) {
        backToTopButton = createBackToTopButton(config.buttonClass);
        document.body.appendChild(backToTopButton);
    }
    
    // Funcția de scroll smooth
    const smoothScroll = (targetPosition, duration) => {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        // Funcție de easing
        const easeInOutQuad = (t) => {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        };
        
        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = easeInOutQuad(progress);
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };
        
        requestAnimationFrame(animation);
    };
    
    // Adaugă event listener pentru click
    backToTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        smoothScroll(0, config.scrollDuration);
    });
    
    // Adaugă event listener pentru scroll
    const handleScroll = () => {
        if (window.pageYOffset > config.scrollThreshold) {
            backToTopButton.classList.add(config.visibleClass);
        } else {
            backToTopButton.classList.remove(config.visibleClass);
        }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Verifică poziția inițială
    handleScroll();
    
    // Returnează obiect cu metode pentru controlul butonului
    return {
        show() {
            backToTopButton.classList.add(config.visibleClass);
        },
        
        hide() {
            backToTopButton.classList.remove(config.visibleClass);
        },
        
        destroy() {
            window.removeEventListener('scroll', handleScroll);
            if (backToTopButton.parentNode) {
                backToTopButton.parentNode.removeChild(backToTopButton);
            }
        }
    };
}

/**
 * Creează elementul butonului Back to Top
 * @param {string} className - Clasa CSS pentru buton
 * @returns {HTMLElement} - Butonul creat
 */
function createBackToTopButton(className) {
    const button = document.createElement('button');
    button.className = className;
    button.setAttribute('aria-label', 'Înapoi sus');
    button.setAttribute('title', 'Înapoi sus');
    
    // Adaugă iconița
    button.innerHTML = '<i class="fas fa-chevron-up" aria-hidden="true"></i>';
    
    return button;
}
