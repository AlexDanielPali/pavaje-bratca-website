/**
 * Main JavaScript Entry Point
 * 
 * Acest fișier inițializează toate componentele site-ului Pavaje Bratca
 * și configurează funcționalitățile necesare
 */

// Import module
import { initializeNav } from './modules/nav.js';
import { initializeSlider } from './modules/slider.js';
import { loadConditionalCSS, loadCSS, preloadCSS } from './modules/css-loader.js';
import { 
    detectFeatures, 
    addFeatureClasses, 
    debounce, 
    formatDate, 
    updateDateTime 
} from './modules/utils.js';
import { initializeLazyLoading, setupResponsiveImages } from './modules/lazy-loading.js';
import { initializeAnimations, animateElement } from './modules/animations.js';
import { initializeFormValidation, submitFormAjax } from './modules/form-validation.js';
import { initializeGallery } from './modules/gallery.js';
import { initializeBackToTop } from './modules/back-to-top.js';
import { initializeSocialSharing } from './modules/social-sharing.js';
import { initializePerformance } from './modules/performance.js';
import { initializeGallery as initializeEnhancedGallery } from './modules/enhanced-gallery.js';
import { initializeGalleryFilter } from './modules/gallery-filter.js';

/**
 * Obiect principal pentru aplicație
 */
const PavajeBratca = {
    /**
     * Metoda de inițializare principală
     */
    init() {
        // Detectează feature-uri și adaugă clase
        this.features = detectFeatures();
        addFeatureClasses();
        
        // Inițializează modulele
        this.initNavigation();
        this.initPageSpecificFeatures();
        this.setupEvents();
        this.initCommonComponents();
        
        // Înregistrează serviciul dacă este disponibil
        this.registerServiceWorker();
        
        // Log inițializare completă
        console.log('Pavaje Bratca website initialized');
    },
    
    /**
     * Inițializează navigația
     */
    initNavigation() {
        // Inițializează meniul responsive
        this.nav = initializeNav();
        
        // Implementează scroll smooth pentru link-uri de tip ancoră
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return; // Skip empty anchors
                
                e.preventDefault();
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },
    
    /**
     * Inițializează feature-uri specifice paginii curente
     */
    initPageSpecificFeatures() {
        const pageClasses = document.body.classList;
        
        // Galerie foto
        if (pageClasses.contains('gallery-page')) {
            loadConditionalCSS('src/css/components/gallery.css', () => true);
            loadConditionalCSS('src/css/components/enhanced-lightbox.css', () => true);
            
            // Inițializează sistemul de performanță pentru a gestiona încărcarea galeriei mari
            this.performance = initializePerformance();
            
            // Folosește galeria îmbunătățită pentru o experiență mai bună
            this.performance.enqueue(() => {
                this.gallery = initializeEnhancedGallery({
                    enableThumbnails: true,
                    enableZoom: true,
                    preloadImages: 3,
                    animationDuration: 300
                });
            }, 'high');
            
            // Inițializează filtrarea galeriei
            this.performance.enqueue(() => {
                this.galleryFilter = initializeGalleryFilter();
                
                // Verifică URL-ul pentru filtrare
                const urlParams = new URLSearchParams(window.location.search);
                const filterParam = urlParams.get('filter');
                
                if (filterParam && this.galleryFilter) {
                    this.galleryFilter.setFilter(filterParam);
                }
            }, 'high');
            
            // Adaugă funcționalități pentru imagini
            this.performance.enqueue(() => {
                setupResponsiveImages();
                initializeLazyLoading('.gallery__image');
                
                // Actualizează statisticile galeriei
                const galleryStatsCount = document.querySelector('.gallery-stats__count');
                if (galleryStatsCount) {
                    const galleryItems = document.querySelectorAll('.gallery__item');
                    const totalImages = galleryItems.length;
                    
                    // Efect de numărare animată
                    let count = 0;
                    const duration = 1500; // ms
                    const interval = 20; // ms
                    const increment = Math.ceil(totalImages / (duration / interval));
                    
                    const counter = setInterval(() => {
                        count = Math.min(count + increment, totalImages);
                        galleryStatsCount.textContent = count;
                        
                        if (count >= totalImages) {
                            clearInterval(counter);
                            galleryStatsCount.textContent = totalImages;
                            galleryStatsCount.classList.add('animate');
                            
                            // Afișează categorii de imagini
                            if (this.galleryFilter) {
                                const categories = this.galleryFilter.getCategories();
                                let categoryText = '';
                                categories.forEach((count, category) => {
                                    categoryText += `${category}: ${count}, `;
                                });
                                
                                if (categoryText) {
                                    const statsElement = document.querySelector('.gallery-stats');
                                    const categoriesElement = document.createElement('p');
                                    categoriesElement.className = 'gallery-stats__categories';
                                    categoriesElement.textContent = categoryText.slice(0, -2);
                                    statsElement.appendChild(categoriesElement);
                                }
                            }
                        }
                    }, interval);
                }
                
                // Inițializează funcționalitatea de partajare pentru fiecare imagine
                if (this.features.shareApi) {
                    const shareButtons = document.querySelectorAll('.gallery__share');
                    if (shareButtons.length > 0) {
                        shareButtons.forEach(button => {
                            button.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const item = button.closest('.gallery__item');
                                const img = item.querySelector('img');
                                const caption = item.querySelector('figcaption');
                                
                                const shareData = {
                                    title: 'Pavaje Bratca - Galerie',
                                    text: caption ? caption.textContent : 'Lucrare de calitate de la Pavaje Bratca',
                                    url: window.location.href
                                };
                                
                                navigator.share(shareData)
                                    .catch(err => console.warn('Error sharing:', err));
                            });
                        });
                    }
                }
            }, 'low');
        }
        
        // Pagina de servicii
        if (pageClasses.contains('services-page')) {
            loadConditionalCSS('src/css/components/services.css', () => true);
            
            // Inițializează sliderele pentru servicii dacă există
            if (document.querySelector('.service-slider')) {
                this.performance.enqueue(() => {
                    initializeSlider();
                }, 'normal');
            }
        }
        
        // Pagina despre noi
        if (pageClasses.contains('about-page')) {
            loadConditionalCSS('src/css/components/about.css', () => true);
            
            // Importăm modulul pentru pagina despre noi
            import('./modules/about.js').then(module => {
                // Inițializează funcționalitățile pentru pagina despre noi
                this.performance.enqueue(() => {
                    module.initAboutPage();
                    module.enhanceValueCards();
                    this.animateStatistics();
                }, 'normal');
            });
        }
        
        // Pagina de contact
        if (pageClasses.contains('contact-page')) {
            loadConditionalCSS('src/css/components/contact.css', () => true);
            
            // Importăm modulul pentru pagina de contact
            import('./modules/contact.js').then(module => {
                // Inițializează funcționalitățile pentru pagina de contact
                this.performance.enqueue(() => {
                    module.initContactPage();
                }, 'normal');
            });
            
            // Inițializează harta dacă există
            this.performance.enqueue(() => {
                this.initMap();
            }, 'low');
        }
        
        // Pagina principală (home)
        if (pageClasses.contains('home-page')) {
            // Încarcă CSS specific pentru hero
            loadConditionalCSS('src/css/components/hero.css', () => true);
            
            // Inițializează slider dacă există
            if (document.querySelector('.slider')) {
                this.performance.enqueue(() => {
                    initializeSlider();
                }, 'high');
            }
        }
    },
    
    /**
     * Inițializează componente comune tuturor paginilor
     */
    initCommonComponents() {
        // Inițializează modulul de performanță pentru prioritizarea sarcinilor JavaScript
        this.performance = initializePerformance({
            debugMode: false,
            minIdleTime: 1000
        });
        
        // Lazy loading pentru imagini
        this.lazyLoad = initializeLazyLoading();
        
        // Imagini responsive
        this.responsiveImages = setupResponsiveImages('.responsive-image', {
            '480': 'small',
            '768': 'medium',
            '1200': 'large'
        });
        
        // Inițializează butonul back-to-top
        this.backToTop = initializeBackToTop({
            scrollThreshold: 300,
            scrollDuration: 800
        });
        
        // Inițializează partajarea socială pentru orice container existent
        this.socialSharing = initializeSocialSharing('.social-share');
        
        // Actualizează data și ora dacă există elemente pentru asta
        if (document.getElementById('date') || document.getElementById('time')) {
            updateDateTime();
        }
        
        // Inițializează animații
        this.animations = initializeAnimations();
        
        // Încarcă CSS pentru dispozitive mobile
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            loadConditionalCSS('src/css/mobile.css', () => true);
        }
    },
    
    /**
     * Configurează evenimente globale
     */
    setupEvents() {
        // Eveniment de redimensionare window
        window.addEventListener('resize', debounce(() => {
            // Actualizează componente responsive
            if (this.responsiveImages) {
                this.responsiveImages.update();
            }
        }, 250));
        
        // Tratează evenimente de scroll
        window.addEventListener('scroll', debounce(() => {
            // Implementează funcționalități la scroll dacă este necesar
            this.handleScroll();
        }, 100), { passive: true });
    },
    
    /**
     * Gestionează trimiterea formularului de contact
     * @param {HTMLFormElement} form - Formularul de contact
     */
    async handleContactFormSubmit(form) {
        try {
            // Arată indicator de încărcare
            const submitBtn = form.querySelector('[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Se trimite...';
            
            // Trimite formularul prin AJAX
            const response = await submitFormAjax(form);
            
            // Arată mesaj de succes
            form.reset();
            this.showNotification('Mesajul a fost trimis cu succes!', 'success');
            
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showNotification('A apărut o eroare. Vă rugăm încercați din nou.', 'error');
        } finally {
            // Resetează butonul
            const submitBtn = form.querySelector('[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    },
    
    /**
     * Afișează notificare pentru utilizator
     * @param {string} message - Mesajul de afișat
     * @param {string} type - Tipul notificării (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Verifică dacă există deja un container pentru notificări
        let notificationsContainer = document.querySelector('.notifications');
        
        if (!notificationsContainer) {
            notificationsContainer = document.createElement('div');
            notificationsContainer.className = 'notifications';
            document.body.appendChild(notificationsContainer);
        }
        
        // Creează elementul de notificare
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">${message}</div>
            <button class="notification__close" aria-label="Închide">&times;</button>
        `;
        
        // Adaugă în container
        notificationsContainer.appendChild(notification);
        
        // Animează intrarea
        setTimeout(() => {
            notification.classList.add('notification--visible');
        }, 10);
        
        // Adaugă funcționalitate de închidere
        const closeBtn = notification.querySelector('.notification__close');
        closeBtn.addEventListener('click', () => {
            this.closeNotification(notification);
        });
        
        // Auto-închidere după 5 secunde pentru success și info
        if (type !== 'error') {
            setTimeout(() => {
                this.closeNotification(notification);
            }, 5000);
        }
    },
    
    /**
     * Închide o notificare
     * @param {HTMLElement} notification - Elementul notificării
     */
    closeNotification(notification) {
        notification.classList.remove('notification--visible');
        
        // Elimină din DOM după animație
        setTimeout(() => {
            notification.remove();
        }, 300);
    },
    
    /**
     * Animează statisticile din pagina About
     */
    animateStatistics() {
        const stats = document.querySelectorAll('.stat-counter');
        
        if (!stats.length) return;
        
        // Observer pentru animația de numărare
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statElement = entry.target;
                    const targetValue = parseInt(statElement.getAttribute('data-value'), 10);
                    const duration = 2000; // 2 secunde
                    const startTime = performance.now();
                    
                    // Animează numărul
                    function updateCounter(currentTime) {
                        const elapsedTime = currentTime - startTime;
                        const progress = Math.min(elapsedTime / duration, 1);
                        
                        // Folosește easing pentru o animație mai naturală
                        const easedProgress = easeOutExpo(progress);
                        const currentValue = Math.floor(targetValue * easedProgress);
                        
                        statElement.textContent = currentValue;
                        
                        if (progress < 1) {
                            requestAnimationFrame(updateCounter);
                        } else {
                            statElement.textContent = targetValue;
                        }
                    }
                    
                    requestAnimationFrame(updateCounter);
                    observer.unobserve(statElement);
                }
            });
        });
        
        stats.forEach(stat => {
            observer.observe(stat);
        });
        
        // Funcție easing pentru animație
        function easeOutExpo(x) {
            return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
        }
    },
    
    /**
     * Inițializează harta pentru pagina de contact
     */
    initMap() {
        const mapContainer = document.getElementById('contact-map');
        if (!mapContainer) return;
        
        // Cod pentru inițializarea hărții
        // Exemplu pentru Leaflet sau Google Maps poate fi adăugat aici
    },
    
    /**
     * Gestionează evenimentele de scroll
     */
    handleScroll() {
        // Verifică poziția scrollului
        const scrollY = window.scrollY;
        
        // Header compact la scroll
        const header = document.querySelector('.header');
        if (header) {
            if (scrollY > 100) {
                header.classList.add('header--compact');
            } else {
                header.classList.remove('header--compact');
            }
        }
        
        // Back-to-top button
        const backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
            if (scrollY > 300) {
                backToTop.classList.add('back-to-top--visible');
            } else {
                backToTop.classList.remove('back-to-top--visible');
            }
        }
    },
    
    /**
     * Înregistrează Service Worker pentru funcționalități offline
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker înregistrat cu succes:', registration);
                    })
                    .catch(error => {
                        console.error('Eroare la înregistrarea ServiceWorker:', error);
                    });
            });
        }
    }
};

// Inițializează aplicația la încărcarea documentului
document.addEventListener('DOMContentLoaded', () => {
    PavajeBratca.init();
});