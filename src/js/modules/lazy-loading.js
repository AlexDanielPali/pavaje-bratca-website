/**
 * Lazy Loading Module
 * 
 * Acest modul gestionează încărcarea lazy pentru imagini, iframe-uri și alte resurse
 * Folosește IntersectionObserver pentru performanță optimă
 */

// Configurație implicită
const defaultConfig = {
    rootMargin: '200px 0px', // Pre-încarcă înainte ca elementul să fie vizibil
    threshold: 0.01,
    loadingClass: 'is-loading',
    loadedClass: 'is-loaded'
};

/**
 * Inițializează lazy loading pentru imagini și alte resurse
 * @param {Object} options - Opțiuni de configurare
 */
export function initializeLazyLoading(options = {}) {
    // Merge options
    const config = { ...defaultConfig, ...options };
    
    // Verifică suportul pentru IntersectionObserver
    if (!('IntersectionObserver' in window)) {
        // Fallback pentru browsere fără suport
        loadAllElements();
        return;
    }
    
    // Creează observer-ul
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                loadElement(element);
                observer.unobserve(element);
            }
        });
    }, {
        rootMargin: config.rootMargin,
        threshold: config.threshold
    });
    
    // Adaugă toate elementele cu atributul data-src sau data-srcset
    const lazyElements = document.querySelectorAll('[data-src], [data-srcset], [data-background]');
    
    lazyElements.forEach(element => {
        // Adaugă clasa de loading
        element.classList.add(config.loadingClass);
        
        // Observă elementul
        observer.observe(element);
    });
    
    /**
     * Încarcă toate elementele (fallback pentru browsere vechi)
     */
    function loadAllElements() {
        const lazyElements = document.querySelectorAll('[data-src], [data-srcset], [data-background]');
        
        lazyElements.forEach(element => {
            loadElement(element);
        });
    }
    
    /**
     * Încarcă un singur element
     * @param {HTMLElement} element - Elementul de încărcat
     */
    function loadElement(element) {
        element.classList.add(config.loadingClass);
        
        // Încarcă imagini
        if (element.tagName === 'IMG') {
            // Verifică data-srcset pentru imagini responsive
            if (element.dataset.srcset) {
                element.srcset = element.dataset.srcset;
                element.removeAttribute('data-srcset');
            }
            
            // Încarcă src
            if (element.dataset.src) {
                element.src = element.dataset.src;
                element.removeAttribute('data-src');
            }
            
            // Event handler pentru finalizarea încărcării
            element.addEventListener('load', () => {
                element.classList.remove(config.loadingClass);
                element.classList.add(config.loadedClass);
            });
            
        } 
        // Încarcă iframe-uri
        else if (element.tagName === 'IFRAME') {
            if (element.dataset.src) {
                element.src = element.dataset.src;
                element.removeAttribute('data-src');
            }
            
            element.addEventListener('load', () => {
                element.classList.remove(config.loadingClass);
                element.classList.add(config.loadedClass);
            });
        }
        // Încarcă imagini de fundal (background-image)
        else if (element.dataset.background) {
            element.style.backgroundImage = `url('${element.dataset.background}')`;
            element.removeAttribute('data-background');
            
            // Creează o imagine temporară pentru a detecta încărcarea
            const tempImg = new Image();
            tempImg.src = element.dataset.background;
            
            tempImg.onload = () => {
                element.classList.remove(config.loadingClass);
                element.classList.add(config.loadedClass);
            };
        }
        // Încarcă alte tipuri de resurse (video, audio, etc.)
        else if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
            
            element.addEventListener('load', () => {
                element.classList.remove(config.loadingClass);
                element.classList.add(config.loadedClass);
            });
        }
    }
    
    // Returnează observer-ul și metodele
    return {
        observer,
        loadElement,
        loadAllElements
    };
}

/**
 * Inițializează lazy loading pentru imagini cu srcset (responsive)
 * @param {string} selector - Selector pentru imagini
 * @param {Object} breakpoints - Breakpoint-uri pentru responsive {viewport: imageUrl}
 */
export function setupResponsiveImages(selector, breakpoints) {
    const images = document.querySelectorAll(selector);
    
    if (!images.length) return;
    
    // Funcție care actualizează srcset-ul în funcție de viewport
    function updateImageSrc() {
        const viewportWidth = window.innerWidth;
        
        images.forEach(img => {
            let selectedSrc = null;
            let largestBreakpoint = 0;
            
            // Găsește breakpoint-ul potrivit
            for (const [breakpoint, src] of Object.entries(breakpoints)) {
                const breakpointValue = parseInt(breakpoint, 10);
                
                if (viewportWidth >= breakpointValue && breakpointValue >= largestBreakpoint) {
                    selectedSrc = src;
                    largestBreakpoint = breakpointValue;
                }
            }
            
            // Actualizează src dacă s-a găsit unul potrivit
            if (selectedSrc) {
                // Pentru imagini care nu sunt încă lazy loaded
                if (img.hasAttribute('data-src')) {
                    img.setAttribute('data-src', selectedSrc);
                } else {
                    img.src = selectedSrc;
                }
            }
        });
    }
    
    // Update la încărcare și la redimensionare
    window.addEventListener('resize', updateImageSrc);
    updateImageSrc();
    
    return {
        update: updateImageSrc
    };
}
