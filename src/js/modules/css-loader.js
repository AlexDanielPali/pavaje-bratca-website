/**
 * CSS Loader Helper
 * Modul pentru încărcarea asincronă a CSS-ului
 */

/**
 * Încarcă o foaie de stil CSS asincron
 * @param {string} url - URL-ul fișierului CSS 
 */
export function loadCSS(url) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  
  // Crează un promise care se rezolvă când CSS-ul este încărcat
  const loadPromise = new Promise((resolve, reject) => {
    link.onload = () => resolve(url);
    link.onerror = () => reject(new Error(`Eroare la încărcarea CSS: ${url}`));
  });
  
  // Adaugă link-ul în head
  document.head.appendChild(link);
  
  return loadPromise;
}

/**
 * Încarcă mai multe fișiere CSS în ordine
 * @param {Array<string>} urls - Array de URL-uri pentru fișierele CSS
 * @returns {Promise} - Promise care se rezolvă când toate fișierele sunt încărcate
 */
export function loadMultipleCSS(urls) {
  return Promise.all(urls.map(url => loadCSS(url)));
}

/**
 * Preîncarcă un fișier CSS pentru a-l avea în cache pentru mai târziu
 * @param {string} url - URL-ul fișierului CSS de preîncărcat
 */
export function preloadCSS(url) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = url;
  
  // Se adaugă un handler care va schimba preload în stylesheet când e finalizat
  link.onload = function() {
    this.onload = null;
    this.rel = 'stylesheet';
  };
  
  document.head.appendChild(link);
}

/**
 * Încarcă CSS condiționat (de ex. pentru media queries specifice)
 * @param {string} url - URL-ul fișierului CSS
 * @param {Function} condition - Funcție care returnează true sau false
 */
export function loadConditionalCSS(url, condition) {
  if (condition()) {
    loadCSS(url);
  }
}
