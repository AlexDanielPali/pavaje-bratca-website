/**
 * Feature Detection and Utils Module
 * 
 * Acest modul oferă funcții pentru detecția de feature-uri și utilități generale
 * Util pentru a asigura compatibilitatea cu diverse browsere și dispozitive
 */

/**
 * Detectează suportul pentru diverse funcții și API-uri ale browser-ului
 * @returns {Object} - Obiect cu rezultatele detecției
 */
export function detectFeatures() {
    return {
        // API-uri moderne
        intersectionObserver: 'IntersectionObserver' in window,
        resizeObserver: 'ResizeObserver' in window,
        mutationObserver: 'MutationObserver' in window,
        
        // Funcționalități CSS
        grid: window.CSS && CSS.supports('display', 'grid'),
        flexbox: window.CSS && CSS.supports('display', 'flex'),
        cssVariables: window.CSS && CSS.supports('(--a: 0)'),
        
        // Storage
        localStorage: (() => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch (e) {
                return false;
            }
        })(),
        
        // Touch și dispozitive
        touchDevice: ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0) || 
                     (navigator.msMaxTouchPoints > 0),
        
        // Media și grafică
        webp: false, // Va fi setat după testare
        webgl: (() => {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && 
                        (canvas.getContext('webgl') || 
                         canvas.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        })(),
        
        // API-uri pentru web
        webShare: 'share' in navigator,
        notification: 'Notification' in window,
        geolocation: 'geolocation' in navigator,
        
        // Performanță
        deviceMemory: 'deviceMemory' in navigator ? navigator.deviceMemory : undefined,
        
        // Conectivitate
        onLine: navigator.onLine,
        connectionType: navigator.connection ? 
                       (navigator.connection.effectiveType || navigator.connection.type) : 
                       undefined
    };
}

/**
 * Adaugă clase la <html> în funcție de feature-urile detectate
 */
export function addFeatureClasses() {
    const features = detectFeatures();
    const html = document.documentElement;
    
    // Adaugă clasa pentru JavaScript activat
    html.classList.remove('no-js');
    html.classList.add('js');
    
    // Adaugă clase pentru feature-uri
    for (const [feature, isSupported] of Object.entries(features)) {
        if (typeof isSupported === 'boolean') {
            html.classList.add(isSupported ? `has-${feature}` : `no-${feature}`);
        }
    }
    
    // Adaugă clasă pentru touch/no-touch
    html.classList.add(features.touchDevice ? 'touch' : 'no-touch');
    
    // Detectează suport pentru WebP
    detectWebpSupport().then(hasWebP => {
        html.classList.add(hasWebP ? 'has-webp' : 'no-webp');
    });
}

/**
 * Detectează suportul pentru formatul WebP
 * @returns {Promise<boolean>} - Promise care indică suportul pentru WebP
 */
export function detectWebpSupport() {
    return new Promise(resolve => {
        const webpImage = new Image();
        
        webpImage.onload = function() {
            resolve(webpImage.width === 1);
        };
        
        webpImage.onerror = function() {
            resolve(false);
        };
        
        webpImage.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    });
}

/**
 * Generează un ID unic
 * @param {string} prefix - Prefix pentru ID (opțional)
 * @returns {string} - ID-ul generat
 */
export function generateUniqueId(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce funcție (limitează apelurile la funcții)
 * @param {Function} func - Funcția de apelat
 * @param {number} wait - Timpul de așteptare în ms
 * @returns {Function} - Funcția cu debounce
 */
export function debounce(func, wait = 200) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle funcție (limitează frecvența apelurilor)
 * @param {Function} func - Funcția de apelat
 * @param {number} limit - Limita de timp în ms
 * @returns {Function} - Funcția cu throttle
 */
export function throttle(func, limit = 200) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Serializează un obiect pentru URL query string
 * @param {Object} obj - Obiectul de serializat
 * @returns {string} - Query string
 */
export function serializeObject(obj) {
    return Object.keys(obj)
        .filter(key => obj[key] !== undefined && obj[key] !== null)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
}

/**
 * Parse query string în obiect
 * @param {string} queryString - Query string (fără ?)
 * @returns {Object} - Obiect cu parametrii
 */
export function parseQueryString(queryString) {
    const params = {};
    const queries = queryString.replace(/^\?/, '').split('&');
    
    for (const query of queries) {
        if (!query) continue;
        
        const [key, value] = query.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    
    return params;
}

/**
 * Format număr cu separatori de mii
 * @param {number} number - Numărul de formatat
 * @param {string} locale - Localizarea (ex: 'ro-RO')
 * @returns {string} - Număr formatat
 */
export function formatNumber(number, locale = 'ro-RO') {
    return new Intl.NumberFormat(locale).format(number);
}

/**
 * Format dată
 * @param {Date|string|number} date - Data de formatat
 * @param {string} locale - Localizarea (ex: 'ro-RO')
 * @param {Object} options - Opțiuni de formatare
 * @returns {string} - Data formatată
 */
export function formatDate(date, locale = 'ro-RO', options = {}) {
    const defaultOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
}
