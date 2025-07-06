/**
 * Gallery Module
 * 
 * Acest modul implementează galeria de imagini cu funcționalitate lightbox
 * Oferă navigare între imagini, zoom, pan și interacțiuni touch
 */

// Configurație implicită pentru galerie
const defaultConfig = {
    selector: '.gallery__item',
    imageSelector: 'img',
    captionSelector: 'figcaption',
    lightboxClass: 'lightbox',
    activeClass: 'lightbox--active',
    closeButtonClass: 'lightbox__close',
    imageClass: 'lightbox__image',
    captionClass: 'lightbox__caption',
    prevButtonClass: 'lightbox__button lightbox__button--prev',
    nextButtonClass: 'lightbox__button lightbox__button--next',
    enableKeyboard: true,
    enableSwipe: true,
    loop: true,
    preloadImages: 2, // Mărit pentru a preîncărca mai multe imagini
    animationDuration: 300,
    closeOnClickOutside: true,
    ariaLabels: {
        close: 'Închide galeria',
        prev: 'Imaginea anterioară',
        next: 'Imaginea următoare'
    }
};

/**
 * Inițializează galeria cu lightbox
 * @param {Object} options - Opțiuni de configurare
 */
export function initializeGallery(options = {}) {
    // Merge options
    const config = { ...defaultConfig, ...options };
    
    // Elementele galeriei
    const galleryItems = document.querySelectorAll(config.selector);
    
    if (!galleryItems.length) return;
    
    // Creează lightbox dacă nu există
    let lightbox = document.querySelector(`.${config.lightboxClass}`);
    
    if (!lightbox) {
        lightbox = createLightbox(config);
        document.body.appendChild(lightbox);
    }
    
    // Obține elementele din lightbox
    const lightboxImage = lightbox.querySelector(`.${config.imageClass}`);
    const lightboxCaption = lightbox.querySelector(`.${config.captionClass}`);
    const closeButton = lightbox.querySelector(`.${config.closeButtonClass}`);
    const prevButton = lightbox.querySelector('.lightbox__button--prev');
    const nextButton = lightbox.querySelector('.lightbox__button--next');
    const counter = lightbox.querySelector('.lightbox__counter');
    
    // Index pentru imaginea curentă
    let currentIndex = 0;
    const totalImages = galleryItems.length;
    
    // Preload Images Cache
    const imagesCache = new Map();
    
    // Optimizare pentru gestionarea unui număr mare de imagini
    const visibleItems = new Set();
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                visibleItems.add(entry.target);
            } else {
                visibleItems.delete(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    });
    
    // Observă elementele din galerie
    galleryItems.forEach(item => {
        observer.observe(item);
    });
    
    // Adaugă evenimente pentru elementele din galerie
    galleryItems.forEach((item, index) => {
        const link = item.tagName === 'A' ? item : item.querySelector('a');
        
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                openLightbox(index);
            });
        } else {
            // Adaugă event listener direct pe imagine
            const img = item.querySelector(config.imageSelector);
            if (img) {
                img.addEventListener('click', () => {
                    openLightbox(index);
                });
            } else {
                // Fallback la click pe întregul item
                item.addEventListener('click', () => {
                    openLightbox(index);
                });
            }
        }
    });
    
    // Funcție pentru deschiderea lightbox-ului
    function openLightbox(index) {
        currentIndex = index;
        updateLightboxContent();
        updateCounter();
        
        // Dezactivează scroll pe pagină
        document.body.style.overflow = 'hidden';
        
        // Afișează lightbox-ul
        lightbox.style.display = 'flex';
        setTimeout(() => {
            lightbox.classList.add(config.activeClass);
        }, 10);
        
        // Preload imagini adiacente
        preloadAdjacentImages(currentIndex);
    }
    
    // Funcție pentru actualizarea conținutului lightbox
    function updateLightboxContent() {
        const item = galleryItems[currentIndex];
        const img = item.querySelector(config.imageSelector);
        const caption = item.querySelector(config.captionSelector);
        
        // Obține URL-ul imaginii
        const imgSrc = img.getAttribute('data-large') || img.getAttribute('src');
        
        // Verifică dacă imaginea este deja în cache
        if (imagesCache.has(imgSrc)) {
            lightboxImage.src = imgSrc;
        } else {
            // Afișează indicator de încărcare
            lightboxImage.classList.add('loading');
            
            // Încarcă imaginea
            const tempImg = new Image();
            tempImg.onload = () => {
                lightboxImage.src = imgSrc;
                lightboxImage.classList.remove('loading');
                imagesCache.set(imgSrc, true);
            };
            tempImg.src = imgSrc;
        }
        
        // Actualizează caption
        if (caption && lightboxCaption) {
            lightboxCaption.textContent = caption.textContent;
            lightboxCaption.style.display = '';
        } else if (lightboxCaption) {
            lightboxCaption.style.display = 'none';
        }
    }
    
    // Funcție pentru actualizarea contorului de imagini
    function updateCounter() {
        if (counter) {
            counter.textContent = `${currentIndex + 1} / ${totalImages}`;
        }
    }
    
    // Funcție pentru preîncărcarea imaginilor adiacente
    function preloadAdjacentImages(index) {
        const indicesToPreload = [];
        
        // Adaugă indecșii pentru preîncărcare
        for (let i = 1; i <= config.preloadImages; i++) {
            // Adaugă următoarele imagini
            if (config.loop || index + i < galleryItems.length) {
                indicesToPreload.push((index + i) % galleryItems.length);
            }
            
            // Adaugă imaginile anterioare
            if (config.loop || index - i >= 0) {
                indicesToPreload.push((index - i + galleryItems.length) % galleryItems.length);
            }
        }
        
        // Preîncarcă imaginile
        indicesToPreload.forEach(idx => {
            const item = galleryItems[idx];
            const img = item.querySelector(config.imageSelector);
            const imgSrc = img.getAttribute('data-large') || img.getAttribute('src');
            
            if (!imagesCache.has(imgSrc)) {
                const tempImg = new Image();
                tempImg.onload = () => {
                    imagesCache.set(imgSrc, true);
                };
                tempImg.src = imgSrc;
            }
        });
    }
    
    // Funcție pentru navigare la imaginea anterioară
    function showPrevImage() {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        updateLightboxContent();
        updateCounter();
        preloadAdjacentImages(currentIndex);
    }
    
    // Funcție pentru navigare la imaginea următoare
    function showNextImage() {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        updateLightboxContent();
        updateCounter();
        preloadAdjacentImages(currentIndex);
    }
    
    // Funcție pentru închiderea lightbox-ului
    function closeLightbox() {
        lightbox.classList.remove(config.activeClass);
        
        setTimeout(() => {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
            
            // Resetează transformările
            lightboxImage.style.transform = '';
            lightboxImage.dataset.scale = '1';
            lightboxImage.dataset.translateX = '0';
            lightboxImage.dataset.translateY = '0';
        }, config.animationDuration);
    }
    
    // Adaugă evenimente pentru butoane
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeLightbox();
        });
    }
    
    if (prevButton) {
        prevButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showPrevImage();
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showNextImage();
        });
    }
    
    // Adaugă control cu tastatura
    if (config.enableKeyboard) {
        document.addEventListener('keydown', (e) => {
            if (lightbox.style.display !== 'flex') return;
            
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                showPrevImage();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            }
        });
    }
    
    // Adaugă suport pentru swipe pe mobil
    if (config.enableSwipe) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        lightbox.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const threshold = 50; // minim pixeli pentru swipe
            
            if (touchEndX < touchStartX - threshold) {
                showNextImage(); // swipe stânga
            } else if (touchEndX > touchStartX + threshold) {
                showPrevImage(); // swipe dreapta
            }
        }
    }
    
    // Click în afara imaginii pentru închidere
    if (config.closeOnClickOutside) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }
    
    // Suport pentru zoom și pan
    function setupZoomPan() {
        let isZoomed = false;
        
        // Zoom cu rotița mouse-ului
        lightboxImage.addEventListener('wheel', (e) => {
            if (!isZoomed) return;
            e.preventDefault();
            
            // Obține coordonatele cursorului relativ la imagine
            const rect = lightboxImage.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Calculează poziția relativă a cursorului (0-1)
            const relX = mouseX / rect.width;
            const relY = mouseY / rect.height;
            
            // Obține scale și translate curente
            let scale = parseFloat(lightboxImage.dataset.scale || '1');
            let translateX = parseFloat(lightboxImage.dataset.translateX || '0');
            let translateY = parseFloat(lightboxImage.dataset.translateY || '0');
            
            // Ajustează scale în funcție de direcția scrollului
            const delta = e.deltaY * -0.01;
            const newScale = Math.max(1, Math.min(5, scale + delta));
            
            if (scale !== newScale) {
                // Calculează noul translate pentru a menține poziția cursorului
                const scaleRatio = newScale / scale;
                translateX = mouseX - (mouseX - translateX) * scaleRatio;
                translateY = mouseY - (mouseY - translateY) * scaleRatio;
                
                // Limitează translate pentru a nu ieși imaginea din vizualizare
                const maxTranslateX = (newScale - 1) * rect.width / 2;
                const maxTranslateY = (newScale - 1) * rect.height / 2;
                
                translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
                translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
                
                // Actualizează transformarea
                scale = newScale;
                
                lightboxImage.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
                lightboxImage.dataset.scale = scale.toString();
                lightboxImage.dataset.translateX = translateX.toString();
                lightboxImage.dataset.translateY = translateY.toString();
            }
        });
        
        // Dublu-click pentru zoom
        lightboxImage.addEventListener('dblclick', (e) => {
            e.preventDefault();
            
            const rect = lightboxImage.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            let scale = parseFloat(lightboxImage.dataset.scale || '1');
            let translateX = parseFloat(lightboxImage.dataset.translateX || '0');
            let translateY = parseFloat(lightboxImage.dataset.translateY || '0');
            
            if (scale > 1) {
                // Reset la normal
                scale = 1;
                translateX = 0;
                translateY = 0;
                isZoomed = false;
            } else {
                // Zoom la poziția click-ului
                scale = 2.5;
                translateX = (rect.width / 2 - mouseX) * 0.5;
                translateY = (rect.height / 2 - mouseY) * 0.5;
                isZoomed = true;
            }
            
            lightboxImage.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
            lightboxImage.dataset.scale = scale.toString();
            lightboxImage.dataset.translateX = translateX.toString();
            lightboxImage.dataset.translateY = translateY.toString();
        });
        
        // Pan cu mouse când e zoomed in
        let isDragging = false;
        let startX, startY, startTranslateX, startTranslateY;
        
        lightboxImage.addEventListener('mousedown', (e) => {
            if (parseFloat(lightboxImage.dataset.scale || '1') <= 1) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startTranslateX = parseFloat(lightboxImage.dataset.translateX || '0');
            startTranslateY = parseFloat(lightboxImage.dataset.translateY || '0');
            
            lightboxImage.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        lightbox.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const scale = parseFloat(lightboxImage.dataset.scale || '1');
            const rect = lightboxImage.getBoundingClientRect();
            
            const dx = (e.clientX - startX) / scale;
            const dy = (e.clientY - startY) / scale;
            
            let translateX = startTranslateX + dx;
            let translateY = startTranslateY + dy;
            
            // Limitează translate
            const maxTranslateX = (scale - 1) * rect.width / (2 * scale);
            const maxTranslateY = (scale - 1) * rect.height / (2 * scale);
            
            translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
            translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));
            
            lightboxImage.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
            lightboxImage.dataset.translateX = translateX.toString();
            lightboxImage.dataset.translateY = translateY.toString();
        });
        
        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                lightboxImage.style.cursor = '';
            }
        });
        
        // Pentru a preveni pierderea controlului drag când mouse-ul iese din lightbox
        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const scale = parseFloat(lightboxImage.dataset.scale || '1');
                const rect = lightboxImage.getBoundingClientRect();
                
                const dx = (e.clientX - startX) / scale;
                const dy = (e.clientY - startY) / scale;
                
                        let translateX = startTranslateX + dx;
                        let translateY = startTranslateY + dy;
                    }
                });
            }
        
            // Inițializează zoom și pan
            setupZoomPan();
        }